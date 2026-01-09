import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data', 'ai-kernel.db');
        this.db = null;
        this.initDatabase();
    }

    initDatabase() {
        try {
            // Create data directory if it doesn't exist
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            console.log(`[Database] Initializing SQLite database at: ${this.dbPath}`);
            this.db = new Database(this.dbPath);
            this.setupTables();
            console.log(`[Database] Successfully initialized with tables`);
        } catch (error) {
            console.error(`[Database] Failed to initialize:`, error);
            // Fallback to in-memory database
            console.log(`[Database] Falling back to in-memory database`);
            this.db = new Database(':memory:');
            this.setupTables();
        }
    }

    setupTables() {
        // Conversations table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT DEFAULT '{}'
            )
        `);

        // Messages table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                model TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT DEFAULT '{}',
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
        `);

        // Agent executions table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS agent_executions (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                input_content TEXT,
                results TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                metadata TEXT DEFAULT '{}'
            )
        `);

        // Consultations table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS consultations (
                id TEXT PRIMARY KEY,
                question TEXT NOT NULL,
                context TEXT,
                models TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                results TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                metadata TEXT DEFAULT '{}'
            )
        `);

        // Create indexes for performance
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_executions_created ON agent_executions(created_at)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_consultations_created ON consultations(created_at)`);
    }

    // Conversation methods
    createConversation(channelId, metadata = {}) {
        const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const stmt = this.db.prepare(`
            INSERT INTO conversations (id, channel_id, metadata)
            VALUES (?, ?, ?)
        `);
        
        stmt.run(id, channelId, JSON.stringify(metadata));
        return id;
    }

    getConversation(conversationId) {
        const stmt = this.db.prepare(`
            SELECT * FROM conversations WHERE id = ?
        `);
        
        const conversation = stmt.get(conversationId);
        if (conversation) {
            conversation.metadata = JSON.parse(conversation.metadata);
        }
        return conversation;
    }

    getConversationByChannel(channelId) {
        const stmt = this.db.prepare(`
            SELECT * FROM conversations 
            WHERE channel_id = ? 
            ORDER BY updated_at DESC 
            LIMIT 1
        `);
        
        const conversation = stmt.get(channelId);
        if (conversation) {
            conversation.metadata = JSON.parse(conversation.metadata);
        }
        return conversation;
    }

    // Message methods
    addMessage(conversationId, role, content, model = null, metadata = {}) {
        const stmt = this.db.prepare(`
            INSERT INTO messages (conversation_id, role, content, model, metadata)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(conversationId, role, content, model, JSON.stringify(metadata));
        
        // Update conversation timestamp
        this.updateConversation(conversationId);
        
        return result.lastInsertRowid;
    }

    getMessages(conversationId, limit = 100) {
        const stmt = this.db.prepare(`
            SELECT * FROM messages 
            WHERE conversation_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `);
        
        const messages = stmt.all(conversationId, limit);
        return messages.map(msg => ({
            ...msg,
            metadata: JSON.parse(msg.metadata)
        })).reverse(); // Return in chronological order
    }

    // Agent execution methods
    saveAgentExecution(executionId, taskId, inputContent, metadata = {}) {
        const stmt = this.db.prepare(`
            INSERT INTO agent_executions (id, task_id, input_content, metadata)
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run(executionId, taskId, inputContent, JSON.stringify(metadata));
    }

    updateAgentExecution(executionId, status, results = null, metadata = {}) {
        const completedAt = status === 'complete' || status === 'error' ? new Date().toISOString() : null;
        
        const stmt = this.db.prepare(`
            UPDATE agent_executions 
            SET status = ?, results = ?, completed_at = ?, metadata = ?
            WHERE id = ?
        `);
        
        stmt.run(status, results ? JSON.stringify(results) : null, completedAt, JSON.stringify(metadata), executionId);
    }

    // Consultation methods
    saveConsultation(consultationId, question, context, models, metadata = {}) {
        const stmt = this.db.prepare(`
            INSERT INTO consultations (id, question, context, models, metadata)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(consultationId, question, context, JSON.stringify(models), JSON.stringify(metadata));
    }

    updateConsultation(consultationId, status, results = null, metadata = {}) {
        const completedAt = status === 'complete' || status === 'error' ? new Date().toISOString() : null;
        
        const stmt = this.db.prepare(`
            UPDATE consultations 
            SET status = ?, results = ?, completed_at = ?, metadata = ?
            WHERE id = ?
        `);
        
        stmt.run(status, results ? JSON.stringify(results) : null, completedAt, JSON.stringify(metadata), consultationId);
    }

    // Utility methods
    updateConversation(conversationId) {
        const stmt = this.db.prepare(`
            UPDATE conversations 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        
        stmt.run(conversationId);
    }

    // Analytics and cleanup
    getStats() {
        const conversations = this.db.prepare(`SELECT COUNT(*) as count FROM conversations`).get();
        const messages = this.db.prepare(`SELECT COUNT(*) as count FROM messages`).get();
        const executions = this.db.prepare(`SELECT COUNT(*) as count FROM agent_executions`).get();
        const consultations = this.db.prepare(`SELECT COUNT(*) as count FROM consultations`).get();
        
        return {
            conversations: conversations.count,
            messages: messages.count,
            agent_executions: executions.count,
            consultations: consultations.count
        };
    }

    cleanup(daysOld = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        const cutoffISO = cutoff.toISOString();

        // Delete old completed executions
        this.db.prepare(`
            DELETE FROM agent_executions 
            WHERE completed_at < ? AND status IN ('complete', 'error')
        `).run(cutoffISO);

        // Delete old completed consultations  
        this.db.prepare(`
            DELETE FROM consultations 
            WHERE completed_at < ? AND status IN ('complete', 'error')
        `).run(cutoffISO);

        // Delete old messages (keep conversations)
        this.db.prepare(`
            DELETE FROM messages 
            WHERE timestamp < ?
        `).run(cutoffISO);
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

const databaseService = new DatabaseService();

// Graceful shutdown
process.on('exit', () => databaseService.close());
process.on('SIGINT', () => databaseService.close());
process.on('SIGTERM', () => databaseService.close());

export default databaseService;