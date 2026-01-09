/**
 * Base Task Class
 * All Agent Tasks should extend this class
 */

export class BaseTask {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.facets = config.facets || [];
        this.models = config.models || ['openai', 'gemini', 'deepseek'];
        this.rounds = config.rounds || 1;
        this.outputFormat = config.outputFormat || 'markdown';
    }

    /**
     * Build Round 1 prompt for a specific facet
     * @param {string} facet - Facet ID
     * @param {any} input - User input
     * @returns {{system: string, user: string}} Agent prompt
     */
    buildRound1Prompt(facet, input) {
        throw new Error('buildRound1Prompt must be implemented by subclass');
    }

    /**
     * Build Round 2 prompt for a specific facet
     * @param {string} facet - Facet ID
     * @param {Array} round1Results - Results from Round 1
     * @param {Array} gaps - Identified gaps
     * @returns {{system: string, user: string}} Agent prompt
     */
    buildRound2Prompt(facet, round1Results, gaps) {
        if (this.rounds < 2) {
            throw new Error('This task does not support Round 2');
        }
        throw new Error('buildRound2Prompt must be implemented by subclass');
    }

    /**
     * Analyze responses (optional override)
     * @param {Array} responses - Responses from models
     * @returns {Object} Analysis results
     */
    analyzeResponses(responses) {
        // Basic analysis - can be overridden
        return {
            totalResponses: responses.length,
            successfulResponses: responses.filter(r => !r.error).length,
            failedResponses: responses.filter(r => r.error).length
        };
    }

    /**
     * Get task configuration as plain object
     * @returns {Object}
     */
    toConfig() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            facets: this.facets,
            models: this.models,
            rounds: this.rounds,
            outputFormat: this.outputFormat,
            buildRound1Prompt: this.buildRound1Prompt.bind(this),
            buildRound2Prompt: this.buildRound2Prompt.bind(this),
            analyzeResponses: this.analyzeResponses.bind(this)
        };
    }
}
