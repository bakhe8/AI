/**
 * Task Registry - Manages available Agent Tasks
 */

import { validateAgentTask } from '../contracts/agent-task.contract.js';

class TaskRegistry {
    constructor() {
        this.tasks = new Map();
    }

    /**
     * Register a new task
     * @param {Object} task - Agent Task configuration
     * @throws {Error} If task is invalid or ID already exists
     */
    register(task) {
        validateAgentTask(task);

        if (this.tasks.has(task.id)) {
            throw new Error(`Task '${task.id}' is already registered`);
        }

        this.tasks.set(task.id, task);
        return true;
    }

    /**
     * Get a task by ID
     * @param {string} taskId - Task identifier
     * @returns {Object|null} The task or null if not found
     */
    get(taskId) {
        return this.tasks.get(taskId) || null;
    }

    /**
     * List all registered tasks
     * @returns {Array<Object>} Array of task summaries
     */
    list() {
        return Array.from(this.tasks.values()).map(task => ({
            id: task.id,
            name: task.name,
            description: task.description,
            facets: task.facets,
            models: task.models,
            rounds: task.rounds
        }));
    }

    /**
     * Check if a task exists
     * @param {string} taskId - Task identifier
     * @returns {boolean}
     */
    has(taskId) {
        return this.tasks.has(taskId);
    }

    /**
     * Unregister a task
     * @param {string} taskId - Task identifier
     * @returns {boolean} True if task was removed
     */
    unregister(taskId) {
        return this.tasks.delete(taskId);
    }

    /**
     * Clear all tasks (for testing)
     */
    clear() {
        this.tasks.clear();
    }
}

// Singleton instance
const registry = new TaskRegistry();

export default registry;
export { TaskRegistry };
