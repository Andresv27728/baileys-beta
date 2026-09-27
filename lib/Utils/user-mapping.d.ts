export declare function cacheUserData(jid: string, data: { username?: string; [key: string]: any }): void;
export declare function getCachedUserData(jid: string): { username?: string; jid?: string; source?: string; _cachedAt?: number } | null;
export declare function extractUsernameFromContact(contact: any): string | null;
export declare function extractUsernameFromMessage(message: any): string | null;
export declare function extractUsernameFromGroupParticipant(participant: any): string | null;
export declare function resolveUsername(jid: string, options: {
    sock?: any;
    groupMetadata?: any;
    contacts?: Record<string, any>;
    lidMapping?: any;
}): Promise<string | null>;
export declare function buildUserMapFromMessages(messages: any[], options?: { sock?: any }): Map<string, { username: string | null; source: string }>;
export declare function enrichUserMap(userMap: Map<string, { username: string | null; source: string }>, options: { contacts?: Record<string, any>; groupMetadata?: any }): Map<string, { username: string | null; source: string; jid?: string }>;
export declare function getUsername(jid: string, options?: { userMap?: Map<string, { username: string | null; source: string }> }): string | null;
export declare function getDisplayName(jid: string, options?: { userMap?: Map<string, { username: string | null; source: string }>; groupMetadata?: any }): string;
export declare const userDataCache: Map<string, any>;