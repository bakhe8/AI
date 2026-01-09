// Router Tests

import { routeMessage } from '../router.js';

describe('Router', () => {
    describe('routeMessage', () => {
        test('should route to openai adapter', async () => {
            const messages = [{ role: 'user', content: 'Hello' }];

            // This will fail if OPENAI_API_KEY is not set, which is expected
            try {
                const result = await routeMessage('openai', messages);
                // If it succeeds, check the structure
                expect(result).toHaveProperty('role');
                expect(result).toHaveProperty('content');
            } catch (error) {
                // Expected if API key not configured
                expect(error.message).toContain('not configured');
            }
        });

        test('should throw error for unknown model', async () => {
            const messages = [{ role: 'user', content: 'Hello' }];
            await expect(routeMessage('unknown-model', messages))
                .rejects.toThrow('Unknown model: unknown-model');
        });
    });
});
