/**
 * Agent Loop - الحلقة التلقائية للعمل المستمر
 * 
 * دورة العمل: Observe → Plan → Generate → Test → Apply → Checkpoint → Repeat
 * 
 * @module agent/core/agent-loop
 */

import { AgentOrchestrator } from './orchestrator.js';
import stateManager from './state-manager.js';
import { AutoApplyManager } from './auto-apply.js';
import { CheckpointStore } from './checkpoint-store.js';
import logger from '../../core/logger.js';

/**
 * حالات Agent Loop الممكنة
 */
export const LoopState = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    STOPPING: 'stopping',
    STOPPED: 'stopped',
    ERROR: 'error'
};

/**
 * Agent Loop - محرك التنفيذ التلقائي
 */
export class AgentLoop {
    constructor(kernelBaseUrl = 'http://localhost:3000') {
        this.orchestrator = new AgentOrchestrator(kernelBaseUrl);
        this.autoApply = new AutoApplyManager();
        this.checkpointStore = new CheckpointStore();
        this.state = LoopState.IDLE;
        this.currentExecutionId = null;
        this.goal = null;
        this.constraints = [];
        this.currentPlan = null;  // تجنب تضارب مع دالة plan()
        this.currentStep = 0;
        this.totalSteps = 0;
        this.pauseRequested = false;
        this.stopRequested = false;
    }

    /**
     * بدء Agent Loop
     * @param {string} goal - الهدف المطلوب تحقيقه
     * @param {Object} options - خيارات التنفيذ
     * @returns {Promise<Object>} معلومات الجلسة
     */
    async start(goal, options = {}) {
        if (this.state === LoopState.RUNNING) {
            throw new Error('Agent Loop is already running');
        }

        logger.info('Starting Agent Loop', { goal });

        this.goal = goal;
        this.constraints = options.constraints || [];
        this.currentExecutionId = `loop-${Date.now()}`;
        this.state = LoopState.RUNNING;
        this.pauseRequested = false;
        this.stopRequested = false;

        try {
            // بدء الحلقة
            await this.runLoop();

            return {
                executionId: this.currentExecutionId,
                status: this.state,
                goal: this.goal
            };
        } catch (error) {
            logger.error('Agent Loop failed', { error: error.message });
            this.state = LoopState.ERROR;
            throw error;
        }
    }

    /**
     * إيقاف مؤقت للـ Loop
     */
    async pause() {
        if (this.state !== LoopState.RUNNING) {
            throw new Error('Agent Loop is not running');
        }

        logger.info('Pausing Agent Loop');
        this.pauseRequested = true;

        // انتظر حتى يتوقف عند نقطة آمنة
        while (this.state === LoopState.RUNNING && !this.pauseRequested) {
            await this.sleep(100);
        }

        this.state = LoopState.PAUSED;
        logger.info('Agent Loop paused');

        return { status: this.state };
    }

    /**
     * استئناف الـ Loop
     */
    async resume() {
        if (this.state !== LoopState.PAUSED) {
            throw new Error('Agent Loop is not paused');
        }

        logger.info('Resuming Agent Loop');
        this.state = LoopState.RUNNING;
        this.pauseRequested = false;

        // استئناف الحلقة
        await this.runLoop();

        return { status: this.state };
    }

    /**
     * إيقاف كامل للـ Loop مع Rollback
     */
    async stop() {
        logger.info('Stopping Agent Loop');
        this.stopRequested = true;
        this.state = LoopState.STOPPING;

        // Rollback كل التغييرات في الجلسة
        try {
            const result = await this.autoApply.rollbackAll(this.currentExecutionId);
            logger.info('Rollback completed', {
                executionId: this.currentExecutionId,
                patchesRolledBack: result.count
            });
        } catch (error) {
            logger.error('Rollback failed during stop', {
                error: error.message
            });
        }

        this.state = LoopState.STOPPED;
        logger.info('Agent Loop stopped');

        return { status: this.state };
    }

    /**
     * الحصول على حالة الـ Loop
     */
    getStatus() {
        return {
            executionId: this.currentExecutionId,
            state: this.state,
            goal: this.goal,
            currentStep: this.currentStep,
            totalSteps: this.totalSteps,
            progress: this.totalSteps > 0 ? (this.currentStep / this.totalSteps) * 100 : 0
        };
    }

