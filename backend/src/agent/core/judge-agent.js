/**
 * Judge Agent - اتخاذ القرارات الذكية
 * 
 * يقارن بين حلول متعددة ويختار الأفضل بناءً على معايير متعددة:
 * - جودة الكود
 * - نجاح الاختبارات
 * - الأداء
 * - البساطة
 * - الأمان
 * 
 * @module agent/core/judge-agent
 */

import logger from '../../core/logger.js';

/**
 * معايير التقييم
 */
export const JudgeCriteria = {
    CODE_QUALITY: 'code_quality',      // جودة الكود
    TEST_COVERAGE: 'test_coverage',    // تغطية الاختبارات
    PERFORMANCE: 'performance',        // الأداء
    SIMPLICITY: 'simplicity',          // البساطة
    SECURITY: 'security',              // الأمان
    MAINTAINABILITY: 'maintainability' // قابلية الصيانة
};

/**
 * Judge Agent
 */
export class JudgeAgent {
    constructor(options = {}) {
        // الأوزان لكل معيار (يجب أن يساوي المجموع 1.0)
        this.weights = options.weights || {
            [JudgeCriteria.CODE_QUALITY]: 0.25,
            [JudgeCriteria.TEST_COVERAGE]: 0.20,
            [JudgeCriteria.PERFORMANCE]: 0.15,
            [JudgeCriteria.SIMPLICITY]: 0.15,
            [JudgeCriteria.SECURITY]: 0.15,
            [JudgeCriteria.MAINTAINABILITY]: 0.10
        };

        this.decisions = [];
    }

