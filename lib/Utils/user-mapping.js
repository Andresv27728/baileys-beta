import { isLid, isLidConverted, resolveAnyLidToJid, getCachedJid } from './lid-utils.js';

const userDataCache = new Map();
const USER_DATA_CACHE_TTL = 1000 * 60 * 60 * 24;

function cacheUserData(jid, data) {
    if (!jid || !data) return;
    const cleanJid = jid.replace(/@.+/, '');
    userDataCache.set(cleanJid, {
        ...data,
        _cachedAt: Date.now()
    });
}

function getCachedUserData(jid) {
    if (!jid) return null;
    const cleanJid = jid.replace(/@.+/, '');
    const cached = userDataCache.get(cleanJid);
    if (!cached) return null;
    if (Date.now() - cached._cachedAt > USER_DATA_CACHE_TTL) {
        userDataCache.delete(cleanJid);
        return null;
    }
    return cached;
}

function extractUsernameFromContact(contact) {
    if (!contact) return null;
    return contact.username || contact.name || contact.notify || contact.verifiedName || null;
}

function extractUsernameFromMessage(message) {
    if (!message) return null;

    const pushName = message.pushName || message.senderPushName;
    if (pushName) return pushName;

    const contextInfo = message.message?.contextInfo || message.contextInfo;
    if (contextInfo) {
        if (contextInfo.pushName) return contextInfo.pushName;
        if (contextInfo.subjectOwner && contextInfo.subjectOwner !== 'unknown') return contextInfo.subjectOwner;
    }

    const biz = message.message?.biz || message.biz;
    if (biz) {
        if (biz.verifiedName) return biz.verifiedName;
        if (biz.name) return biz.name;
    }

    return null;
}

function extractUsernameFromGroupParticipant(participant) {
    if (!participant) return null;
    return participant.name || participant.notify || participant.pushName || null;
}

async function resolveUsername(jid, options = {}) {
    const { sock, groupMetadata, contacts, lidMapping } = options;

    if (!jid) return null;

    const cached = getCachedUserData(jid);
    if (cached?.username) return cached.username;

    let username = null;
    let resolvedJid = jid;

    if (isLid(jid) || isLidConverted(jid)) {
        if (groupMetadata?.participants) {
            resolvedJid = resolveAnyLidToJid(jid, groupMetadata.participants);
        } else if (lidMapping) {
            try {
                const pn = await lidMapping.getPNForLID(jid);
                if (pn && !isLid(pn) && !isLidConverted(pn)) {
                    resolvedJid = pn;
                }
            } catch { }
        } else if (sock) {
            try {
                const repo = sock.signalRepository || sock.repository;
                if (repo?.lidMapping?.getPNForLID) {
                    const pn = await repo.lidMapping.getPNForLID(jid);
                    if (pn && !isLid(pn) && !isLidConverted(pn)) {
                        resolvedJid = pn;
                    }
                }
            } catch { }
        }
    }

    if (contacts) {
        const contact = contacts[resolvedJid] || contacts[jid];
        if (contact) {
            username = extractUsernameFromContact(contact);
            if (username) {
                cacheUserData(jid, { username, jid: resolvedJid, source: 'contacts' });
                return username;
            }
        }
    }

    if (groupMetadata?.participants) {
        const participant = groupMetadata.participants.find(p => {
            const pId = (p.id || p.jid || '').replace(/@.+/, '');
            const pLid = (p.lid || '').replace(/@.+/, '');
            const targetNumber = jid.replace(/@.+/, '');
            const resolvedNumber = resolvedJid.replace(/@.+/, '');
            return pId === targetNumber || pId === resolvedNumber || pLid === targetNumber || pLid === resolvedNumber;
        });
        if (participant) {
            username = extractUsernameFromGroupParticipant(participant);
            if (username) {
                cacheUserData(jid, { username, jid: resolvedJid, source: 'group_metadata' });
                return username;
            }
        }
    }

    if (sock?.store?.contacts) {
        const contact = sock.store.contacts[resolvedJid] || sock.store.contacts[jid];
        if (contact) {
            username = extractUsernameFromContact(contact);
            if (username) {
                cacheUserData(jid, { username, jid: resolvedJid, source: 'store' });
                return username;
            }
        }
    }

    return username;
}

function buildUserMapFromMessages(messages, options = {}) {
    const userMap = new Map();

    for (const msg of messages) {
        if (!msg?.key?.remoteJid) continue;

        const senderJid = msg.key.fromMe
            ? (options.sock?.user?.id || '').split(':')[0] + '@s.whatsapp.net'
            : (msg.key.participant || msg.key.remoteJid);

        if (!userMap.has(senderJid)) {
            const username = extractUsernameFromMessage(msg);
            if (username) {
                userMap.set(senderJid, { username, source: 'message' });
            }
        }

        if (msg.message?.contextInfo?.mentionedJid) {
            for (const mentionedJid of msg.message.contextInfo.mentionedJid) {
                if (!userMap.has(mentionedJid)) {
                    userMap.set(mentionedJid, { username: null, source: 'mentioned' });
                }
            }
        }
    }

    return userMap;
}

function enrichUserMap(userMap, options = {}) {
    const { contacts, groupMetadata } = options;
    const enriched = new Map(userMap);

    for (const [jid, data] of enriched.entries()) {
        if (!data.username) {
            if (contacts) {
                const contact = contacts[jid];
                if (contact) {
                    const username = extractUsernameFromContact(contact);
                    if (username) {
                        enriched.set(jid, { ...data, username, jid, source: 'contacts' });
                    }
                }
            }
            if (!enriched.get(jid)?.username && groupMetadata?.participants) {
                const participant = groupMetadata.participants.find(p =>
                    (p.id || p.jid || '').replace(/@.+/, '') === jid.replace(/@.+/, '') ||
                    (p.lid || '').replace(/@.+/, '') === jid.replace(/@.+/, '')
                );
                if (participant) {
                    const username = extractUsernameFromGroupParticipant(participant);
                    if (username) {
                        enriched.set(jid, { ...data, username, jid, source: 'group_metadata' });
                    }
                }
            }
        }
    }

    return enriched;
}

function getUsername(jid, options = {}) {
    const cached = getCachedUserData(jid);
    if (cached?.username) return cached.username;

    if (options.userMap?.has(jid)) {
        return options.userMap.get(jid)?.username || null;
    }

    return null;
}

function getDisplayName(jid, options = {}) {
    const username = getUsername(jid, options);
    if (username) return username;

    const number = jid.replace(/@.+/, '');
    if (options.groupMetadata?.participants) {
        const participant = options.groupMetadata.participants.find(p =>
            (p.id || p.jid || '').replace(/@.+/, '') === number ||
            (p.lid || '').replace(/@.+/, '') === number
        );
        if (participant?.name) return participant.name;
    }

    return number;
}

export {
    cacheUserData,
    getCachedUserData,
    extractUsernameFromContact,
    extractUsernameFromMessage,
    extractUsernameFromGroupParticipant,
    resolveUsername,
    buildUserMapFromMessages,
    enrichUserMap,
    getUsername,
    getDisplayName,
    userDataCache
};