    /**
     * الحلقة الرئيسية
     * @private
     */
    async runLoop() {
        while (this.state === LoopState.RUNNING && !this.stopRequested) {
            // تحقق من طلب الإيقاف المؤقت
            if (this.pauseRequested) {
                this.state = LoopState.PAUSED;
                return;
            }

            try {
                // 1. Observe - فهم الحالة الحالية
                logger.debug('Loop step: Observe');
                const observation = await this.observe();

                // 2. Plan - بناء خطة التنفيذ
                logger.debug('Loop step: Plan');
                const plan = await this.plan(observation);

                // إذا لا توجد خطوات أخرى، انتهى العمل
                if (!plan || plan.steps.length === 0) {
                    logger.info('No more steps to execute. Loop complete.');
                    this.state = LoopState.IDLE;
                    break;
                }

                // تنفيذ كل خطوة في الخطة
                this.totalSteps = plan.steps.length;

                for (let i = 0; i < plan.steps.length; i++) {
                    if (this.pauseRequested || this.stopRequested) {
                        break;
                    }

                    this.currentStep = i + 1;
                    const step = plan.steps[i];

                    // 3. Generate - توليد Patch
                    logger.debug('Loop step: Generate', { step: this.currentStep });
                    const patch = await this.generate(step);

                    // 4. Test - اختبار الـ Patch
                    logger.debug('Loop step: Test');
                    const testResult = await this.test(patch);

                    // 5. Auto-Apply Decision + Application
                    if (this.autoApply.shouldApply(patch, testResult)) {
                        logger.debug('Loop step: Auto-Apply approved');

                        const currentState = {
                            executionId: this.currentExecutionId,
                            goal: this.goal,
                            currentStep: this.currentStep,
                            totalSteps: this.totalSteps
                        };

                        await this.autoApply.applyPatch(patch, currentState);
                        logger.info('Patch auto-applied', { patchId: patch.id });
                    } else {
                        logger.warn('Auto-apply rejected or test failed', {
                            patchId: patch.id,
                            testSuccess: testResult.success
                        });
                    }
                }

                // تحقق من اكتمال الهدف
                const isComplete = await this.isGoalComplete();
                if (isComplete) {
                    logger.info('Goal achieved. Loop complete.');
                    this.state = LoopState.IDLE;
                    break;
                }

            } catch (error) {
                logger.error('Error in loop iteration', { error: error.message });

                // في حالة خطأ حرج، إيقاف مع احتفاظ بالحالة
                this.state = LoopState.ERROR;
                throw error;
            }
        }
    }

    /**
     * Observe - فهم الحالة الحالية للنظام
     * @private
     */
    async observe() {
        logger.debug('Observing current state', { goal: this.goal });

        // استخدام StateManager للحصول على الحالة
        const currentState = {
            goal: this.goal,
            constraints: this.constraints,
            executionId: this.currentExecutionId,
            currentStep: this.currentStep,
            totalSteps: this.totalSteps
        };

        // استرجاع negative memory لتجنب أخطاء سابقة
        let negativeMemory = [];
        try {
            const { memoryStore } = await import('./memory-store.js');
            negativeMemory = memoryStore.getNegativeMemory(
                { goal: this.goal },
                5  // آخر 5 إخفاقات
            );
        } catch (error) {
            logger.warn('Failed to retrieve negative memory', { error: error.message });
        }

        return {
            currentState,
            negativeMemory,
            timestamp: Date.now()
        };
    }

    /**
     * Plan - بناء خطة التنفيذ
     * @private
     */
    async plan(observation) {
        logger.debug('Planning execution steps for goal', { goal: this.goal });

        // للنسخة الأولية: خطة بسيطة بناءً على الهدف
        const steps = [];

        // تحليل بسيط للهدف لتحديد الخطوات
        const goalLower = this.goal.toLowerCase();

        if (goalLower.includes('test') || goalLower.includes('اختبار')) {
            steps.push({
                id: 'step-1',
                description: 'Add or improve tests',
                type: 'testing',
                priority: 1
            });
        }

        if (goalLower.includes('performance') || goalLower.includes('أداء')) {
            steps.push({
                id: `step-${steps.length + 1}`,
                description: 'Optimize performance',
                type: 'optimization',
                priority: 1
            });
        }

        if (goalLower.includes('refactor') || goalLower.includes('تنظيف')) {
            steps.push({
                id: `step-${steps.length + 1}`,
                description: 'Refactor code for better maintainability',
                type: 'refactoring',
                priority: 2
            });
        }

        // إذا لم تتطابق أي كلمة مفتاحية، نضع خطوة عامة
        if (steps.length === 0) {
            steps.push({
                id: 'step-1',
                description: `Work on: ${this.goal}`,
                type: 'general',
                priority: 1
            });
        }

        logger.info('Plan created', {
            goal: this.goal,
            stepsCount: steps.length
        });

        return { steps };
    }

