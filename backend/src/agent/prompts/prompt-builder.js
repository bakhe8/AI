/**
 * Prompt Builder
 * Builds Agent prompts with Domain Lock enforcement
 */

import facetLibrary from '../facets/facet-library.js';

export class PromptBuilder {
    /**
     * Build a Round 1 prompt for a specific facet
     * @param {string} facetId - Facet identifier
     * @param {string} userCode - The code to analyze
     * @param {Object} [options] - Additional options
     * @returns {{system: string, user: string}} Agent prompt
     */
    static buildRound1Prompt(facetId, userCode, options = {}) {
        const facet = facetLibrary.get(facetId);

        if (!facet) {
            throw new Error(`Facet '${facetId}' not found`);
        }

        const system = facet.systemPrompt;

        const user = `Analyze the following code for ${facet.name.toLowerCase()}:

\`\`\`javascript
${userCode}
\`\`\`

Remember:
- Focus ONLY on ${facet.name.toLowerCase()}
- Follow the specified format strictly
- Provide specific line numbers
- Do NOT provide recommendations or fixes`;

        return { system, user };
    }

    /**
     * Build a Round 2 prompt based on gaps from Round 1
     * @param {string} facetId - Facet identifier
     * @param {string} userCode - The code to analyze
     * @param {Array} gaps - Gaps identified from Round 1
     * @returns {{system: string, user: string}} Agent prompt
     */
    static buildRound2Prompt(facetId, userCode, gaps) {
        const facet = facetLibrary.get(facetId);

        if (!facet) {
            throw new Error(`Facet '${facetId}' not found`);
        }

        const gapList = gaps.map((gap, i) => `${i + 1}. ${gap}`).join('\n');

        const system = facet.systemPrompt;

        const user = `Re-analyze the following code for ${facet.name.toLowerCase()}.

The following specific areas were NOT addressed in the initial analysis:
${gapList}

Focus specifically on these gaps:

\`\`\`javascript
${userCode}
\`\`\`

Remember:
- Address ONLY the gaps listed above
- Follow the specified format strictly
- Provide specific line numbers
- Do NOT repeat findings from Round 1`;

        return { system, user };
    }

    /**
     * Build prompts for all facets in a task
     * @param {string[]} facetIds - Array of facet identifiers
     * @param {string} userCode - The code to analyze
     * @param {number} round - Round number (1 or 2)
     * @param {Object} [gapsByFacet] - Gaps by facet (for Round 2)
     * @returns {Array<{facetId: string, prompt: {system: string, user: string}}>}
     */
    static buildPromptsForTask(facetIds, userCode, round = 1, gapsByFacet = {}) {
        return facetIds.map(facetId => {
            const prompt = round === 1
                ? this.buildRound1Prompt(facetId, userCode)
                : this.buildRound2Prompt(facetId, userCode, gapsByFacet[facetId] || []);

            return {
                facetId,
                prompt
            };
        });
    }
}
