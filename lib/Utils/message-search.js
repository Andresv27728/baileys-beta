/**
 * Message Search Utilities
 * Ported from @innovatorssoft/baileys
 */

export const extractMessageText = (message) => {
    const content = message.message
    if (!content) return ''

    if (content.conversation) return content.conversation
    if (content.extendedTextMessage?.text) return content.extendedTextMessage.text

    if (content.imageMessage?.caption) return content.imageMessage.caption
    if (content.videoMessage?.caption) return content.videoMessage.caption
    if (content.documentMessage?.caption) return content.documentMessage.caption

    if (content.documentMessage?.fileName) return content.documentMessage.fileName

    if (content.locationMessage?.name) return content.locationMessage.name
    if (content.locationMessage?.address) return content.locationMessage.address

    if (content.contactMessage?.displayName) return content.contactMessage.displayName

    if (content.pollCreationMessage?.name) return content.pollCreationMessage.name

    return ''
}

const getMessageType = (message) => {
    const content = message.message
    if (!content) return 'other'

    if (content.conversation || content.extendedTextMessage) return 'text'
    if (content.imageMessage) return 'image'
    if (content.videoMessage) return 'video'
    if (content.documentMessage) return 'document'
    if (content.audioMessage) return 'audio'
    if (content.stickerMessage) return 'sticker'
    if (content.locationMessage || content.liveLocationMessage) return 'location'
    if (content.contactMessage || content.contactsArrayMessage) return 'contact'

    return 'other'
}

const calculateRelevance = (query, text, position) => {
    let score = 100

    if (text.toLowerCase() === query.toLowerCase()) {
        score += 50
    }

    score -= Math.min(position / 10, 20)

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    if (
        position === 0 ||
        lowerText[position - 1] === ' ' ||
        lowerText[position + lowerQuery.length] === ' ' ||
        position + lowerQuery.length === text.length
    ) {
        score += 20
    }

    return Math.max(score, 0)
}

export const searchMessages = (messages, query, options = {}) => {
    const results = []
    const searchQuery = options.caseSensitive ? query : query.toLowerCase()

    for (const message of messages) {
        if (options.jid && message.key.remoteJid !== options.jid) continue

        const ts = message.messageTimestamp
        const messageTime = ts
            ? new Date(typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000)
            : null

        if (options.fromDate && messageTime && messageTime < options.fromDate) continue
        if (options.toDate && messageTime && messageTime > options.toDate) continue

        if (options.fromSender && message.key.participant !== options.fromSender) continue
        if (options.fromMe !== undefined && message.key.fromMe !== options.fromMe) continue

        if (options.messageTypes && options.messageTypes.length > 0) {
            const type = getMessageType(message)
            if (!options.messageTypes.includes(type)) continue
        }

        const text = extractMessageText(message)
        if (!text) continue

        const searchText = options.caseSensitive ? text : text.toLowerCase()
        const position = searchText.indexOf(searchQuery)

        if (position !== -1) {
            results.push({
                message,
                matchedText: text.substring(
                    Math.max(0, position - 20),
                    Math.min(text.length, position + query.length + 20)
                ),
                matchPosition: position,
                relevanceScore: calculateRelevance(query, text, position)
            })
        }

        if (options.limit && results.length >= options.limit) break
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return results
}

export const searchMessagesRegex = (messages, pattern, options = {}) => {
    const results = []

    for (const message of messages) {
        if (options.jid && message.key.remoteJid !== options.jid) continue
        if (options.fromSender && message.key.participant !== options.fromSender) continue
        if (options.fromMe !== undefined && message.key.fromMe !== options.fromMe) continue

        if (options.messageTypes && options.messageTypes.length > 0) {
            const type = getMessageType(message)
            if (!options.messageTypes.includes(type)) continue
        }

        const text = extractMessageText(message)
        if (!text) continue

        const match = text.match(pattern)
        if (match) {
            results.push({
                message,
                matchedText: match[0],
                matchPosition: match.index || 0,
                relevanceScore: 100
            })
        }

        if (options.limit && results.length >= options.limit) break
    }

    return results
}

export class MessageSearchManager {
    constructor() {
        this.messages = []
        this.messageIndex = new Map()
    }

    addMessages(messages) {
        for (const msg of messages) {
            const id = msg.key.id
            if (id && !this.messageIndex.has(id)) {
                this.messages.push(msg)
                this.messageIndex.set(id, msg)
            }
        }
    }

    removeMessages(messageIds) {
        const idSet = new Set(messageIds)
        this.messages = this.messages.filter(m => !idSet.has(m.key.id || ''))
        for (const id of messageIds) {
            this.messageIndex.delete(id)
        }
    }

    clear() {
        this.messages = []
        this.messageIndex.clear()
    }

    get count() {
        return this.messages.length
    }

    search(query, options) {
        return searchMessages(this.messages, query, options)
    }

    searchRegex(pattern, options) {
        return searchMessagesRegex(this.messages, pattern, options)
    }

    getByJid(jid) {
        return this.messages.filter(m => m.key.remoteJid === jid)
    }

    getBySender(sender) {
        return this.messages.filter(m => m.key.participant === sender || m.key.remoteJid === sender)
    }

    getByType(type) {
        return this.messages.filter(m => getMessageType(m) === type)
    }

    getById(id) {
        return this.messageIndex.get(id)
    }
}

export const createMessageSearch = () => {
    return new MessageSearchManager()
}
