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

function extractFullContactData(contact) {
    if (!contact) return null;
    return {
        username: contact.username || null,
        name: contact.name || null,
        notify: contact.notify || null,
        verifiedName: contact.verifiedName || null,
        id: contact.id || null,
        lid: contact.lid || null,
        phoneNumber: contact.phoneNumber || null,
        imgUrl: contact.imgUrl || null,
        status: contact.status || null,
        isBusiness: contact.isBusiness || false,
        bizPsp: contact.bizPsp || null,
        bizDescription: contact.bizDescription || null,
        bizWebsite: contact.bizWebsite || null,
        bizCategory: contact.bizCategory || null,
        bizEmail: contact.bizEmail || null,
        bizAddress: contact.bizAddress || null,
        bizHours: contact.bizHours || null,
        ...contact
    };
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

function extractFullMessageMetadata(message) {
    if (!message) return null;
    
    const msgContent = message.message || message;
    const contextInfo = msgContent?.contextInfo || message.contextInfo;
    const biz = msgContent?.biz || message.biz;
    
    return {
        // Identificadores
        messageId: message.key?.id || null,
        remoteJid: message.key?.remoteJid || null,
        participant: message.key?.participant || null,
        fromMe: message.key?.fromMe || false,
        messageTimestamp: message.messageTimestamp || null,
        
        // Push name / sender info
        pushName: message.pushName || message.senderPushName || null,
        
        // Context info completa
        contextInfo: contextInfo ? {
            participant: contextInfo.participant || null,
            stanzaId: contextInfo.stanzaId || null,
            remoteJid: contextInfo.remoteJid || null,
            pushName: contextInfo.pushName || null,
            subjectOwner: contextInfo.subjectOwner || null,
            subjectTime: contextInfo.subjectTime || null,
            subject: contextInfo.subject || null,
            isForwarded: contextInfo.isForwarded || false,
            forwardingScore: contextInfo.forwardingScore || 0,
            mentionedJid: contextInfo.mentionedJid || [],
            groupMentions: contextInfo.groupMentions || [],
            quotedMessage: contextInfo.quotedMessage || null,
            expiration: contextInfo.expiration || null,
            ephemeralSettingTimestamp: contextInfo.ephemeralSettingTimestamp || null,
            ephemeralSharedSecret: contextInfo.ephemeralSharedSecret || null,
            mediaKey: contextInfo.mediaKey ? '<Buffer>' : null,
            messageC2SInfo: contextInfo.messageC2SInfo || null,
            deviceListMetadata: contextInfo.deviceListMetadata || null,
            deviceListMetadataVersion: contextInfo.deviceListMetadataVersion || null,
            botMetadata: contextInfo.botMetadata || null,
            sessionTransparencyMetadata: contextInfo.sessionTransparencyMetadata || null,
            ...contextInfo
        } : null,
        
        // Business info
        biz: biz ? {
            verifiedName: biz.verifiedName || null,
            name: biz.name || null,
            categories: biz.categories || [],
            website: biz.website || null,
            description: biz.description || null,
            email: biz.email || null,
            address: biz.address || null,
            hours: biz.hours || null,
            ...biz
        } : null,
        
        // Message type y contenido
        messageType: getMessageType(msgContent),
        messageContent: extractMessageContentSummary(msgContent),
        
        // Reactions, polls, etc
        reactions: message.reactions || [],
        pollUpdates: message.pollUpdates || [],
        eventResponses: message.eventResponses || [],
        
        // Metadatos adicionales
        broadcast: message.broadcast || false,
        status: message.status || null,
        messageStubType: message.messageStubType || null,
        messageStubParameters: message.messageStubParameters || [],
        
        // Lid
        lid: message.lid || null,
        
        // Raw para debug
        _rawKeys: Object.keys(message)
    };
}

function getMessageType(content) {
    if (!content) return 'unknown';
    const types = Object.keys(content);
    return types[0] || 'unknown';
}

function extractMessageContentSummary(content) {
    if (!content) return null;
    const type = getMessageType(content);
    const msg = content[type];
    if (!msg) return { type };
    
    const summary = { type };
    
    // Campos comunes
    if (msg.text) summary.text = msg.text.substring(0, 200);
    if (msg.caption) summary.caption = msg.caption.substring(0, 200);
    if (msg.conversation) summary.conversation = msg.conversation.substring(0, 200);
    
    // Media
    if (msg.url) summary.url = msg.url;
    if (msg.mimetype) summary.mimetype = msg.mimetype;
    if (msg.fileName) summary.fileName = msg.fileName;
    if (msg.fileLength) summary.fileLength = msg.fileLength;
    if (msg.mediaKey) summary.mediaKey = '<Buffer>';
    if (msg.directPath) summary.directPath = msg.directPath;
    if (msg.mediaKeyTimestamp) summary.mediaKeyTimestamp = msg.mediaKeyTimestamp;
    if (msg.fileEncSha256) summary.fileEncSha256 = '<Buffer>';
    if (msg.fileSha256) summary.fileSha256 = '<Buffer>';
    if (msg.jpegThumbnail) summary.jpegThumbnail = `<Buffer ${msg.jpegThumbnail.length} bytes>`;
    
    // Location
    if (msg.degreesLatitude) summary.latitude = msg.degreesLatitude;
    if (msg.degreesLongitude) summary.longitude = msg.degreesLongitude;
    if (msg.name) summary.locationName = msg.name;
    if (msg.address) summary.locationAddress = msg.address;
    if (msg.url) summary.locationUrl = msg.url;
    
    // Contact
    if (msg.displayName) summary.displayName = msg.displayName;
    if (msg.vcard) summary.vcard = msg.vcard?.substring(0, 200);
    
    // Interactive
    if (msg.nativeFlowMessage) {
        summary.nativeFlowMessage = {
            messageParamsJson: msg.nativeFlowMessage.messageParamsJson,
            buttonsCount: msg.nativeFlowMessage.buttons?.length || 0
        };
    }
    if (msg.interactiveMessage) {
        summary.interactiveMessage = {
            body: msg.interactiveMessage.body?.text?.substring(0, 100),
            footer: msg.interactiveMessage.footer?.text,
            headerType: msg.interactiveMessage.header?.hasMediaAttachment ? 'media' : 'text',
            nativeFlowButtons: msg.interactiveMessage.nativeFlowMessage?.buttons?.length || 0
        };
    }
    
    // Poll
    if (msg.pollCreationMessage) {
        summary.poll = {
            name: msg.pollCreationMessage.name,
            optionsCount: msg.pollCreationMessage.options?.length || 0,
            allowMultiple: msg.pollCreationMessage.allowMultiple
        };
    }
    
    // Event
    if (msg.eventMessage) {
        summary.event = {
            name: msg.eventMessage.name,
            startTime: msg.eventMessage.startTime,
            endTime: msg.eventMessage.endTime,
            description: msg.eventMessage.description?.substring(0, 100)
        };
    }
    
    // Newsletter
    if (msg.newsletterAdminInviteMessage) summary.newsletterAdminInvite = true;
    if (msg.newsletterMeta) summary.newsletterMeta = true;
    
    // Sticker
    if (msg.stickerMessage) summary.sticker = { isAnimated: msg.stickerMessage.isAnimated, isAvatar: msg.stickerMessage.isAvatar };
    
    // Audio
    if (msg.audioMessage) summary.audio = { ptt: msg.audioMessage.ptt, seconds: msg.audioMessage.seconds };
    
    // Video
    if (msg.videoMessage) summary.video = { seconds: msg.videoMessage.seconds, gifPlayback: msg.videoMessage.gifPlayback };
    
    // Document
    if (msg.documentMessage) summary.document = { title: msg.documentMessage.title, pageCount: msg.documentMessage.pageCount };
    
    return summary;
}

function extractUsernameFromGroupParticipant(participant) {
    if (!participant) return null;
    return participant.name || participant.notify || participant.pushName || null;
}

function extractFullParticipantData(participant) {
    if (!participant) return null;
    return {
        id: participant.id || null,
        jid: participant.jid || null,
        lid: participant.lid || null,
        phoneNumber: participant.phoneNumber || null,
        name: participant.name || null,
        notify: participant.notify || null,
        pushName: participant.pushName || null,
        admin: participant.admin || null,
        isSuperAdmin: participant.isSuperAdmin || false,
        invitedBy: participant.invitedBy || null,
        requestStatus: participant.requestStatus || null,
        groupsJoined: participant.groupsJoined || null,
        ...participant
    };
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
            const fullMeta = extractFullMessageMetadata(msg);
            userMap.set(senderJid, { 
                username, 
                source: 'message',
                fullMetadata: fullMeta
            });
        } else if (userMap.has(senderJid)) {
            // Actualizar metadata con el mensaje más reciente
            const existing = userMap.get(senderJid);
            existing.fullMetadata = extractFullMessageMetadata(msg);
            userMap.set(senderJid, existing);
        }

        if (msg.message?.contextInfo?.mentionedJid) {
            for (const mentionedJid of msg.message.contextInfo.mentionedJid) {
                if (!userMap.has(mentionedJid)) {
                    userMap.set(mentionedJid, { username: null, source: 'mentioned', fullMetadata: null });
                }
            }
        }
    }

    return userMap;
}

