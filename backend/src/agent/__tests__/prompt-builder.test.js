/**
 * Prompt Builder Tests
 */

import { PromptBuilder } from '../prompts/prompt-builder.js';

describe('PromptBuilder', () => {
    const sampleCode = `
function login(username, password) {
    const query = "SELECT * FROM users WHERE username = '" + username + "'";
    db.query(query);
}
    `.trim();

    describe('buildRound1Prompt', () => {
        test('should build prompt for security facet', () => {
            const prompt = PromptBuilder.buildRound1Prompt('security', sampleCode);

            expect(prompt).toHaveProperty('system');
            expect(prompt).toHaveProperty('user');
            expect(prompt.system).toContain('security');
            expect(prompt.user).toContain(sampleCode);
        });

        test('should build prompt for performance facet', () => {
            const prompt = PromptBuilder.buildRound1Prompt('performance', sampleCode);

            expect(prompt.system).toContain('performance');
            expect(prompt.user).toContain(sampleCode);
        });

        test('should throw for non-existent facet', () => {
            expect(() => {
                PromptBuilder.buildRound1Prompt('non-existent', sampleCode);
            }).toThrow(/not found/);
        });
    });

    describe('buildRound2Prompt', () => {
        test('should build Round 2 prompt with gaps', () => {
            const gaps = [
                'Check for XSS vulnerabilities',
                'Verify input sanitization'
            ];

            const prompt = PromptBuilder.buildRound2Prompt('security', sampleCode, gaps);

            expect(prompt).toHaveProperty('system');
            expect(prompt).toHaveProperty('user');
            expect(prompt.user).toContain('XSS');
            expect(prompt.user).toContain('input sanitization');
        });
    });

    describe('buildPromptsForTask', () => {
        test('should build prompts for multiple facets', () => {
            const prompts = PromptBuilder.buildPromptsForTask(
                ['security', 'performance'],
                sampleCode,
                1
            );

            expect(prompts).toHaveLength(2);
            expect(prompts[0].facetId).toBe('security');
            expect(prompts[1].facetId).toBe('performance');
            expect(prompts[0].prompt).toHaveProperty('system');
            expect(prompts[0].prompt).toHaveProperty('user');
        });

        test('should build Round 2 prompts with gaps', () => {
            const gapsByFacet = {
                'security': ['Check XSS'],
                'performance': ['Check memory leaks']
            };

            const prompts = PromptBuilder.buildPromptsForTask(
                ['security', 'performance'],
                sampleCode,
                2,
                gapsByFacet
            );

            expect(prompts).toHaveLength(2);
            expect(prompts[0].prompt.user).toContain('XSS');
            expect(prompts[1].prompt.user).toContain('memory leaks');
        });
    });
});