    /**
     * مقارنة patches متعددة واختيار الأفضل
     * @param {Array} patches - قائمة الـ patches المراد مقارنتها
     * @param {Object} context - السياق (الهدف، constraints، إلخ)
     * @returns {Promise<Object>} القرار النهائي
     */
    async judge(patches, context = {}) {
        logger.info('Judge Agent evaluating patches', {
            patchCount: patches.length,
            goal: context.goal
        });

        if (!patches || patches.length === 0) {
            throw new Error('No patches to judge');
        }

        // إذا كان هناك patch واحد فقط
        if (patches.length === 1) {
            return {
                winner: patches[0],
                score: await this.scorePatch(patches[0], context),
                reason: 'Only one patch available'
            };
        }

        try {
            // 1. تقييم كل patch
            const evaluations = await Promise.all(
                patches.map(async (patch) => ({
                    patch,
                    score: await this.scorePatch(patch, context),
                    breakdown: await this.getScoreBreakdown(patch, context)
                }))
            );

            // 2. ترتيب حسب النتيجة
            evaluations.sort((a, b) => b.score - a.score);

            // 3. اختيار الأفضل
            const winner = evaluations[0];

            // 4. تسجيل القرار
            const decision = {
                winner: winner.patch,
                score: winner.score,
                breakdown: winner.breakdown,
                alternatives: evaluations.slice(1).map(e => ({
                    patch: e.patch,
                    score: e.score
                })),
                timestamp: Date.now(),
                context
            };

            this.decisions.push(decision);

            logger.info('Judge Agent decided', {
                winnerId: winner.patch.id,
                score: winner.score,
                totalPatches: patches.length
            });

            return decision;

        } catch (error) {
            logger.error('Judge Agent failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * تقييم patch واحد
     * @param {Object} patch - الـ patch
     * @param {Object} context - السياق
     * @returns {Promise<number>} النتيجة (0-100)
     * @private
     */
    async scorePatch(patch, context) {
        const breakdown = await this.getScoreBreakdown(patch, context);

        // حساب النتيجة الموزونة
        let totalScore = 0;

        for (const [criterion, weight] of Object.entries(this.weights)) {
            totalScore += breakdown[criterion] * weight;
        }

        return Math.round(totalScore * 100) / 100;
    }

    /**
     * الحصول على تفصيل النتائج لكل معيار
     * @param {Object} patch - الـ patch
     * @param {Object} context - السياق
     * @returns {Promise<Object>} تفصيل النتائج
     * @private
     */
    async getScoreBreakdown(patch, context) {
        return {
            [JudgeCriteria.CODE_QUALITY]: await this.evaluateCodeQuality(patch),
            [JudgeCriteria.TEST_COVERAGE]: await this.evaluateTestCoverage(patch),
            [JudgeCriteria.PERFORMANCE]: await this.evaluatePerformance(patch),
            [JudgeCriteria.SIMPLICITY]: await this.evaluateSimplicity(patch),
            [JudgeCriteria.SECURITY]: await this.evaluateSecurity(patch),
            [JudgeCriteria.MAINTAINABILITY]: await this.evaluateMaintainability(patch)
        };
    }

    /**
     * تقييم جودة الكود
     * @private
     */
    async evaluateCodeQuality(patch) {
        // TODO: تحليل فعلي للكود
        // - استخدام linter
        // - فحص complexity
        // - naming conventions

        logger.debug('Evaluating code quality', { patchId: patch.id });

        // placeholder - نعطي نتيجة عشوائية بين 70-95
        return 0.7 + Math.random() * 0.25;
    }

    /**
     * تقييم تغطية الاختبارات
     * @private
     */
    async evaluateTestCoverage(patch) {
        // TODO: فحص فعلي للاختبارات
        // - عدد الاختبارات الموجودة
        // - نسبة التغطية
        // - جودة الاختبارات

        logger.debug('Evaluating test coverage', { patchId: patch.id });

        const testResults = patch.testResults || {};

        if (testResults.passed === testResults.total && testResults.total > 0) {
            return 1.0; // نجحت كل الاختبارات
        } else if (testResults.total === 0) {
            return 0.5; // لا توجد اختبارات
        } else {
            return (testResults.passed / testResults.total) || 0;
        }
    }

    /**
     * تقييم الأداء
     * @private
     */
    async evaluatePerformance(patch) {
        // TODO: قياس فعلي للأداء
        // - زمن التنفيذ
        // - استهلاك الذاكرة
        // - complexity تحليلية (Big O)

        logger.debug('Evaluating performance', { patchId: patch.id });

        // placeholder
        return 0.75 + Math.random() * 0.2;
    }

    /**
     * تقييم البساطة
     * @private
     */
    async evaluateSimplicity(patch) {
        // TODO: قياس البساطة
        // - عدد الأسطر المضافة
        // - cyclomatic complexity
        // - nesting depth

        logger.debug('Evaluating simplicity', { patchId: patch.id });

        const changes = patch.changes || [];
        const totalLines = changes.reduce((sum, c) =>
            sum + (c.additions || 0), 0
        );

        // كلما كان أقل، كان أبسط
        if (totalLines < 10) return 1.0;
        if (totalLines < 50) return 0.8;
        if (totalLines < 100) return 0.6;
        if (totalLines < 200) return 0.4;
        return 0.3;
    }

    /**
     * تقييم الأمان
     * @private
     */
    async evaluateSecurity(patch) {
        // TODO: فحص أمني فعلي
        // - SQL injection
        // - XSS vulnerabilities
        // - sensitive data exposure
        // - استخدام dependencies غير آمنة

        logger.debug('Evaluating security', { patchId: patch.id });

        // placeholder - نفترض آمن إلا إذا وجدنا مؤشرات
        const changes = patch.changes || [];
        const code = changes.map(c => c.content || '').join('\n');

        // فحص بسيط جداً
        const dangerousPatterns = [
            'eval(',
            'exec(',
            'shell_exec',
            'innerHTML',
            'dangerouslySetInnerHTML'
        ];

        const hasDangerousCode = dangerousPatterns.some(pattern =>
            code.includes(pattern)
        );

        return hasDangerousCode ? 0.3 : 0.9;
    }

    /**
     * تقييم قابلية الصيانة
     * @private
     */
    async evaluateMaintainability(patch) {
        // TODO: تحليل قابلية الصيانة
        // - documentation
        // - naming clarity
        // - code organization

        logger.debug('Evaluating maintainability', { patchId: patch.id });

        // placeholder
        return 0.7 + Math.random() * 0.25;
    }

    /**
     * حل التعارضات بين patches
     * @param {Array} conflicts - قائمة التعارضات
     * @returns {Promise<Object>} الحل المقترح
     */
    async resolveConflicts(conflicts) {
        logger.info('Resolving conflicts', {
            conflictCount: conflicts.length
        });

        // TODO: منطق ذكي لحل التعارضات
        // - دمج patches متوافقة
        // - اختيار الأفضل في حالة تعارض

        // placeholder - نأخذ الأول
        return {
            resolution: 'take_first',
            conflicts: conflicts.length,
            resolved: true
        };
    }

    /**
     * الحصول على تاريخ القرارات
     * @param {number} limit - الحد الأقصى
     * @returns {Array} القرارات الأخيرة
     */
    getDecisionHistory(limit = 10) {
        return this.decisions
            .slice(-limit)
            .reverse()
            .map(d => ({
                winnerId: d.winner.id,
                score: d.score,
                timestamp: d.timestamp,
                alternatives: d.alternatives.length
            }));
    }

    /**
     * الحصول على الإحصائيات
     * @returns {Object} إحصائيات
     */
    getStats() {
        if (this.decisions.length === 0) {
            return {
                totalDecisions: 0,
                averageScore: 0,
                averageAlternatives: 0
            };
        }

        const totalScore = this.decisions.reduce((sum, d) => sum + d.score, 0);
        const totalAlternatives = this.decisions.reduce(
            (sum, d) => sum + d.alternatives.length, 0
        );

        return {
            totalDecisions: this.decisions.length,
            averageScore: totalScore / this.decisions.length,
            averageAlternatives: totalAlternatives / this.decisions.length
        };
    }

    /**
     * تحديث الأوزان
     * @param {Object} newWeights - الأوزان الجديدة
     */
    setWeights(newWeights) {
        // تحقق من أن المجموع = 1.0
        const sum = Object.values(newWeights).reduce((a, b) => a + b, 0);

        if (Math.abs(sum - 1.0) > 0.01) {
            throw new Error(`Weights must sum to 1.0, got ${sum}`);
        }

        logger.info('Judge weights updated', {
            old: this.weights,
            new: newWeights
        });

        this.weights = newWeights;
    }
}

// تصدير instance افتراضي
export const judgeAgent = new JudgeAgent();
