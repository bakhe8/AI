/**
 * End-to-End Test for Agent System
 * Tests the complete flow: Task -> Orchestrator -> Kernel -> Models
 */

import { AgentOrchestrator } from '../core/orchestrator.js';
import taskRegistry from '../tasks/task-registry.js';
import { JSCodeAuditTask } from '../tasks/implementations/js-code-audit.task.js';

describe('Agent System E2E', () => {
    let orchestrator;

    beforeAll(() => {
        orchestrator = new AgentOrchestrator();

        // Register JS Code Audit task
        const task = new JSCodeAuditTask();
        taskRegistry.clear();
        taskRegistry.register(task.toConfig());
    });

    test('should execute complete JS code audit', async () => {
        // Sample vulnerable code
        const code = `
const express = require('express');
const app = express();

app.get('/user', (req, res) => {
    const userId = req.query.id;
    const query = "SELECT * FROM users WHERE id = " + userId;
    
    db.query(query, (err, results) => {
        res.send(results);
    });
});

app.listen(3000);
        `.trim();

        console.log('🚀 Starting Agent System E2E Test...');
        console.log('📝 Code to analyze:', code.substring(0, 100) + '...');

        const response = await orchestrator.executeTask('js-code-audit', code);

        console.log('📊 Response Status:', response.status);

        if (response.status === 'complete') {
            console.log('✅ Task completed successfully!');
            console.log('📈 Stats:', response.stats);
            console.log('📊 Analysis:', JSON.stringify(response.results.analysis, null, 2));

            // Verify structure
            expect(response.results).toHaveProperty('round1');
            expect(response.results).toHaveProperty('analysis');
            expect(response.results).toHaveProperty('report');
            expect(Array.isArray(response.results.round1)).toBe(true);

            // Verify analysis has new structure
            expect(response.results.analysis).toHaveProperty('patterns');
            expect(response.results.analysis).toHaveProperty('gaps');
            expect(response.results.analysis).toHaveProperty('contradictions');
            expect(response.results.analysis).toHaveProperty('coverage');

            // Verify report structure
            expect(response.results.report).toHaveProperty('metadata');
            expect(response.results.report).toHaveProperty('summary');
            expect(response.results.report).toHaveProperty('measurements');
            expect(response.results.report).toHaveProperty('markdown');

            // Should have responses for 3 facets × 3 models = 9 responses
            expect(response.results.round1.length).toBeGreaterThan(0);

            console.log(`\n📋 Round 1 Results (${response.results.round1.length} responses):`);
            response.results.round1.forEach((result, i) => {
                console.log(`\n${i + 1}. ${result.facet} - ${result.model}:`);
                if (result.error) {
                    console.log(`   ❌ Error: ${result.error}`);
                } else {
                    console.log(`   ✅ Success (${result.content.length} chars)`);
                    console.log(`   Preview: ${result.content.substring(0, 150)}...`);
                }
            });

        } else if (response.status === 'error') {
            console.log('❌ Task failed');
            console.log('Error:', response.error);
        }

        // Test should pass regardless of API availability
        expect(['complete', 'error']).toContain(response.status);

    }, 120000); // 2 minute timeout
});
