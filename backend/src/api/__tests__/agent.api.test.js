import { jest } from "@jest/globals";
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { listAgentTasks, executeAgentTask, getAgentStatus, getAgentResults } from '../agent.controller.js';
import agentService from '../../agent/service.js';

// Mock the Agent Service (Default Export)
jest.mock('../../agent/service.js', () => ({
    listTasks: jest.fn(),
    executeTask: jest.fn(),
    getStatus: jest.fn(),
    getResults: jest.fn()
}));

const app = express();
app.use(bodyParser.json());
app.get('/agent/tasks', listAgentTasks);
app.post('/agent/execute', executeAgentTask);
app.get('/agent/status/:executionId', getAgentStatus);
app.get('/agent/results/:executionId', getAgentResults);

describe('Agent API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /agent/tasks', () => {
        it('should return a list of available tasks', async () => {
            const mockTasks = [
                { id: 'js-code-audit', name: 'JS Code Audit', inputType: 'code' },
                { id: 'security-scan', name: 'Security Scan', inputType: 'code' }
            ];
            agentService.listTasks.mockReturnValue(mockTasks);

            const response = await request(app).get('/agent/tasks');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockTasks);
        });
    });

    describe('POST /agent/execute', () => {
        it('should start task execution and return 202', async () => {
            const mockExecutionId = 'exec-123';
            agentService.executeTask.mockReturnValue({ executionId: mockExecutionId, status: 'running' });

            const response = await request(app)
                .post('/agent/execute')
                .send({
                    taskId: 'js-code-audit',
                    // Correct input structure expected by controller
                    input: {
                        type: 'code',
                        content: 'console.log("test");'
                    }
                });

            expect(response.status).toBe(202);
            expect(response.body).toEqual({
                executionId: mockExecutionId,
                status: 'running'
            });
            expect(agentService.executeTask).toHaveBeenCalledWith('js-code-audit', 'console.log("test");');
        });

        it('should return 400 if input is invalid', async () => {
            const response = await request(app)
                .post('/agent/execute')
                .send({
                    taskId: 'js-code-audit',
                    input: 'invalid-string-input' // Invalid structure
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /agent/status/:executionId', () => {
        it('should return execution status', async () => {
            const mockStatus = { status: 'running', progress: 50 };
            agentService.getStatus.mockReturnValue(mockStatus);

            const response = await request(app).get('/agent/status/exec-123');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockStatus);
        });

        it('should return 404 if execution not found', async () => {
            agentService.getStatus.mockReturnValue(null);

            const response = await request(app).get('/agent/status/exec-unknown');

            expect(response.status).toBe(404);
        });
    });

    describe('GET /agent/results/:executionId', () => {
        it('should return final results when complete', async () => {
            const mockResults = { analysis: 'secure', rawReport: 'Report' };
            agentService.getResults.mockReturnValue(mockResults);

            const response = await request(app).get('/agent/results/exec-done');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockResults);
        });

        it('should return 404 if results not found', async () => {
            agentService.getResults.mockReturnValue(null);

            const response = await request(app).get('/agent/results/exec-unknown');

            expect(response.status).toBe(404);
        });
    });
});
