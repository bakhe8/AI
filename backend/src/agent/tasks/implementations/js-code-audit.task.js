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
            rounds: 2, // Enable Round 2 for deeper analysis
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
        // Extract the original code from Round 1 results
        const originalCode = round1Results[0]?.metadata?.input || '';

        // Filter gaps relevant to this facet
        const facetGaps = gaps.filter(gap => 
            gap.facets && gap.facets.includes(facet)
        );

        // Build targeted questions based on gaps
        const gapQuestions = facetGaps.map(gap => 
            `- ${gap.text} (mentioned by: ${gap.models.join(', ')})`
        ).join('\n');

        const systemPrompt = `You are a senior code auditor conducting a deep-dive analysis.
Focus on the ${facet} aspect of the code.

CRITICAL LAYER 1 RULES (STRICTLY ENFORCED):
- NO recommendations or suggestions
- NO use of words: "should", "recommend", "fix", "improve", "consider", "suggest"
- ONLY measure, detect, count, and report what exists
- Report findings as neutral observations

Previous Round 1 analysis identified these gaps or areas needing clarification:
${gapQuestions || 'No specific gaps identified, perform general deep analysis'}

Your task: Provide DEEPER MEASUREMENT on these specific areas only.`;

        const userPrompt = `Code to analyze (focused on gaps from Round 1):

\`\`\`javascript
${originalCode}
\`\`\`

Focus on addressing the gaps mentioned in your instructions. Measure and detect only.`;

        return {
            system: systemPrompt,
            user: userPrompt
        };
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
