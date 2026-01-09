// Health check tests

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../adapters/registry.js', () => {
    return {
        getAdapter: jest.fn()
    };
});

const { getAdapter } = await import('../../adapters/registry.js');
const { healthCheck } = await import('../health.js');

function resetEnv() {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.GITHUB_TOKEN;
}

describe('healthCheck', () => {
    beforeEach(() => {
        resetEnv();
        getAdapter.mockReset();
    });

    afterAll(() => {
        resetEnv();
    });

    test('returns shallow availability based on env vars', async () => {
        process.env.OPENAI_API_KEY = 'test';
        // others remain undefined

        const status = await healthCheck(false);

        expect(status.adapters.openai.status).toBe('available');
        expect(status.adapters.gemini.status).toBe('unavailable');
        expect(status.adapters.deepseek.status).toBe('unavailable');
        expect(status.adapters.copilot.status).toBe('unavailable');
    });

    test('deep check marks success and failure correctly', async () => {
        process.env.OPENAI_API_KEY = 'test';
        process.env.GEMINI_API_KEY = 'test';

        // openai succeeds
        getAdapter.mockImplementation((model) => {
            if (model === 'openai') {
                return { send: jest.fn().mockResolvedValue({ role: 'assistant', content: 'pong' }) };
            }
            if (model === 'gemini') {
                return { send: jest.fn().mockRejectedValue(new Error('boom')) };
            }
            throw new Error(`Unknown model: ${model}`);
        });

        const status = await healthCheck(true);

        expect(status.adapters.openai.status).toBe('available');
        expect(typeof status.adapters.openai.latencyMs).toBe('number');
        expect(status.adapters.gemini.status).toBe('unavailable');
        expect(status.adapters.gemini.error).toContain('boom');
    });
});
