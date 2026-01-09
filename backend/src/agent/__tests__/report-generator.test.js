/**
 * Report Generator Tests
 */

import { ReportGenerator } from '../reports/report-generator.js';

describe('ReportGenerator', () => {
    const mockTaskConfig = {
        name: 'Test Audit',
        facets: ['security', 'performance'],
        models: ['openai', 'gemini', 'deepseek']
    };

    const mockRound1 = [
        {
            facet: 'security',
            model: 'openai',
            content: 'SQL injection found',
            error: null
        },
        {
            facet: 'security',
            model: 'gemini',
            content: 'XSS detected',
            error: null
        },
        {
            facet: 'performance',
            model: 'openai',
            error: 'Failed'
        }
    ];

    const mockAnalysis = {
        patterns: [
            {
                text: 'sql injection',
                models: ['openai', 'gemini'],
                facets: ['security'],
                frequency: '2/2',
                count: 2
            }
        ],
        gaps: [
            {
                facet: 'security',
                topic: 'xss',
                mentionedBy: ['gemini'],
                missedBy: ['openai']
            }
        ],
        contradictions: [],
        coverage: {
            security: { total: 2, successful: 2, failed: 0, percentage: 100 },
            performance: { total: 1, successful: 0, failed: 1, percentage: 0 }
        }
    };

    describe('generateRawReport', () => {
        test('should generate complete report structure', () => {
            const report = ReportGenerator.generateRawReport(
                'test-task',
                mockTaskConfig,
                mockRound1,
                mockAnalysis
            );

            expect(report).toHaveProperty('metadata');
            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('measurements');
            expect(report).toHaveProperty('raw_responses');
            expect(report).toHaveProperty('markdown');
        });

        test('should include correct metadata', () => {
            const report = ReportGenerator.generateRawReport(
                'test-task',
                mockTaskConfig,
                mockRound1,
                mockAnalysis
            );

            expect(report.metadata.taskId).toBe('test-task');
            expect(report.metadata.taskName).toBe('Test Audit');
            expect(report.metadata.facets).toEqual(['security', 'performance']);
            expect(report.metadata.models).toEqual(['openai', 'gemini', 'deepseek']);
        });

        test('should include correct summary', () => {
            const report = ReportGenerator.generateRawReport(
                'test-task',
                mockTaskConfig,
                mockRound1,
                mockAnalysis
            );

            expect(report.summary.totalResponses).toBe(3);
            expect(report.summary.successfulResponses).toBe(2);
            expect(report.summary.failedResponses).toBe(1);
            expect(report.summary.patternsDetected).toBe(1);
            expect(report.summary.gapsIdentified).toBe(1);
        });

        test('should include measurements', () => {
            const report = ReportGenerator.generateRawReport(
                'test-task',
                mockTaskConfig,
                mockRound1,
                mockAnalysis
            );

            expect(report.measurements.patterns).toEqual(mockAnalysis.patterns);
            expect(report.measurements.gaps).toEqual(mockAnalysis.gaps);
            expect(report.measurements.coverage).toEqual(mockAnalysis.coverage);
        });

        test('should generate markdown string', () => {
            const report = ReportGenerator.generateRawReport(
                'test-task',
                mockTaskConfig,
                mockRound1,
                mockAnalysis
            );

            expect(typeof report.markdown).toBe('string');
            expect(report.markdown).toContain('# Raw Measurement Report');
            expect(report.markdown).toContain('Layer 1');
            expect(report.markdown).toContain('Pattern Measurements');
            expect(report.markdown).toContain('Gap Measurements');
        });

        test('markdown should NOT contain recommendations', () => {
            const report = ReportGenerator.generateRawReport(
                'test-task',
                mockTaskConfig,
                mockRound1,
                mockAnalysis
            );

            const markdown = report.markdown.toLowerCase();
            expect(markdown).not.toContain('recommend');
            expect(markdown).not.toContain('should fix');
            expect(markdown).not.toContain('severity');
        });
    });
});
