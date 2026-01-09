import agentService from "../agent/service.js";
import databaseService from "../core/database.js";
import { agentLoop } from "../agent/core/agent-loop.js";


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

// ========== Agent Loop Control ==========

/**
 * بدء Agent Loop
 * POST /agent/loop/start
 * Body: { goal: string, constraints?: string[] }
 */
export async function startAgentLoop(req, res) {
    try {
        const { goal, constraints } = req.body || {};

        if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
            return res.status(400).json({
                error: 'goal is required and must be a non-empty string',
                code: 400
            });
        }

        const result = await agentLoop.start(goal, { constraints });

        res.status(202).json({
            success: true,
            ...result,
            message: 'Agent Loop started'
        });
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}

/**
 * إيقاف مؤقت لـ Agent Loop
 * POST /agent/loop/pause
 */
export async function pauseAgentLoop(req, res) {
    try {
        const result = await agentLoop.pause();
        res.json({
            success: true,
            ...result,
            message: 'Agent Loop paused'
        });
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}

/**
 * استئناف Agent Loop
 * POST /agent/loop/resume
 */
export async function resumeAgentLoop(req, res) {
    try {
        const result = await agentLoop.resume();
        res.status(202).json({
            success: true,
            ...result,
            message: 'Agent Loop resumed'
        });
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}

/**
 * إيقاف Agent Loop مع Rollback
 * POST /agent/loop/stop
 */
export async function stopAgentLoop(req, res) {
    try {
        const result = await agentLoop.stop();
        res.json({
            success: true,
            ...result,
            message: 'Agent Loop stopped'
        });
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}

/**
 * الحصول على حالة Agent Loop
 * GET /agent/loop/status
 */
export async function getAgentLoopStatus(req, res) {
    try {
        const status = agentLoop.getStatus();
        res.json({
            success: true,
            ...status
        });
    } catch (err) {
        res.status(500).json({ error: err.message, code: 500 });
    }
}

