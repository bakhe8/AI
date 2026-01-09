import taskRegistry from "./tasks/task-registry.js";
import { JSCodeAuditTask } from "./tasks/implementations/js-code-audit.task.js";
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
            taskRegistry.register(task.toConfig());
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

    executeTask(taskId, codeContent) {
        const task = taskRegistry.get(taskId);
        if (!task) {
            throw new Error(`Task '${taskId}' not found`);
        }
        if (!codeContent || typeof codeContent !== 'string' || codeContent.trim().length === 0) {
            throw new Error('Input code is required');
        }

        const executionId = `agent-${taskId}-${Date.now()}`;

        // Fire and forget; stateManager holds state
        this.orchestrator.executeTask(taskId, codeContent, executionId)
            .catch(err => {
                stateManager.failTask(executionId, err, 'execution');
            });

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
