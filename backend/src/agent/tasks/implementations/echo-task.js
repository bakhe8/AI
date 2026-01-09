/**
 * Simple Echo Task - PoC for testing Agent infrastructure
 * This task simply echoes back what models say, for testing purposes
 */

import { BaseTask } from '../base-task.js';

export class EchoTask extends BaseTask {
    constructor() {
        super({
            id: 'echo-test',
            name: 'Echo Test Task',
            description: 'Simple task that echoes model responses (for testing)',
            facets: ['general'],
            models: ['mock'],
            rounds: 1,
            outputFormat: 'json'
        });
    }

    /**
     * Build Round 1 prompt
     * @param {string} facet - Facet ID (always 'general' for this task)
     * @param {string} input - User input
     * @returns {{system: string, user: string}}
     */
    buildRound1Prompt(facet, input) {
        return {
            system: 'You are a helpful assistant. Respond naturally to the user.',
            user: input || 'Hello, this is a test!'
        };
    }

    /**
     * Analyze responses (override to provide simple summary)
     * @param {Array} responses - Model responses
     * @returns {Object}
     */
    analyzeResponses(responses) {
        const baseAnalysis = super.analyzeResponses(responses);

        return {
            ...baseAnalysis,
            responses: responses.map(r => ({
                model: r.model,
                success: !r.error,
                contentLength: r.content ? r.content.length : 0
            }))
        };
    }
}
