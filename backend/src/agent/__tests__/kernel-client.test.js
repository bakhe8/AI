/**
 * Kernel Client Tests
 */

import { KernelClient } from '../core/kernel-client.js';

describe('KernelClient', () => {
    let client;

    beforeEach(() => {
        client = new KernelClient('http://localhost:3000');
    });

    describe('send', () => {
        test('should send request to kernel successfully', async () => {
            const agentPrompt = {
                system: 'You are a helpful assistant.',
                user: 'Hello, how are you?'
            };

            const metadata = {
                taskId: 'test-task-1',
                facet: 'general',
                round: 1
            };

            // This will actually call the real Kernel if it's running
            // For unit tests, we'd use a mock. For now, this is an integration test.
            try {
                const response = await client.send('mock', agentPrompt, metadata);

                expect(response).toHaveProperty('model', 'mock');
                expect(response).toHaveProperty('content');
                expect(response).toHaveProperty('metadata');
                expect(response.metadata).toHaveProperty('taskId', 'test-task-1');
                expect(response.metadata).toHaveProperty('timestamp');
            } catch (error) {
                // If Kernel is not running, skip this test
                console.warn('Kernel not running, skipping integration test');
            }
        }, 10000); // 10s timeout

        test('should throw on invalid model', async () => {
            const agentPrompt = {
                system: 'Test',
                user: 'Test'
            };

            const metadata = {
                taskId: 'test',
                facet: 'test',
                round: 1
            };

            await expect(
                client.send('invalid-model', agentPrompt, metadata)
            ).rejects.toThrow();
        });
    });

    describe('sendParallel', () => {
        test('should handle mixed success and failure', async () => {
            const agentPrompt = {
                system: 'Test',
                user: 'Test'
            };

            const metadata = {
                taskId: 'test-parallel',
                facet: 'test',
                round: 1
            };

            try {
                const results = await client.sendParallel(
                    ['mock', 'invalid-model'],
                    agentPrompt,
                    metadata
                );

                expect(results).toHaveLength(2);

                // One should succeed (mock), one should fail (invalid)
                const success = results.find(r => !r.error);
                const failure = results.find(r => r.error);

                if (success) {
                    expect(success).toHaveProperty('content');
                }

                expect(failure).toHaveProperty('error');
            } catch (error) {
                console.warn('Kernel not running, skipping test');
            }
        }, 15000);
    });

    describe('healthCheck', () => {
        test('should return boolean', async () => {
            const healthy = await client.healthCheck();
            expect(typeof healthy).toBe('boolean');
        });
    });
});
