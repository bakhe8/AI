/**
 * Checkpoint Store - تخزين واستعادة نقاط الحفظ الآمنة
 * 
 * يحفظ حالة النظام في نقاط محددة للسماح بالـ rollback
 * 
 * @module agent/core/checkpoint-store
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../../core/logger.js';

/**
 * Checkpoint Store
 */
export class CheckpointStore {
    constructor(options = {}) {
        this.checkpointsDir = options.checkpointsDir ||
            path.join(process.cwd(), '.ai-kernel', 'checkpoints');
        this.checkpoints = new Map();
        this.maxCheckpoints = options.maxCheckpoints || 50;

        this.initialize();
    }

    /**
     * تهيئة مجلد Checkpoints
     * @private
     */
    async initialize() {
        try {
            await fs.mkdir(this.checkpointsDir, { recursive: true });
            logger.info('Checkpoint store initialized', {
                dir: this.checkpointsDir
            });
        } catch (error) {
            logger.error('Failed to initialize checkpoint store', {
                error: error.message
            });
        }
    }

    /**
     * إنشاء checkpoint جديد
     * @param {string} executionId - معرف الجلسة
     * @param {Object} state - الحالة المراد حفظها
     * @returns {Promise<Object>} معلومات الـ checkpoint
     */
    async create(executionId, state) {
        const checkpointId = `cp-${executionId}-${Date.now()}`;

        const checkpoint = {
            id: checkpointId,
            executionId,
            timestamp: Date.now(),
            state: state,
            isSafe: true
        };

        try {
            // حفظ في الذاكرة
            this.checkpoints.set(checkpointId, checkpoint);

            // حفظ في الملفات (للاستمرارية)
            const filePath = path.join(this.checkpointsDir, `${checkpointId}.json`);
            await fs.writeFile(
                filePath,
                JSON.stringify(checkpoint, null, 2),
                'utf-8'
            );

            logger.info('Checkpoint created', {
                checkpointId,
                executionId
            });

            // تنظيف checkpoints قديمة
            await this.cleanup();

            return checkpoint;

        } catch (error) {
            logger.error('Failed to create checkpoint', {
                checkpointId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * استعادة checkpoint
     * @param {string} checkpointId - معرف الـ checkpoint
     * @returns {Promise<Object>} الحالة المستعادة
     */
    async restore(checkpointId) {
        logger.info('Restoring checkpoint', { checkpointId });

        try {
            // محاولة من الذاكرة أولاً
            let checkpoint = this.checkpoints.get(checkpointId);

            // إذا لم يكن في الذاكرة، حمّل من الملف
            if (!checkpoint) {
                const filePath = path.join(this.checkpointsDir, `${checkpointId}.json`);
                const content = await fs.readFile(filePath, 'utf-8');
                checkpoint = JSON.parse(content);
                this.checkpoints.set(checkpointId, checkpoint);
            }

            if (!checkpoint) {
                throw new Error(`Checkpoint not found: ${checkpointId}`);
            }

            logger.info('Checkpoint restored', { checkpointId });

            return checkpoint.state;

        } catch (error) {
            logger.error('Failed to restore checkpoint', {
                checkpointId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * الحصول على قائمة checkpoints لجلسة معينة
     * @param {string} executionId - معرف الجلسة
     * @returns {Array} قائمة الـ checkpoints
     */
    list(executionId) {
        const checkpoints = Array.from(this.checkpoints.values())
            .filter(cp => cp.executionId === executionId)
            .sort((a, b) => b.timestamp - a.timestamp);

        return checkpoints.map(cp => ({
            id: cp.id,
            timestamp: cp.timestamp,
            isSafe: cp.isSafe
        }));
    }

    /**
     * حذف checkpoint
     * @param {string} checkpointId - معرف الـ checkpoint
     * @returns {Promise<boolean>} true إذا تم الحذف
     */
    async delete(checkpointId) {
        try {
            // حذف من الذاكرة
            this.checkpoints.delete(checkpointId);

            // حذف الملف
            const filePath = path.join(this.checkpointsDir, `${checkpointId}.json`);
            await fs.unlink(filePath);

            logger.debug('Checkpoint deleted', { checkpointId });

            return true;

        } catch (error) {
            // إذا فشل (مثلاً الملف غير موجود)، نتجاهل
            logger.warn('Failed to delete checkpoint', {
                checkpointId,
                error: error.message
            });
            return false;
        }
    }

    /**
     * تنظيف checkpoints قديمة
     * @private
     */
    async cleanup() {
        if (this.checkpoints.size <= this.maxCheckpoints) {
            return;
        }

        logger.info('Cleaning up old checkpoints', {
            current: this.checkpoints.size,
            max: this.maxCheckpoints
        });

        // ترتيب حسب التاريخ (الأقدم أولاً)
        const sorted = Array.from(this.checkpoints.values())
            .sort((a, b) => a.timestamp - b.timestamp);

        // حذف الزائد
        const toDelete = sorted.slice(0, sorted.length - this.maxCheckpoints);

        for (const cp of toDelete) {
            await this.delete(cp.id);
        }

        logger.info('Cleanup complete', {
            deleted: toDelete.length,
            remaining: this.checkpoints.size
        });
    }

    /**
     * حذف كل checkpoints لجلسة معينة
     * @param {string} executionId - معرف الجلسة
     * @returns {Promise<number>} عدد الـ checkpoints المحذوفة
     */
    async deleteByExecution(executionId) {
        const checkpoints = this.list(executionId);

        logger.info('Deleting checkpoints for execution', {
            executionId,
            count: checkpoints.length
        });

        for (const cp of checkpoints) {
            await this.delete(cp.id);
        }

        return checkpoints.length;
    }

    /**
     * الحصول على آخر checkpoint لجلسة
     * @param {string} executionId - معرف الجلسة
     * @returns {Object|null} الـ checkpoint أو null
     */
    getLatest(executionId) {
        const checkpoints = this.list(executionId);
        return checkpoints.length > 0 ? checkpoints[0] : null;
    }

    /**
     * الحصول على الإحصائيات
     * @returns {Object} إحصائيات
     */
    getStats() {
        return {
            total: this.checkpoints.size,
            maxAllowed: this.maxCheckpoints,
            directory: this.checkpointsDir
        };
    }
}
