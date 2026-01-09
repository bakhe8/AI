/**
 * JS Code Audit Task Tests
 */

import { JSCodeAuditTask } from '../tasks/implementations/js-code-audit.task.js';

describe('JSCodeAuditTask', () => {
    let task;

    beforeEach(() => {
        task = new JSCodeAuditTask();
    });

    describe('configuration', () => {
        test('should have correct task configuration', () => {
            expect(task.id).toBe('js-code-audit');
            expect(task.name).toBe('JavaScript Code Audit');
            expect(task.facets).toEqual(['security', 'performance', 'quality']);
            expect(task.models).toContain('openai');
            expect(task.rounds).toBe(1);
        });
    });

    describe('buildRound1Prompt', () => {
        test('should build prompt for security facet', () => {
            const code = 'function test() { return 42; }';
            const prompt = task.buildRound1Prompt('security', code);

            expect(prompt).toHaveProperty('system');
            expect(prompt).toHaveProperty('user');
            expect(prompt.user).toContain(code);
        });

        test('should throw for empty code', () => {
            expect(() => {
                task.buildRound1Prompt('security', '');
            }).toThrow();
        });
    });

    describe('validateInput', () => {
        test('should accept valid JavaScript code', () => {
            const code = 'function test() { return 42; }';
            expect(() => task.validateInput(code)).not.toThrow();
        });

        test('should reject empty string', () => {
            expect(() => task.validateInput('')).toThrow(/empty/);
        });

        test('should reject whitespace only', () => {
            expect(() => task.validateInput('   ')).toThrow(/empty/);
        });

        test('should reject non-string input', () => {
            expect(() => task.validateInput(null)).toThrow();
            expect(() => task.validateInput(undefined)).toThrow();
            expect(() => task.validateInput(123)).toThrow();
        });
    });

    describe('toConfig', () => {
        test('should convert to config object', () => {
            const config = task.toConfig();

            expect(config.id).toBe('js-code-audit');
            expect(config.facets).toEqual(['security', 'performance', 'quality']);
            expect(typeof config.buildRound1Prompt).toBe('function');
        });
    });
});
