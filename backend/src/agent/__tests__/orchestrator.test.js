/**
 * Agent Orchestrator Integration Tests
 */

import { AgentOrchestrator } from '../core/orchestrator.js';
import taskRegistry from '../tasks/task-registry.js';
import { JSCodeAuditTask } from '../tasks/implementations/js-code-audit.task.js';

describe('AgentOrchestrator', () => {
    let orchestrator;
    let task;

    beforeEach(() => {
        orchestrator = new AgentOrchestrator();
        task = new JSCodeAuditTask();

        // Register task
        taskRegistry.clear();
        taskRegistry.register(task.toConfig());
    });

    describe('executeTask', () => {
        test('should execute JS Code Audit task successfully', async () => {
            const code = `
function login(username, password) {
    const query = "SELECT * FROM users WHERE username = '" + username + "'";
    db.query(query);
    return true;
}
            `.trim();

            const response = await orchestrator.executeTask('js-code-audit', code);

            expect(response).toHaveProperty('status');
            expect(response).toHaveProperty('results');

            if (response.status === 'complete') {
                expect(response.results).toHaveProperty('round1');
                expect(response.results).toHaveProperty('analysis');
                expect(response.results).toHaveProperty('report');
                expect(Array.isArray(response.results.round1)).toBe(true);

                // Verify new analysis structure
                expect(response.results.analysis).toHaveProperty('patterns');
                expect(response.results.analysis).toHaveProperty('gaps');

                // Verify report
                expect(response.results.report).toHaveProperty('markdown');
            }
        }, 90000); // allow slow external API calls

        test('should throw for non-existent task', async () => {
            await expect(
                orchestrator.executeTask('non-existent', 'test')
            ).rejects.toThrow(/not found/);
        });
    });

    describe('basicAnalysis', () => {
        test('should analyze results correctly', () => {
            const mockResults = [
                { facet: 'security', model: 'openai', content: 'test', error: null },
                { facet: 'security', model: 'gemini', content: 'test', error: null },
                { facet: 'performance', model: 'openai', error: 'failed' }
            ];

            const analysis = orchestrator.basicAnalysis(mockResults);

            expect(analysis.totalResponses).toBe(3);
            expect(analysis.successfulResponses).toBe(2);
            expect(analysis.failedResponses).toBe(1);
            expect(analysis.byFacet.security.successful).toBe(2);
            expect(analysis.byFacet.performance.failed).toBe(1);
        });
    });
});
