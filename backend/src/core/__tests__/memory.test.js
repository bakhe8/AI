// Memory Management Tests

import { addMessage, getMessages, clearMessages, getMemoryStats, clearAllChannels } from '../memory.js';

describe('Memory Management', () => {
    beforeEach(() => {
        // Clear all channels before each test
        clearAllChannels();
    });

    describe('addMessage', () => {
        test('should add a message to new channel', () => {
            const message = addMessage('test-channel', 'user', 'Hello');

            expect(message).toHaveProperty('role', 'user');
            expect(message).toHaveProperty('content', 'Hello');
            expect(message).toHaveProperty('timestamp');
        });

        test('should add multiple messages to same channel', () => {
            addMessage('test-channel', 'user', 'Message 1');
            addMessage('test-channel', 'assistant', 'Message 2');
            addMessage('test-channel', 'user', 'Message 3');

            const messages = getMessages('test-channel');
            expect(messages).toHaveLength(3);
        });

        test('should limit messages to MAX_MESSAGES_PER_CHANNEL', () => {
            // Add 60 messages (limit is 50)
            for (let i = 0; i < 60; i++) {
                addMessage('test-channel', 'user', `Message ${i}`);
            }

            const messages = getMessages('test-channel');
            expect(messages).toHaveLength(50);

            // Should keep the latest 50
            expect(messages[0].content).toBe('Message 10');
            expect(messages[49].content).toBe('Message 59');
        });
    });

    describe('getMessages', () => {
        test('should return empty array for non-existent channel', () => {
            const messages = getMessages('non-existent');
            expect(messages).toEqual([]);
        });

        test('should return all messages for existing channel', () => {
            addMessage('test-channel', 'user', 'Message 1');
            addMessage('test-channel', 'assistant', 'Message 2');

            const messages = getMessages('test-channel');
            expect(messages).toHaveLength(2);
            expect(messages[0].content).toBe('Message 1');
            expect(messages[1].content).toBe('Message 2');
        });
    });

    describe('clearMessages', () => {
        test('should clear all messages from channel', () => {
            addMessage('test-channel', 'user', 'Message 1');
            addMessage('test-channel', 'assistant', 'Message 2');

            clearMessages('test-channel');

            const messages = getMessages('test-channel');
            expect(messages).toEqual([]);
        });

        test('should not affect other channels', () => {
            addMessage('channel-1', 'user', 'Message 1');
            addMessage('channel-2', 'user', 'Message 2');

            clearMessages('channel-1');

            expect(getMessages('channel-1')).toEqual([]);
            expect(getMessages('channel-2')).toHaveLength(1);
        });
    });

    describe('getMemoryStats', () => {
        test('should return stats for all channels', () => {
            addMessage('channel-1', 'user', 'Message 1');
            addMessage('channel-2', 'user', 'Message 2');
            addMessage('channel-2', 'assistant', 'Response');

            const stats = getMemoryStats();

            expect(stats.totalChannels).toBe(2);
            expect(stats.totalMessages).toBe(3);
            expect(stats.maxMessagesPerChannel).toBeGreaterThan(0);
        });

        test('should return empty stats when no channels', () => {
            const stats = getMemoryStats();

            expect(stats.totalChannels).toBe(0);
            expect(stats.totalMessages).toBe(0);
        });
    });
});