    /**
     * Generate - توليد Patch باستخدام Orchestrator
     * @private
     */
    async generate(step) {
        logger.debug('Generating patch for step', { step: step.id });

        try {
            // استخدام Orchestrator لتوليد suggestions
            const taskInput = {
                goal: this.goal,
                step: step.description,
                context: {
                    currentStep: this.currentStep,
                    totalSteps: this.totalSteps
                }
            };

            // تنفيذ task بسيط للحصول على suggestions
            const result = await this.orchestrator.executeTask(
                'code-enhancement',  // task ID
                JSON.stringify(taskInput),
                `${this.currentExecutionId}-step-${this.currentStep}`
            );

            // تحويل النتيجة إلى patch
            const patch = {
                id: `patch-${Date.now()}`,
                step: step.id,
                changes: this.extractChanges(result),
                description: step.description,
                score: result.summary?.consensus?.score || 0,
                testResults: null  // سيتم ملؤها في test()
            };

            logger.info('Patch generated', {
                patchId: patch.id,
                changesCount: patch.changes.length
            });

            return patch;

        } catch (error) {
            logger.error('Failed to generate patch', {
                error: error.message,
                step: step.id
            });

            // في حالة الفشل، نرجع patch فارغ
            return {
                id: `patch-${Date.now()}-error`,
                step: step.id,
                changes: [],
                description: step.description,
                error: error.message
            };
        }
    }

    /**
     * Test - اختبار الـ Patch
     * @private
     */
    async test(patch) {
        // TODO: تشغيل الاختبارات ذات الصلة
        logger.debug('Testing patch', { patchId: patch.id });

        // placeholder
        return {
            success: true,
            testsRun: 0,
            testsPassed: 0,
            error: null
        };
    }

    /**
     * Apply - تطبيق الـ Patch (مستخدم من قبل Auto-Apply)
     * @private
     */
    async apply(patch) {
        // هذه الدالة الآن تُستدعى من autoApply.applyPatch
        // تطبيق فعلي على الملفات
        logger.debug('Applying patch to files', { patchId: patch.id });

        // TODO: تنفيذ فعلي للتطبيق
        // - قراءة الملفات المستهدفة
        // - تطبيق التغييرات
        // - حفظ الملفات

        return {
            applied: true,
            filesChanged: patch.changes?.map(c => c.path) || []
        };
    }

    /**
     * Checkpoint - حفظ نقطة آمنة (مستخدم من قبل Auto-Apply)
     * @private
     */
    async checkpoint() {
        // checkpoint يُنشأ تلقائياً من autoApply.applyPatch
        // هذه الدالة للاستخدام اليدوي إذا لزم الأمر

        const state = {
            executionId: this.currentExecutionId,
            goal: this.goal,
            currentStep: this.currentStep,
            totalSteps: this.totalSteps,
            state: this.state
        };

        const checkpoint = await this.checkpointStore.create(
            this.currentExecutionId,
            state
        );

        logger.debug('Manual checkpoint created', {
            checkpointId: checkpoint.id
        });

        return checkpoint;
    }

    /**
     * فحص اكتمال الهدف
     * @private
     */
    async isGoalComplete() {
        // TODO: تحليل ذكي لمعرفة هل تم تحقيق الهدف
        logger.debug('Checking if goal is complete');

        // placeholder - للنسخة الأولية نفترض عدم الاكتمال بعد خطوة واحدة
        return this.currentStep >= this.totalSteps;
    }

    /**
     * مساعد للانتظار
     * @private
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * استخراج التغييرات من نتيجة Orchestrator
     * @private
     */
    extractChanges(orchestratorResult) {
        // استخراج suggestions من النتيجة
        const changes = [];

        try {
            if (orchestratorResult.round1?.results) {
                // أخذ أول suggestion من أول نموذج
                const firstModel = Object.values(orchestratorResult.round1.results)[0];
                if (firstModel?.facets) {
                    const firstFacet = Object.values(firstModel.facets)[0];
                    if (firstFacet?.suggestions) {
                        firstFacet.suggestions.forEach((suggestion, index) => {
                            changes.push({
                                id: `change-${index}`,
                                path: 'target-file.js',  // placeholder
                                type: suggestion.type || 'modification',
                                description: suggestion.description,
                                additions: 0,  // placeholder
                                deletions: 0,  // placeholder
                                content: suggestion.suggestion || suggestion.description
                            });
                        });
                    }
                }
            }
        } catch (error) {
            logger.warn('Failed to extract changes', { error: error.message });
        }

        return changes;
    }
}

// تصدير instance افتراضي
export const agentLoop = new AgentLoop();
