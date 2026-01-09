/**
 * Agent State Manager
 * Manages the state of running Agent tasks
 */

class AgentStateManager {
    constructor() {
        this.activeTasks = new Map();
    }

    /**
     * Create a new task state
     * @param {string} taskId - Unique task ID
     * @param {Object} config - Task configuration
     * @returns {Object} Initial state
     */
    createTask(taskId, config) {
        const state = {
            taskId,
            status: 'initializing',
            config,
            progress: {
                current: 0,
                total: this._calculateTotalSteps(config),
                phase: 'init'
            },
            results: {
                round1: [],
                round2: [],
                analysis: null,
                report: null
            },
            stats: {
                startTime: Date.now(),
                endTime: null,
                duration: 0,
                apiCalls: 0
            },
            errors: []
        };

        this.activeTasks.set(taskId, state);
        return state;
    }

    /**
     * Get task state
     * @param {string} taskId - Task ID
     * @returns {Object|null} Task state or null
     */
    getTask(taskId) {
        return this.activeTasks.get(taskId) || null;
    }

    /**
     * Update task state
     * @param {string} taskId - Task ID
     * @param {Object} updates - Partial state updates
     * @returns {Object} Updated state
     */
    updateTask(taskId, updates) {
        const state = this.activeTasks.get(taskId);
        if (!state) {
            throw new Error(`Task ${taskId} not found`);
        }

        // Deep merge updates
        Object.assign(state, updates);

        // Update duration
        if (state.stats.startTime) {
            state.stats.duration = Date.now() - state.stats.startTime;
        }

        return state;
    }

    /**
     * Update task progress
     * @param {string} taskId - Task ID
     * @param {string} phase - Current phase
     * @param {number} [current] - Current step
     */
    updateProgress(taskId, phase, current) {
        const state = this.getTask(taskId);
        if (!state) return;

        state.progress.phase = phase;
        if (current !== undefined) {
            state.progress.current = current;
        }
    }

    /**
     * Increment API call count
     * @param {string} taskId - Task ID
     * @param {number} [count=1] - Number to increment
     */
    incrementApiCalls(taskId, count = 1) {
        const state = this.getTask(taskId);
        if (state) {
            state.stats.apiCalls += count;
        }
    }

    /**
     * Mark task as complete
     * @param {string} taskId - Task ID
     * @returns {Object|null} Final state or null if task not found
     */
    completeTask(taskId) {
        const state = this.getTask(taskId);
        if (!state) return null;

        state.status = 'complete';
        state.stats.endTime = Date.now();
        state.stats.duration = state.stats.endTime - state.stats.startTime;
        state.progress.current = state.progress.total;

        return state;
    }

    /**
     * Mark task as failed
     * @param {string} taskId - Task ID
     * @param {Error} error - The error
     * @param {string} phase - Phase where error occurred
     */
    failTask(taskId, error, phase) {
        const state = this.getTask(taskId);
        if (!state) return;

        state.status = 'error';
        state.stats.endTime = Date.now();
        state.stats.duration = state.stats.endTime - state.stats.startTime;
        state.errors.push({
            message: error.message,
            phase,
            timestamp: Date.now(),
            stack: error.stack
        });
    }

    /**
     * Delete task state
     * @param {string} taskId - Task ID
     * @returns {boolean} True if deleted
     */
    deleteTask(taskId) {
        return this.activeTasks.delete(taskId);
    }

    /**
     * List all active tasks
     * @returns {Array} Array of task summaries
     */
    listTasks() {
        return Array.from(this.activeTasks.entries()).map(([taskId, state]) => ({
            taskId,
            status: state.status,
            progress: state.progress,
            duration: state.stats.duration
        }));
    }

    /**
     * Clear all tasks (for testing)
     */
    clear() {
        this.activeTasks.clear();
    }

    /**
     * Calculate total steps for a task
     * @private
     */
    _calculateTotalSteps(config) {
        // Round 1: facets × models
        let steps = config.facets.length * config.models.length;

        // Analysis: 1 step
        steps += 1;

        // Round 2: if enabled (estimate: same as Round 1)
        if (config.rounds > 1) {
            steps += config.facets.length * config.models.length;
        }

        // Report generation: 1 step
        steps += 1;

        return steps;
    }
}

// Singleton instance
const stateManager = new AgentStateManager();

export default stateManager;
export { AgentStateManager };
