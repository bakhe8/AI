import databaseService from './database.js';
import selfReader from './self-reader.js';
import crypto from 'crypto';

/**
 * Session Manager for AI Kernel
 * Manages agent sessions with self-reading capabilities and database persistence
 */
class SessionManager {
    constructor() {
        this.activeSessions = new Map();
        this.sessionTimeouts = new Map();
        this.defaultTimeout = 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Start a new AI Kernel session
     */
    async startSession(channelId, options = {}) {
        const sessionId = `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        const session = {
            id: sessionId,
            channelId: channelId,
            startTime: new Date().toISOString(),
            status: 'active',
            type: options.type || 'general', // 'general', 'agent', 'consultation'
            selfReadingEnabled: options.selfReadingEnabled !== false,
            options: options
        };

        // Save session to database
        const conversationId = databaseService.createConversation(channelId, {
            sessionId: sessionId,
            type: session.type,
            selfReadingEnabled: session.selfReadingEnabled
        });

        session.conversationId = conversationId;
        this.activeSessions.set(sessionId, session);

        // Set session timeout
        this.setSessionTimeout(sessionId);

        // Start self-reading session if enabled
        if (session.selfReadingEnabled) {
            try {
                const selfReadingSession = selfReader.startSession(sessionId, {
                    includeTests: options.includeTests || false,
                    includeDocs: options.includeDocs !== false
                });
                
                session.selfReading = selfReadingSession;
                
                // Save self-reading metadata to database
                databaseService.addMessage(
                    conversationId, 
                    'system', 
                    `Self-reading session started with snapshot: ${selfReadingSession.snapshotHash}`,
                    'kernel',
                    { 
                        type: 'self_reading_start',
                        snapshot: selfReadingSession.snapshotHash,
                        modules: selfReadingSession.availableModules
                    }
                );

            } catch (error) {
                console.error(`[SessionManager] Failed to start self-reading for ${sessionId}:`, error);
                session.selfReadingEnabled = false;
            }
        }

        console.log(`[SessionManager] Started session ${sessionId} for channel ${channelId}`);
        return session;
    }

    /**
     * Get active session
     */
    getSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }

    /**
     * Get session by channel (most recent)
     */
    getSessionByChannel(channelId) {
        for (const session of this.activeSessions.values()) {
            if (session.channelId === channelId && session.status === 'active') {
                return session;
            }
        }
        return null;
    }

    /**
     * Perform self-reading for a session
     */
    async performSelfReading(sessionId, targetPath = null) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        if (!session.selfReadingEnabled) {
            throw new Error(`Self-reading not enabled for session ${sessionId}`);
        }

        try {
            const result = selfReader.readSelfFiles(sessionId, targetPath);
            
            // Save self-reading results to database
            databaseService.addMessage(
                session.conversationId,
                'system',
                `Self-reading completed: ${result.readCount} files, ${result.files.reduce((sum, f) => sum + f.chunks, 0)} chunks`,
                'kernel',
                {
                    type: 'self_reading_result',
                    targetPath: targetPath,
                    fileCount: result.readCount,
                    chunkCount: result.files.reduce((sum, f) => sum + f.chunks, 0),
                    snapshot: result.snapshot
                }
            );

            return {
                success: true,
                sessionId: sessionId,
                ...result
            };

        } catch (error) {
            console.error(`[SessionManager] Self-reading failed for ${sessionId}:`, error);
            
            // Save error to database
            databaseService.addMessage(
                session.conversationId,
                'system',
                `Self-reading failed: ${error.message}`,
                'kernel',
                { 
                    type: 'self_reading_error',
                    error: error.message,
                    targetPath: targetPath
                }
            );

            throw error;
        }
    }

    /**
     * Process self-code chunks for LLM
     */
    prepareSelfCodeForLLM(sessionId, targetPath = null) {
        const readResult = selfReader.readSelfFiles(sessionId, targetPath);
        const messages = [];

        // Add context header
        messages.push({
            role: 'system',
            content: `# AI Kernel Self-Code Analysis

You are analyzing the AI Kernel's own source code. This is self-reading for understanding and improvement.

**Session:** ${sessionId}
**Snapshot:** ${readResult.snapshot}
**Files:** ${readResult.readCount}
**Total Chunks:** ${readResult.files.reduce((sum, f) => sum + f.chunks, 0)}

**Important Constraints:**
1. This is READ-ONLY analysis - do not suggest modifications to apply within this session
2. Focus on understanding, patterns, and architectural insights
3. Any suggested changes should be noted for future sessions

---`
        });

        // Add each file's chunks
        for (const fileData of readResult.files) {
            for (const chunk of fileData.data) {
                messages.push({
                    role: 'system',
                    content: `## File: ${chunk.file}
**Part ${chunk.index + 1}/${chunk.total}** | **Language:** ${chunk.metadata.language} | **Type:** ${chunk.metadata.type}

\`\`\`${chunk.metadata.language}
${chunk.content}
\`\`\``
                });
            }
        }

        return messages;
    }

    /**
     * Mark file as modified (prevents re-reading in same session)
     */
    markFileModified(sessionId, filePath) {
        const session = this.activeSessions.get(sessionId);
        if (session && session.selfReadingEnabled) {
            selfReader.markFileModified(sessionId, filePath);
            
            // Log to database
            databaseService.addMessage(
                session.conversationId,
                'system',
                `File marked as modified: ${filePath}`,
                'kernel',
                {
                    type: 'file_modification',
                    filePath: filePath
                }
            );
        }
    }

    /**
     * End session
     */
    async endSession(sessionId, reason = 'manual') {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return null;
        }

        session.status = 'ended';
        session.endTime = new Date().toISOString();
        session.endReason = reason;

        // Clear session timeout
        if (this.sessionTimeouts.has(sessionId)) {
            clearTimeout(this.sessionTimeouts.get(sessionId));
            this.sessionTimeouts.delete(sessionId);
        }

        // End self-reading session
        let selfReadingStats = null;
        if (session.selfReadingEnabled) {
            selfReadingStats = selfReader.endSession(sessionId);
        }

        // Save session end to database
        databaseService.addMessage(
            session.conversationId,
            'system',
            `Session ended: ${reason}`,
            'kernel',
            {
                type: 'session_end',
                reason: reason,
                duration: Date.now() - new Date(session.startTime).getTime(),
                selfReadingStats: selfReadingStats
            }
        );

        this.activeSessions.delete(sessionId);
        
        console.log(`[SessionManager] Ended session ${sessionId}. Reason: ${reason}`);
        
        return {
            sessionId,
            duration: Date.now() - new Date(session.startTime).getTime(),
            reason,
            selfReadingStats
        };
    }

    /**
     * Set session timeout
     */
    setSessionTimeout(sessionId, timeout = this.defaultTimeout) {
        if (this.sessionTimeouts.has(sessionId)) {
            clearTimeout(this.sessionTimeouts.get(sessionId));
        }

        const timeoutId = setTimeout(() => {
            this.endSession(sessionId, 'timeout');
        }, timeout);

        this.sessionTimeouts.set(sessionId, timeoutId);
    }

    /**
     * Extend session timeout
     */
    extendSession(sessionId, additionalTime = this.defaultTimeout) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            this.setSessionTimeout(sessionId, additionalTime);
            return true;
        }
        return false;
    }

    /**
     * List active sessions
     */
    listActiveSessions() {
        return Array.from(this.activeSessions.values()).map(session => ({
            id: session.id,
            channelId: session.channelId,
            type: session.type,
            status: session.status,
            startTime: session.startTime,
            selfReadingEnabled: session.selfReadingEnabled,
            snapshotHash: session.selfReading?.snapshotHash
        }));
    }

    /**
     * Get session statistics
     */
    getSessionStats() {
        const sessions = Array.from(this.activeSessions.values());
        
        return {
            total: sessions.length,
            byType: sessions.reduce((acc, s) => {
                acc[s.type] = (acc[s.type] || 0) + 1;
                return acc;
            }, {}),
            withSelfReading: sessions.filter(s => s.selfReadingEnabled).length,
            averageDuration: sessions.length > 0 
                ? sessions.reduce((sum, s) => sum + (Date.now() - new Date(s.startTime).getTime()), 0) / sessions.length
                : 0
        };
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        const expiredSessions = [];

        for (const session of this.activeSessions.values()) {
            const age = now - new Date(session.startTime).getTime();
            if (age > this.defaultTimeout * 2) { // 2x timeout = expired
                expiredSessions.push(session.id);
            }
        }

        for (const sessionId of expiredSessions) {
            this.endSession(sessionId, 'expired');
        }

        return expiredSessions.length;
    }
}

const sessionManager = new SessionManager();

// Cleanup job every 10 minutes
setInterval(() => {
    const cleaned = sessionManager.cleanupExpiredSessions();
    if (cleaned > 0) {
        console.log(`[SessionManager] Cleaned up ${cleaned} expired sessions`);
    }
}, 10 * 60 * 1000);

export default sessionManager;