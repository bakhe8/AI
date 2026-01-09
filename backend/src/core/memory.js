// In-memory message storage per panel with TTL support
const channelMessages = new Map();
const channelLastActivity = new Map(); // Track last activity timestamp per channel

// Configuration
const MAX_MESSAGES_PER_CHANNEL = 50; // Limit per channel for active channels
const CHANNEL_TTL_HOURS = 24; // Delete inactive channels after 24 hours

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

    // Update last activity timestamp
    channelLastActivity.set(channelId, Date.now());

    // Keep only last MAX_MESSAGES_PER_CHANNEL messages for this channel
    const messages = channelMessages.get(channelId);
    if (messages.length > MAX_MESSAGES_PER_CHANNEL) {
        channelMessages.set(channelId, messages.slice(-MAX_MESSAGES_PER_CHANNEL));
    }

    return message;
}

export function getMessages(channelId) {
    // Update last activity when messages are retrieved
    if (channelMessages.has(channelId)) {
        channelLastActivity.set(channelId, Date.now());
    }
    return channelMessages.get(channelId) || [];
}

export function clearMessages(channelId) {
    channelMessages.delete(channelId);
    channelLastActivity.delete(channelId);
}

/**
 * Cleanup job: Remove inactive channels that haven't been accessed
 * for more than CHANNEL_TTL_HOURS
 */
export function cleanupInactiveChannels() {
    const now = Date.now();
    const ttlMs = CHANNEL_TTL_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

    let deletedCount = 0;

    for (const [channelId, lastActivity] of channelLastActivity.entries()) {
        const inactiveDuration = now - lastActivity;

        if (inactiveDuration > ttlMs) {
            // Channel is inactive, delete it
            channelMessages.delete(channelId);
            channelLastActivity.delete(channelId);
            deletedCount++;
        }
    }

    if (deletedCount > 0) {
        console.log(`[Memory Cleanup] Deleted ${deletedCount} inactive channel(s)`);
    }

    return deletedCount;
}

/**
 * Get memory statistics for monitoring
 */
export function getMemoryStats() {
    const stats = {
        totalChannels: channelMessages.size,
        channelDetails: []
    };

    for (const [channelId, messages] of channelMessages.entries()) {
        const lastActivity = channelLastActivity.get(channelId) || 0;
        const inactiveMs = Date.now() - lastActivity;
        const inactiveHours = Math.round(inactiveMs / (1000 * 60 * 60) * 10) / 10;

        stats.channelDetails.push({
            channelId,
            messageCount: messages.length,
            lastActivityHoursAgo: inactiveHours
        });
    }

    return stats;
}

// Start cleanup job - runs every hour (not in test environment)
if (process.env.NODE_ENV !== 'test') {
    setInterval(cleanupInactiveChannels, 60 * 60 * 1000);
    console.log('[Memory] Cleanup job started - running every hour');
}
