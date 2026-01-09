/**
 * Auto-Apply Manager - نظام التطبيق التلقائي للـ patches
 * 
 * يقرر متى يتم تطبيق patch تلقائياً بناءً على:
 * - نجاح الاختبارات
 * - مستوى المخاطرة
 * - إعدادات المستخدم
 * 
 * @module agent/core/auto-apply
 */

import logger from '../../core/logger.js';
import { CheckpointStore } from './checkpoint-store.js';
import { SandboxManager } from './sandbox-manager.js';

/**
 * مستويات المخاطرة للـ patches
 */
export const RiskLevel = {
    LOW: 'low',           // تغييرات بسيطة (comments, formatting)
    MEDIUM: 'medium',     // تغييرات منطقية (new features, refactor)
    HIGH: 'high',         // تغييرات حرجة (database, security)
    CRITICAL: 'critical'  // تغييرات خطيرة (core infrastructure)
};

/**
 * استراتيجيات Auto-Apply
 */
export const AutoApplyStrategy = {
    ALWAYS: 'always',           // تطبيق كل patch ناجح
    SAFE_ONLY: 'safe_only',     // فقط LOW و MEDIUM
    MANUAL: 'manual'            // لا تطبيق تلقائي
};

/**
 * Auto-Apply Manager
 */
export class AutoApplyManager {
    constructor(options = {}) {
        this.strategy = options.strategy || AutoApplyStrategy.SAFE_ONLY;
        this.checkpointStore = new CheckpointStore();
        this.sandboxManager = new SandboxManager();
        this.appliedPatches = [];
        this.useSandbox = options.useSandbox !== false; // افتراضياً مفعّل
    }

    /**
     * تحديد هل يجب تطبيق patch تلقائياً
     * @param {Object} patch - الـ patch المراد تقييمه
     * @param {Object} testResults - نتائج الاختبارات
     * @returns {boolean} true إذا يجب التطبيق
     */
    shouldApply(patch, testResults) {
        // 1. تحقق من نجاح الاختبارات
        if (!testResults || !testResults.success) {
            logger.debug('Auto-apply rejected: tests failed', {
                patchId: patch.id
            });
            return false;
        }

        // 2. تحقق من الاستراتيجية
        if (this.strategy === AutoApplyStrategy.MANUAL) {
            logger.debug('Auto-apply disabled: manual strategy');
            return false;
        }

        // 3. تقييم مستوى المخاطرة
        const riskLevel = this.assessRisk(patch);

        if (this.strategy === AutoApplyStrategy.SAFE_ONLY) {
            const isSafe = riskLevel === RiskLevel.LOW ||
                riskLevel === RiskLevel.MEDIUM;

            if (!isSafe) {
                logger.warn('Auto-apply rejected: high risk patch', {
                    patchId: patch.id,
                    riskLevel
                });
                return false;
            }
        }

        logger.info('Auto-apply approved', {
            patchId: patch.id,
            riskLevel,
            strategy: this.strategy
        });

        return true;
    }

    /**
     * تقييم مستوى المخاطرة
     * @param {Object} patch - الـ patch
     * @returns {string} مستوى المخاطرة
     */
    assessRisk(patch) {
        // قواعد بسيطة لتقييم المخاطرة
        const changes = patch.changes || [];

        // تحقق من الملفات الحرجة
        const criticalFiles = [
            'package.json',
            'server.js',
            'database.js',
            '.env'
        ];

        const hasCriticalFiles = changes.some(change =>
            criticalFiles.some(file => change.path.includes(file))
        );

        if (hasCriticalFiles) {
            return RiskLevel.CRITICAL;
        }

        // تحقق من حجم التغييرات
        const totalLines = changes.reduce((sum, change) => {
            return sum + (change.additions || 0) + (change.deletions || 0);
        }, 0);

        if (totalLines > 500) {
            return RiskLevel.HIGH;
        } else if (totalLines > 100) {
            return RiskLevel.MEDIUM;
        }

        return RiskLevel.LOW;
    }

