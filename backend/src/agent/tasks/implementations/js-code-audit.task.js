/**
 * JS Code Audit Task
 * Comprehensive security, performance, and quality audit for JavaScript code
 */

import { BaseTask } from '../base-task.js';
import { PromptBuilder } from '../../prompts/prompt-builder.js';

export class JSCodeAuditTask extends BaseTask {
    constructor() {
        super({
            id: 'js-code-audit',
            name: 'JavaScript Code Audit',
            description: 'Comprehensive audit of JavaScript code covering security, performance, and code quality',
            facets: ['security', 'performance', 'quality'],
            models: ['openai', 'gemini', 'deepseek'],
            rounds: 1, // Start with 1 round only
            outputFormat: 'markdown'
        });
    }

    /**
     * Build Round 1 prompt for a specific facet
     * @param {string} facet - Facet ID
     * @param {string} code - JavaScript code to audit
     * @returns {{system: string, user: string}}
     */
    buildRound1Prompt(facet, code) {
        if (!code || typeof code !== 'string') {
            throw new Error('Code must be a non-empty string');
        }

        return PromptBuilder.buildRound1Prompt(facet, code);
    }

    /**
     * Build Round 2 prompt (not implemented yet)
     * @param {string} facet - Facet ID
     * @param {Array} round1Results - Round 1 results
     * @param {Array} gaps - Identified gaps
     * @returns {{system: string, user: string}}
     */
    buildRound2Prompt(facet, round1Results, gaps) {
        throw new Error('Round 2 not yet implemented for this task');
    }

    /**
     * Validate input code
     * @param {string} code - Code to validate
     * @returns {boolean}
     * @throws {Error} If code is invalid
     */
    validateInput(code) {
        if (!code || typeof code !== 'string') {
            throw new Error('Input must be a non-empty string');
        }

        if (code.trim().length === 0) {
            throw new Error('Input cannot be empty or whitespace only');
        }

        // Basic check for JavaScript syntax (very simple)
        if (!code.includes('function') && !code.includes('const') &&
            !code.includes('let') && !code.includes('var') &&
            !code.includes('class') && !code.includes('import')) {
            console.warn('Warning: Input may not be JavaScript code');
        }

        return true;
    }
}
