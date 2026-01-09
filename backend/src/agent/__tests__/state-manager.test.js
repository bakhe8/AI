/**
 * State Manager Tests
 */

import stateManager, { AgentStateManager } from '../core/state-manager.js';

describe('AgentStateManager', () => {
    let manager;

    beforeEach(() => {
        manager = new AgentStateManager();
    });

    describe('createTask', () => {
        test('should create a new task state', () => {
            const config = {
                taskType: 'echo-test',
                facets: ['general'],
                models: ['mock'],
                rounds: 1
            };

            const state = manager.createTask('task-1', config);

            expect(state.taskId).toBe('task-1');
            expect(state.status).toBe('initializing');
            expect(state.progress.total).toBeGreaterThan(0);
            expect(state.stats.apiCalls).toBe(0);
        });
    });

    describe('getTask', () => {
        test('should retrieve task state', () => {
            manager.createTask('task-1', { facets: [], models: [], rounds: 1 });

            const state = manager.getTask('task-1');
            expect(state).toBeDefined();
            expect(state.taskId).toBe('task-1');
        });

        test('should return null for non-existent task', () => {
            const state = manager.getTask('non-existent');
            expect(state).toBeNull();
        });
    });

    describe('updateTask', () => {
        test('should update task state', () => {
            manager.createTask('task-1', { facets: [], models: [], rounds: 1 });

            manager.updateTask('task-1', { status: 'running' });

            const state = manager.getTask('task-1');
            expect(state.status).toBe('running');
        });

        test('should throw for non-existent task', () => {
            expect(() => {
                manager.updateTask('non-existent', { status: 'running' });
            }).toThrow();
        });
    });

    describe('updateProgress', () => {
        test('should update progress', () => {
            manager.createTask('task-1', { facets: [], models: [], rounds: 1 });

            manager.updateProgress('task-1', 'round1', 5);

            const state = manager.getTask('task-1');
            expect(state.progress.phase).toBe('round1');
            expect(state.progress.current).toBe(5);
        });
    });

    describe('incrementApiCalls', () => {
        test('should increment API call count', () => {
            manager.createTask('task-1', { facets: [], models: [], rounds: 1 });

            manager.incrementApiCalls('task-1');
            manager.incrementApiCalls('task-1', 2);

            const state = manager.getTask('task-1');
            expect(state.stats.apiCalls).toBe(3);
        });
    });

    describe('completeTask', () => {
        test('should mark task as complete', () => {
            manager.createTask('task-1', { facets: [], models: [], rounds: 1 });

            const state = manager.completeTask('task-1');

            expect(state).toBeDefined();
            expect(state.status).toBe('complete');
            expect(state.stats.endTime).toBeDefined();
            expect(state.stats.duration).toBeGreaterThanOrEqual(0);  // Can be 0 if very fast
            expect(state.progress.current).toBe(state.progress.total);
        });

        test('should return null for non-existent task', () => {
            const state = manager.completeTask('non-existent');
            expect(state).toBeNull();
        });
    });

    describe('failTask', () => {
        test('should mark task as failed', () => {
            manager.createTask('task-1', { facets: [], models: [], rounds: 1 });

            const error = new Error('Test error');
            manager.failTask('task-1', error, 'round1');

            const state = manager.getTask('task-1');
            expect(state.status).toBe('error');
            expect(state.errors).toHaveLength(1);
            expect(state.errors[0].message).toBe('Test error');
            expect(state.errors[0].phase).toBe('round1');
        });
    });

    describe('listTasks', () => {
        test('should list all tasks', () => {
            manager.createTask('task-1', { facets: [], models: [], rounds: 1 });
            manager.createTask('task-2', { facets: [], models: [], rounds: 1 });

            const list = manager.listTasks();
            expect(list).toHaveLength(2);
        });
    });
});
