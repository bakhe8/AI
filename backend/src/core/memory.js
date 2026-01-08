// In-memory message storage per panel (Phase 0 compliant)
const channelMessages = new Map();

export function addMessage(channelId, role, content) {
    if (!channelMessages.has(channelId)) {
        channelMessages.set(channelId, []);
    }
    
    const message = {
        role,
        content,
        timestamp: new Date().toISOString()
    };
    
    channelMessages.get(channelId).push(message);
    
    // Keep only last 50 messages per channel
    const messages = channelMessages.get(channelId);
    if (messages.length > 50) {
        channelMessages.set(channelId, messages.slice(-50));
    }
    
    return message;
}

export function getMessages(channelId) {
    return channelMessages.get(channelId) || [];
}

export function clearMessages(channelId) {
    channelMessages.delete(channelId);
}
