import agentService from "../agent/service.js";
import databaseService from "../core/database.js";

export async function listAgentTasks(req, res) {
    try {
        const tasks = agentService.listTasks();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}

export async function executeAgentTask(req, res) {
    try {
        const { taskId, input } = req.body || {};
        if (!taskId || typeof taskId !== 'string') {
            return res.status(400).json({ error: 'taskId is required', code: 400 });
        }
        if (!input || input.type !== 'code' || typeof input.content !== 'string' || input.content.trim().length === 0) {
            return res.status(400).json({ error: 'input.type must be "code" with non-empty content', code: 400 });
        }

        const result = agentService.executeTask(taskId, input.content);
        
        // Save to database
        databaseService.saveAgentExecution(result.executionId, taskId, input.content, {
            timestamp: new Date().toISOString(),
            client_info: req.headers['user-agent'] || 'unknown'
        });
        
        res.status(202).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}

export async function getAgentStatus(req, res) {
    try {
        const { executionId } = req.params;
        const status = agentService.getStatus(executionId);
        if (!status) {
            return res.status(404).json({ error: 'Execution not found', code: 404 });
        }
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}

export async function getAgentResults(req, res) {
    try {
        const { executionId } = req.params;
        const results = agentService.getResults(executionId);
        if (!results) {
            return res.status(404).json({ error: 'Execution not found', code: 404 });
        }
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}

export async function getDatabaseStats(req, res) {
    try {
        const stats = databaseService.getStats();
        res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}
