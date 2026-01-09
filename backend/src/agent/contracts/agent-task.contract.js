/**
 * Agent Task Contract
 * Defines the structure of an Agent Task
 */

/**
 * @typedef {Object} AgentTask
 * @property {string} id - Unique task identifier (e.g., 'js-code-audit')
 * @property {string} name - Human-readable task name
 * @property {string} description - Detailed description of what this task does
 * @property {string[]} facets - List of facet IDs to analyze (e.g., ['security', 'performance'])
 * @property {string[]} models - List of model IDs to use (e.g., ['openai', 'gemini', 'deepseek'])
 * @property {number} rounds - Number of analysis rounds (1 or 2)
 * @property {Function} buildRound1Prompt - Function to build Round 1 prompts
 * @property {Function} buildRound2Prompt - Function to build Round 2 prompts (optional)
 * @property {string} outputFormat - Output format ('markdown' | 'json' | 'structured')
 */

/**
 * Validate an Agent Task configuration
 * @param {AgentTask} task - The task to validate
 * @throws {Error} If task is invalid
 * @returns {boolean} True if valid
 */
export function validateAgentTask(task) {
    if (!task || typeof task !== 'object') {
        throw new Error('Task must be an object');
    }

    if (!task.id || typeof task.id !== 'string') {
        throw new Error('Task must have a valid id (string)');
    }

    if (!Array.isArray(task.facets) || task.facets.length === 0) {
        throw new Error('Task must have at least one facet');
    }

    if (!Array.isArray(task.models) || task.models.length === 0) {
        throw new Error('Task must have at least one model');
    }

    if (typeof task.buildRound1Prompt !== 'function') {
        throw new Error('Task must have buildRound1Prompt function');
    }

    if (task.rounds > 1 && typeof task.buildRound2Prompt !== 'function') {
        throw new Error('Task with rounds > 1 must have buildRound2Prompt function');
    }

    return true;
}

/**
 * Template for creating a new Agent Task
 */
export const AgentTaskTemplate = {
    id: '',
    name: '',
    description: '',
    facets: [],
    models: [],
    rounds: 1,
    buildRound1Prompt: (facet, input) => {
        throw new Error('buildRound1Prompt not implemented');
    },
    buildRound2Prompt: (facet, round1Results, gaps) => {
        throw new Error('buildRound2Prompt not implemented');
    },
    outputFormat: 'markdown'
};
