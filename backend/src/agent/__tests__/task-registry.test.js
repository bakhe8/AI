/**
 * Task Registry Tests
 */

import taskRegistry, { TaskRegistry } from '../tasks/task-registry.js';
import { EchoTask } from '../tasks/implementations/echo-task.js';

describe('TaskRegistry', () => {
    let registry;

    beforeEach(() => {
        registry = new TaskRegistry();
    });

    describe('register', () => {
        test('should register a valid task', () => {
            const task = new EchoTask();
            expect(() => registry.register(task.toConfig())).not.toThrow();
            expect(registry.has('echo-test')).toBe(true);
        });

        test('should reject duplicate task IDs', () => {
            const task = new EchoTask();
            registry.register(task.toConfig());

            expect(() => registry.register(task.toConfig())).toThrow(/already registered/);
        });

        test('should reject invalid task', () => {
            const invalidTask = {
                id: 'test',
                // missing required fields
            };

            expect(() => registry.register(invalidTask)).toThrow();
        });
    });

    describe('get', () => {
        test('should retrieve registered task', () => {
            const task = new EchoTask();
            registry.register(task.toConfig());

            const retrieved = registry.get('echo-test');
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe('echo-test');
        });

        test('should return null for non-existent task', () => {
            const retrieved = registry.get('non-existent');
            expect(retrieved).toBeNull();
        });
    });

    describe('list', () => {
        test('should list all registered tasks', () => {
            const task = new EchoTask();
            registry.register(task.toConfig());

            const list = registry.list();
            expect(list).toHaveLength(1);
            expect(list[0].id).toBe('echo-test');
        });

        test('should return empty array when no tasks', () => {
            const list = registry.list();
            expect(list).toEqual([]);
        });
    });

    describe('unregister', () => {
        test('should remove a task', () => {
            const task = new EchoTask();
            registry.register(task.toConfig());

            expect(registry.has('echo-test')).toBe(true);
            registry.unregister('echo-test');
            expect(registry.has('echo-test')).toBe(false);
        });
    });
});