function enrichUserMap(userMap, options = {}) {
    const { contacts, groupMetadata, sock } = options;
    const enriched = new Map(userMap);

    for (const [jid, data] of enriched.entries()) {
        let updated = { ...data };
        
        // Enriquecer con contact store
        if (contacts) {
            const contact = contacts[jid];
            if (contact) {
                const username = extractUsernameFromContact(contact);
                const fullContact = extractFullContactData(contact);
                if (username) updated.username = username;
                updated.fullContactData = fullContact;
                updated.source = 'contacts';
            }
        }
        
        // Enriquecer con group metadata
        if (groupMetadata?.participants) {
            const participant = groupMetadata.participants.find(p =>
                (p.id || p.jid || '').replace(/@.+/, '') === jid.replace(/@.+/, '') ||
                (p.lid || '').replace(/@.+/, '') === jid.replace(/@.+/, '')
            );
            if (participant) {
                const username = extractUsernameFromGroupParticipant(participant);
                const fullParticipant = extractFullParticipantData(participant);
                if (username) updated.username = username;
                updated.fullParticipantData = fullParticipant;
                updated.source = updated.source === 'contacts' ? 'contacts+group' : 'group_metadata';
            }
        }
        
        // Enriquecer con sock store contacts
        if (sock?.store?.contacts && !updated.fullContactData) {
            const contact = sock.store.contacts[jid];
            if (contact) {
                const username = extractUsernameFromContact(contact);
                const fullContact = extractFullContactData(contact);
                if (username) updated.username = username;
                updated.fullContactData = fullContact;
                updated.source = 'store';
            }
        }
        
        enriched.set(jid, updated);
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

function getFullUserProfile(jid, options = {}) {
    const { userMap, groupMetadata, contacts, sock } = options;
    let profile = { jid };
    
    if (userMap?.has(jid)) {
        profile = { ...profile, ...userMap.get(jid) };
    }
    
    if (groupMetadata?.participants) {
        const participant = groupMetadata.participants.find(p =>
            (p.id || p.jid || '').replace(/@.+/, '') === jid.replace(/@.+/, '') ||
            (p.lid || '').replace(/@.+/, '') === jid.replace(/@.+/, '')
        );
        if (participant) {
            profile.fullParticipantData = extractFullParticipantData(participant);
        }
    }
    
    if (contacts) {
        const contact = contacts[jid];
        if (contact) {
            profile.fullContactData = extractFullContactData(contact);
        }
    }
    
    if (sock?.store?.contacts && !profile.fullContactData) {
        const contact = sock.store.contacts[jid];
        if (contact) {
            profile.fullContactData = extractFullContactData(contact);
        }
    }
    
    return profile;
}

export {
    cacheUserData,
    getCachedUserData,
    extractUsernameFromContact,
    extractFullContactData,
    extractUsernameFromMessage,
    extractFullMessageMetadata,
    extractUsernameFromGroupParticipant,
    extractFullParticipantData,
    resolveUsername,
    buildUserMapFromMessages,
    enrichUserMap,
    getUsername,
    getDisplayName,
    getFullUserProfile,
    userDataCache
};