// Contract Validation Tests

import { validateContract } from '../contract.js';

describe('Contract Validation', () => {
    describe('validateContract', () => {
        test('should accept valid contract', () => {
            const validPayload = {
                channel_id: 'test-channel',
                model: 'openai',
                messages: [
                    { role: 'user', content: 'Hello' }
                ]
            };

            expect(() => validateContract(validPayload)).not.toThrow();
        });

        test('should reject missing channel_id', () => {
            const invalidPayload = {
                model: 'openai',
                messages: [{ role: 'user', content: 'Hello' }]
            };

            expect(() => validateContract(invalidPayload))
                .toThrow('channel_id must be a non-empty string');
        });

        test('should reject missing model', () => {
            const invalidPayload = {
                channel_id: 'test-channel',
                messages: [{ role: 'user', content: 'Hello' }]
            };

            expect(() => validateContract(invalidPayload))
                .toThrow('model must be a non-empty string');
        });

        test('should reject missing messages', () => {
            const invalidPayload = {
                channel_id: 'test-channel',
                model: 'openai'
            };

            expect(() => validateContract(invalidPayload))
                .toThrow('messages must be an array');
        });

        test('should reject empty messages array', () => {
            const invalidPayload = {
                channel_id: 'test-channel',
                model: 'openai',
                messages: []
            };

            expect(() => validateContract(invalidPayload))
                .toThrow('messages must contain at least one message');
        });

        test('should reject invalid message format', () => {
            const invalidPayload = {
                channel_id: 'test-channel',
                model: 'openai',
                messages: [
                    { role: 'user' } // missing content
                ]
            };

            expect(() => validateContract(invalidPayload))
                .toThrow('Each message must have role and content');
        });

        test('should reject invalid model', () => {
            const invalidPayload = {
                channel_id: 'test-channel',
                model: 'unknown-model',
                messages: [{ role: 'user', content: 'Hello' }]
            };

            expect(() => validateContract(invalidPayload))
                .toThrow(/Invalid model/);
        });

        test('should reject invalid channel_id characters', () => {
            const invalidPayload = {
                channel_id: 'bad channel!',
                model: 'openai',
                messages: [{ role: 'user', content: 'Hello' }]
            };

            expect(() => validateContract(invalidPayload))
                .toThrow('channel_id contains invalid characters');
        });

        test('should reject when last message is not from user', () => {
            const invalidPayload = {
                channel_id: 'test-channel',
                model: 'openai',
                messages: [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi there!' }
                ]
            };

            expect(() => validateContract(invalidPayload))
                .toThrow('Last message must be from user');
        });

        test('should accept complex valid messages', () => {
            const validPayload = {
                channel_id: 'test-channel',
                model: 'openai',
                messages: [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi there!' },
                    { role: 'user', content: 'How are you?' }
                ]
            };

            expect(() => validateContract(validPayload)).not.toThrow();
        });
    });
});
