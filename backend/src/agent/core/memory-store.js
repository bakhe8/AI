/**
 * Memory Store - ذاكرة النظام للتعلم من التجارب
 * 
 * يسجل:
 * - Successes: patches نجحت
 * - Failures: patches فشلت
 * - User actions: تدخلات المستخدم
 * - Patterns: أنماط متكررة
 * 
 * @module agent/core/memory-store
 */

import Database from 'better-sqlite3';
import path from 'path';
import logger from '../../core/logger.js';

/**
 * أنواع الذكريات
 */
export const MemoryType = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    USER_ACTION: 'user_action',
    PATTERN: 'pattern'
};

/**
 * Memory Store
 */
export class MemoryStore {
    constructor(options = {}) {
        const dbPath = options.dbPath ||
            path.join(process.cwd(), '.ai-kernel', 'memory.db');

        this.db = new Database(dbPath);
        this.initialized = false;

        this.initialize();
    }

    /**
     * تهيئة قاعدة البيانات
     * @private
     */
    initialize() {
        if (this.initialized) return;

        logger.info('Initializing Memory Store');

        // جدول الذكريات الرئيسي
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                goal TEXT,
                patch_id TEXT,
                content TEXT,
                context TEXT,
                outcome TEXT,
                score REAL,
                timestamp INTEGER NOT NULL,
                tags TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_type ON memories(type);
            CREATE INDEX IF NOT EXISTS idx_goal ON memories(goal);
            CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp);
        `);

        // جدول الأنماط المكتشفة
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_type TEXT NOT NULL,
                description TEXT,
                occurrences INTEGER DEFAULT 1,
                success_rate REAL,
                last_seen INTEGER,
                metadata TEXT
            );
        `);

        this.initialized = true;
        logger.info('Memory Store initialized');
    }

    /**
     * تسجيل نجاح
     * @param {Object} success - معلومات النجاح
     * @returns {number} معرف الذاكرة
     */
    recordSuccess(success) {
        logger.debug('Recording success', {
            goal: success.goal,
            patchId: success.patchId
        });

        const stmt = this.db.prepare(`
            INSERT INTO memories (
                type, goal, patch_id, content, context, 
                outcome, score, timestamp, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            MemoryType.SUCCESS,
            success.goal || null,
            success.patchId || null,
            JSON.stringify(success.patch || {}),
            JSON.stringify(success.context || {}),
            success.outcome || 'applied_successfully',
            success.score || null,
            Date.now(),
            JSON.stringify(success.tags || [])
        );

        logger.info('Success recorded', { memoryId: result.lastInsertRowid });

        return result.lastInsertRowid;
    }

    /**
     * تسجيل فشل
     * @param {Object} failure - معلومات الفشل
     * @returns {number} معرف الذاكرة
     */
    recordFailure(failure) {
        logger.debug('Recording failure', {
            goal: failure.goal,
            patchId: failure.patchId,
            reason: failure.reason
        });

        const stmt = this.db.prepare(`
            INSERT INTO memories (
                type, goal, patch_id, content, context, 
                outcome, score, timestamp, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            MemoryType.FAILURE,
            failure.goal || null,
            failure.patchId || null,
            JSON.stringify(failure.patch || {}),
            JSON.stringify(failure.context || {}),
            failure.reason || 'unknown',
            failure.score || null,
            Date.now(),
            JSON.stringify(failure.tags || [])
        );

        logger.info('Failure recorded', { memoryId: result.lastInsertRowid });

        return result.lastInsertRowid;
    }

    /**
     * تسجيل إجراء مستخدم
     * @param {Object} action - الإجراء
     * @returns {number} معرف الذاكرة
     */
    recordUserAction(action) {
        logger.debug('Recording user action', {
            type: action.type
        });

        const stmt = this.db.prepare(`
            INSERT INTO memories (
                type, goal, patch_id, content, context, 
                outcome, timestamp, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            MemoryType.USER_ACTION,
            action.goal || null,
            action.patchId || null,
            JSON.stringify(action.action || {}),
            JSON.stringify(action.context || {}),
            action.outcome || null,
            Date.now(),
            JSON.stringify(action.tags || [])
        );

        return result.lastInsertRowid;
    }

    /**
     * استرجاع negative memory - الأخطاء السابقة لتجنبها
     * @param {Object} context - السياق الحالي
     * @param {number} limit - الحد الأقصى
     * @returns {Array} قائمة الإخفاقات المشابهة
     */
    getNegativeMemory(context = {}, limit = 10) {
        logger.debug('Retrieving negative memory', { context });

        let query = `
            SELECT * FROM memories 
            WHERE type = ?
        `;
        const params = [MemoryType.FAILURE];

        // إضافة filter للـ goal إذا موجود
        if (context.goal) {
            query += ` AND goal = ?`;
            params.push(context.goal);
        }

        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(limit);

        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);

        return rows.map(row => this.parseMemory(row));
    }

    /**
     * استرجاع positive memory - النجاحات السابقة للاستفادة منها
     * @param {Object} context - السياق الحالي
     * @param {number} limit - الحد الأقصى
     * @returns {Array} قائمة النجاحات المشابهة
     */
    getPositiveMemory(context = {}, limit = 10) {
        logger.debug('Retrieving positive memory', { context });

        let query = `
            SELECT * FROM memories 
            WHERE type = ?
        `;
        const params = [MemoryType.SUCCESS];

        if (context.goal) {
            query += ` AND goal = ?`;
            params.push(context.goal);
        }

        query += ` ORDER BY score DESC, timestamp DESC LIMIT ?`;
        params.push(limit);

        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);

        return rows.map(row => this.parseMemory(row));
    }

    /**
     * تحليل صف من قاعدة البيانات
     * @private
     */
    parseMemory(row) {
        return {
            id: row.id,
            type: row.type,
            goal: row.goal,
            patchId: row.patch_id,
            content: this.safeParse(row.content),
            context: this.safeParse(row.context),
            outcome: row.outcome,
            score: row.score,
            timestamp: row.timestamp,
            tags: this.safeParse(row.tags) || []
        };
    }

    /**
     * تحليل آمن لـ JSON
     * @private
     */
    safeParse(str) {
        try {
            return str ? JSON.parse(str) : null;
        } catch {
            return null;
        }
    }

    /**
     * اكتشاف نمط متكرر
     * @param {string} patternType - نوع النمط
     * @param {string} description - وصف
     * @returns {number} معرف النمط
     */
    recordPattern(patternType, description, metadata = {}) {
        logger.debug('Recording pattern', { patternType });

        // تحقق إذا كان النمط موجود
        const existing = this.db.prepare(`
            SELECT * FROM patterns 
            WHERE pattern_type = ? AND description = ?
        `).get(patternType, description);

        if (existing) {
            // زيادة عدد المرات
            const stmt = this.db.prepare(`
                UPDATE patterns 
                SET occurrences = occurrences + 1,
                    last_seen = ?
                WHERE id = ?
            `);
            stmt.run(Date.now(), existing.id);

            return existing.id;
        } else {
            // إنشاء نمط جديد
            const stmt = this.db.prepare(`
                INSERT INTO patterns (
                    pattern_type, description, last_seen, metadata
                ) VALUES (?, ?, ?, ?)
            `);

            const result = stmt.run(
                patternType,
                description,
                Date.now(),
                JSON.stringify(metadata)
            );

            return result.lastInsertRowid;
        }
    }

    /**
     * الحصول على الأنماط المكتشفة
     * @param {number} minOccurrences - الحد الأدنى من التكرارات
     * @returns {Array} قائمة الأنماط
     */
    getPatterns(minOccurrences = 2) {
        const stmt = this.db.prepare(`
            SELECT * FROM patterns 
            WHERE occurrences >= ?
            ORDER BY occurrences DESC, last_seen DESC
        `);

        return stmt.all(minOccurrences);
    }

    /**
     * الحصول على الإحصائيات
     * @returns {Object} إحصائيات
     */
    getStats() {
        const successCount = this.db.prepare(`
            SELECT COUNT(*) as count FROM memories WHERE type = ?
        `).get(MemoryType.SUCCESS).count;

        const failureCount = this.db.prepare(`
            SELECT COUNT(*) as count FROM memories WHERE type = ?
        `).get(MemoryType.FAILURE).count;

        const userActionCount = this.db.prepare(`
            SELECT COUNT(*) as count FROM memories WHERE type = ?
        `).get(MemoryType.USER_ACTION).count;

        const patternCount = this.db.prepare(`
            SELECT COUNT(*) as count FROM patterns
        `).get().count;

        const successRate = successCount + failureCount > 0
            ? (successCount / (successCount + failureCount)) * 100
            : 0;

        return {
            totalMemories: successCount + failureCount + userActionCount,
            successes: successCount,
            failures: failureCount,
            userActions: userActionCount,
            patterns: patternCount,
            successRate: Math.round(successRate * 10) / 10
        };
    }

    /**
     * مسح الذكريات القديمة
     * @param {number} olderThanDays - أقدم من كم يوم
     * @returns {number} عدد الذكريات المحذوفة
     */
    cleanup(olderThanDays = 30) {
        const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

        logger.info('Cleaning up old memories', {
            olderThanDays,
            cutoffDate: new Date(cutoff).toISOString()
        });

        const stmt = this.db.prepare(`
            DELETE FROM memories WHERE timestamp < ?
        `);

        const result = stmt.run(cutoff);

        logger.info('Cleanup complete', { deleted: result.changes });

        return result.changes;
    }

    /**
     * إغلاق قاعدة البيانات
     */
    close() {
        if (this.db) {
            this.db.close();
            logger.info('Memory Store closed');
        }
    }
}

// تصدير instance افتراضي
export const memoryStore = new MemoryStore();
