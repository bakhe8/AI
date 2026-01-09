import taskRegistry from "./tasks/task-registry.js";
import { JSCodeAuditTask } from "./tasks/implementations/js-code-audit.task.js";
import { SelfCodeReadingTask } from "./tasks/implementations/self-code-reading.task.js";
import { AgentOrchestrator } from "./core/orchestrator.js";
import stateManager from "./core/state-manager.js";

class AgentService {
    constructor() {
        this.orchestrator = new AgentOrchestrator();
        this._ensureDefaultTasks();
    }

    _ensureDefaultTasks() {
        if (!taskRegistry.has('js-code-audit')) {
            const task = new JSCodeAuditTask();
            taskRegistry.register(task);
        }
        
        if (!taskRegistry.has('self-code-reading')) {
            const task = new SelfCodeReadingTask();
            taskRegistry.register(task);
        }
    }

    listTasks() {
        return taskRegistry.list().map(task => ({
            id: task.id,
            name: task.name,
            description: task.description,
            inputType: 'code'
        }));
    }

    executeTask(taskId, codeContent, metadata = {}) {
        const task = taskRegistry.get(taskId);
        if (!task) {
            throw new Error(`Task '${taskId}' not found`);
        }

        const executionId = `agent-${taskId}-${Date.now()}`;

        // Handle self-reading task differently (it doesn't need code content)
        if (taskId === 'self-code-reading') {
            const input = typeof codeContent === 'string' ? { targetPath: codeContent } : codeContent;
            
            // Start self-reading analysis directly
            this.orchestrator.executeTask(taskId, JSON.stringify(input), executionId)
                .catch(err => {
                    stateManager.failTask(executionId, err, 'execution');
                });
        } else {
            // Regular tasks need code content
            if (!codeContent || typeof codeContent !== 'string' || codeContent.trim().length === 0) {
                throw new Error('Input code is required');
            }

            this.orchestrator.executeTask(taskId, codeContent, executionId)
                .catch(err => {
                    stateManager.failTask(executionId, err, 'execution');
                });
        }

        return { executionId, status: 'running' };
    }

    getStatus(executionId) {
        const state = stateManager.getTask(executionId);
        if (!state) return null;

        return {
            executionId,
            status: state.status,
            progress: state.progress,
            stats: state.stats,
            errors: state.errors
        };
    }

    getResults(executionId) {
        const state = stateManager.getTask(executionId);
        if (!state) return null;

        return {
            executionId,
            status: state.status,
            patterns: state.results.analysis?.patterns || [],
            gaps: state.results.analysis?.gaps || [],
            contradictions: state.results.analysis?.contradictions || [],
            metrics: state.results.analysis?.coverage || {},
            rawReport: state.results.report?.markdown || null,
            raw: state.results
        };
    }
}

const agentService = new AgentService();
export default agentService;