    /**
     * تطبيق patch بعد إنشاء checkpoint
     * @param {Object} patch - الـ patch المراد تطبيقه
     * @param {Object} currentState - الحالة الحالية
     * @returns {Promise<Object>} نتيجة التطبيق
     */
    async applyPatch(patch, currentState) {
        try {
            // 1. إنشاء checkpoint قبل التطبيق
            logger.debug('Creating checkpoint before apply', {
                patchId: patch.id
            });

            const checkpoint = await this.checkpointStore.create(
                currentState.executionId,
                {
                    state: currentState,
                    patch: patch,
                    timestamp: Date.now(),
                    preApply: true
                }
            );

            logger.info('Checkpoint created', {
                checkpointId: checkpoint.id
            });

            // 2. تطبيق الـ patch
            logger.debug('Applying patch', { patchId: patch.id });

            const result = await this.executePatch(patch);

            // 3. تسجيل النجاح
            this.appliedPatches.push({
                patchId: patch.id,
                checkpointId: checkpoint.id,
                timestamp: Date.now(),
                result
            });

            logger.info('Patch applied successfully', {
                patchId: patch.id,
                filesChanged: result.filesChanged
            });

            return {
                success: true,
                checkpointId: checkpoint.id,
                filesChanged: result.filesChanged
            };

        } catch (error) {
            logger.error('Failed to apply patch', {
                patchId: patch.id,
                error: error.message
            });

            // في حالة الفشل، نحاول الـ rollback
            await this.rollbackLast();

            throw error;
        }
    }

    /**
     * تنفيذ الـ patch فعلياً
     * @param {Object} patch - الـ patch
     * @returns {Promise<Object>} نتيجة التنفيذ
     * @private
     */
    async executePatch(patch) {
        // TODO: تنفيذ فعلي للتطبيق على الملفات
        // سيتم تطويره لاحقاً مع integration كامل

        logger.debug('Executing patch (placeholder)', {
            patchId: patch.id,
            changes: patch.changes?.length || 0
        });

        // placeholder للنسخة الأولية
        return {
            applied: true,
            filesChanged: patch.changes?.map(c => c.path) || []
        };
    }

    /**
     * التراجع عن آخر patch
     * @returns {Promise<Object>} نتيجة الـ rollback
     */
    async rollbackLast() {
        if (this.appliedPatches.length === 0) {
            logger.warn('No patches to rollback');
            return { success: false, reason: 'no_patches' };
        }

        const lastPatch = this.appliedPatches[this.appliedPatches.length - 1];

        logger.info('Rolling back last patch', {
            patchId: lastPatch.patchId,
            checkpointId: lastPatch.checkpointId
        });

        try {
            // استعادة من checkpoint
            await this.checkpointStore.restore(lastPatch.checkpointId);

            // إزالة من القائمة
            this.appliedPatches.pop();

            logger.info('Rollback successful', {
                patchId: lastPatch.patchId
            });

            return {
                success: true,
                patchId: lastPatch.patchId
            };

        } catch (error) {
            logger.error('Rollback failed', {
                patchId: lastPatch.patchId,
                error: error.message
            });

            throw error;
        }
    }

    /**
     * التراجع عن كل الـ patches في الجلسة
     * @param {string} executionId - معرف الجلسة
     * @returns {Promise<Object>} نتيجة الـ rollback
     */
    async rollbackAll(executionId) {
        logger.info('Rolling back all patches', { executionId });

        const patchesInSession = this.appliedPatches.filter(
            p => p.executionId === executionId
        );

        if (patchesInSession.length === 0) {
            return { success: true, count: 0 };
        }

        try {
            // البحث عن أقدم checkpoint في الجلسة
            const oldestCheckpoint = patchesInSession[0].checkpointId;

            await this.checkpointStore.restore(oldestCheckpoint);

            // مسح كل الـ patches المطبقة في هذه الجلسة
            this.appliedPatches = this.appliedPatches.filter(
                p => p.executionId !== executionId
            );

            logger.info('Rollback all successful', {
                executionId,
                count: patchesInSession.length
            });

            return {
                success: true,
                count: patchesInSession.length
            };

        } catch (error) {
            logger.error('Rollback all failed', {
                executionId,
                error: error.message
            });

            throw error;
        }
    }

    /**
     * الحصول على ملخص الـ patches المطبقة
     * @returns {Array} قائمة الـ patches
     */
    getAppliedPatches() {
        return this.appliedPatches.map(p => ({
            patchId: p.patchId,
            timestamp: p.timestamp,
            filesChanged: p.result.filesChanged
        }));
    }

    /**
     * تغيير استراتيجية Auto-Apply
     * @param {string} strategy - الاستراتيجية الجديدة
     */
    setStrategy(strategy) {
        if (!Object.values(AutoApplyStrategy).includes(strategy)) {
            throw new Error(`Invalid strategy: ${strategy}`);
        }

        logger.info('Auto-apply strategy changed', {
            old: this.strategy,
            new: strategy
        });

        this.strategy = strategy;
    }
}

// تصدير instance افتراضي
export const autoApplyManager = new AutoApplyManager();
