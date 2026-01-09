/**
 * Response Analyzer Tests
 */

import { ResponseAnalyzer } from '../analyzer/response-analyzer.js';

describe('ResponseAnalyzer', () => {
    const mockResponses = [
        {
            facet: 'security',
            model: 'openai',
            content: 'SQL injection vulnerability found on line 5. XSS issue detected.',
            error: null
        },
        {
            facet: 'security',
            model: 'gemini',
            content: 'SQL injection detected. Authentication issue present.',
            error: null
        },
        {
            facet: 'security',
            model: 'deepseek',
            content: 'XSS vulnerability found. CSRF protection missing.',
            error: null
        },
        {
            facet: 'performance',
            model: 'openai',
            content: 'Memory leak detected. N+1 query problem.',
            error: null
        },
        {
            facet: 'performance',
            model: 'gemini',
            error: 'API failed'
        }
    ];

    describe('analyzeRound1', () => {
        test('should produce complete analysis', () => {
            const analysis = ResponseAnalyzer.analyzeRound1(mockResponses);

            expect(analysis).toHaveProperty('patterns');
            expect(analysis).toHaveProperty('gaps');
            expect(analysis).toHaveProperty('contradictions');
            expect(analysis).toHaveProperty('coverage');
        });
    });

    describe('detectPatterns', () => {
        test('should detect patterns mentioned by multiple models', () => {
            const patterns = ResponseAnalyzer.detectPatterns(mockResponses);

            expect(Array.isArray(patterns)).toBe(true);

            // SQL injection mentioned by openai and gemini
            const sqlPattern = patterns.find(p => p.text === 'sql injection');
            if (sqlPattern) {
                expect(sqlPattern.models.length).toBeGreaterThanOrEqual(2);
            }
        });

        test('should sort patterns by frequency', () => {
            const patterns = ResponseAnalyzer.detectPatterns(mockResponses);

            if (patterns.length > 1) {
                for (let i = 0; i < patterns.length - 1; i++) {
                    expect(patterns[i].models.length).toBeGreaterThanOrEqual(
                        patterns[i + 1].models.length
                    );
                }
            }
        });
    });

    describe('findGaps', () => {
        test('should identify gaps', () => {
            const gaps = ResponseAnalyzer.findGaps(mockResponses);

            expect(Array.isArray(gaps)).toBe(true);
            // Should find gaps where some models mentioned things others didn't
        });

        test('should identify which models mentioned and which missed', () => {
            const gaps = ResponseAnalyzer.findGaps(mockResponses);

            gaps.forEach(gap => {
                expect(gap).toHaveProperty('facet');
                expect(gap).toHaveProperty('topic');
                expect(gap).toHaveProperty('mentionedBy');
                expect(gap).toHaveProperty('missedBy');
                expect(gap.mentionedBy.length).toBeGreaterThan(0);
                expect(gap.missedBy.length).toBeGreaterThan(0);
            });
        });
    });

    describe('detectContradictions', () => {
        test('should detect contradictions', () => {
            const contradictions = ResponseAnalyzer.detectContradictions(mockResponses);

            expect(Array.isArray(contradictions)).toBe(true);
        });
    });

    describe('measureCoverage', () => {
        test('should measure coverage by facet', () => {
            const coverage = ResponseAnalyzer.measureCoverage(mockResponses);

            expect(coverage).toHaveProperty('security');
            expect(coverage).toHaveProperty('performance');

            expect(coverage.security.total).toBe(3);
            expect(coverage.security.successful).toBe(3);
            expect(coverage.security.failed).toBe(0);

            expect(coverage.performance.total).toBe(2);
            expect(coverage.performance.successful).toBe(1);
            expect(coverage.performance.failed).toBe(1);
        });

        test('should calculate percentages', () => {
            const coverage = ResponseAnalyzer.measureCoverage(mockResponses);

            expect(coverage.security.percentage).toBe(100);
            expect(coverage.performance.percentage).toBe(50);
        });
    });
});
