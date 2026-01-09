/**
 * Agent Response Contract
 * Defines the structure of the response Agent sends to the frontend
 */

/**
 * @typedef {Object} AgentResponse
 * @property {string} status - Task status ('running' | 'analyzing' | 'complete' | 'error')
 * @property {string} taskId - Unique task identifier
 * @property {Object} [progress] - Progress information (optional)
 * @property {number} progress.current - Current step
 * @property {number} progress.total - Total steps
 * @property {string} progress.phase - Current phase
 * @property {Object} [results] - Results (when status is 'complete')
 * @property {Object} [error] - Error information (when status is 'error')
 * @property {Object} stats - Execution statistics
 */

/**
 * @typedef {Object} AgentProgress
 * @property {number} current - Current step number
 * @property {number} total - Total number of steps
 * @property {string} phase - Current phase ('round1' | 'analysis' | 'round2' | 'reporting')
 */

/**
 * @typedef {Object} AgentResults
 * @property {Array} round1 - Round 1 responses
 * @property {Object} analysis - Analysis results
 * @property {Array} [round2] - Round 2 responses (optional)
 * @property {Object} report - Final report
 */

/**
 * @typedef {Object} AgentStats
 * @property {number} duration - Total duration in seconds
 * @property {number} apiCalls - Number of API calls made
 * @property {number} [tokensUsed] - Tokens used (if available)
 */

/**
 * Create a running status response
 * @param {string} taskId - Task ID
 * @param {AgentProgress} progress - Progress info
 * @returns {AgentResponse}
 */
export function createRunningResponse(taskId, progress) {
    return {
        status: 'running',
        taskId,
        progress,
        stats: {
            duration: 0,
            apiCalls: 0
        }
    };
}

/**
 * Create a complete status response
 * @param {string} taskId - Task ID
 * @param {AgentResults} results - Results
 * @param {AgentStats} stats - Statistics
 * @returns {AgentResponse}
 */
export function createCompleteResponse(taskId, results, stats) {
    return {
        status: 'complete',
        taskId,
        results,
        stats
    };
}

/**
 * Create an error status response
 * @param {string} taskId - Task ID
 * @param {Error} error - The error
 * @param {string} phase - Phase where error occurred
 * @returns {AgentResponse}
 */
export function createErrorResponse(taskId, error, phase) {
    return {
        status: 'error',
        taskId,
        error: {
            message: error.message,
            phase,
            details: error.stack
        },
        stats: {
            duration: 0,
            apiCalls: 0
        }
    };
}
