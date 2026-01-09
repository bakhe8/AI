/**
 * Agent Orchestrator
 * The main coordinator that executes Agent tasks
 */

import { KernelClient } from './kernel-client.js';
import stateManager from './state-manager.js';
import taskRegistry from '../tasks/task-registry.js';
import facetLibrary from '../facets/facet-library.js';
import { PromptBuilder } from '../prompts/prompt-builder.js';
import { createRunningResponse, createCompleteResponse, createErrorResponse } from '../contracts/agent-response.contract.js';
import { ResponseAnalyzer } from '../analyzer/response-analyzer.js';
import { ReportGenerator } from '../reports/report-generator.js';

export class AgentOrchestrator {
    constructor(kernelBaseUrl = 'http://localhost:3000') {
        this.kernelClient = new KernelClient(kernelBaseUrl);
    }

    /**
     * Execute an Agent task
     * @param {string} taskId - Task identifier (from registry)
     * @param {any} input - Task input (e.g., code to analyze)
     * @returns {Promise<Object>} Agent response
     */
    async executeTask(taskId, input) {
        const task = taskRegistry.get(taskId);

        if (!task) {
            throw new Error(`Task '${taskId}' not found in registry`);
        }

        const executionId = `exec-${taskId}-${Date.now()}`;

        try {
            // Initialize state
            const state = stateManager.createTask(executionId, {
                taskType: taskId,
                facets: task.facets,
                models: task.models,
                rounds: task.rounds
            });

            stateManager.updateProgress(executionId, 'round1', 0);

            // Execute Round 1
            const round1Results = await this.executeRound1(executionId, task, input);

            // Store results
            state.results.round1 = round1Results;

            // ✅ NEW: Enhanced Analysis with Response Analyzer
            stateManager.updateProgress(executionId, 'analysis');
            const analysis = ResponseAnalyzer.analyzeRound1(round1Results);
            state.results.analysis = analysis;

            // ✅ NEW: Generate Report
            stateManager.updateProgress(executionId, 'reporting');
            const report = ReportGenerator.generateRawReport(
                taskId,
                task,
                round1Results,
                analysis
            );
            state.results.report = report;

            // Mark complete
            stateManager.completeTask(executionId);

            return createCompleteResponse(executionId, state.results, state.stats);

        } catch (error) {
            stateManager.failTask(executionId, error, 'execution');
            return createErrorResponse(executionId, error, 'execution');
        }
    }

    /**
     * Execute Round 1: Query all models for all facets
     * @param {string} executionId - Execution identifier
     * @param {Object} task - Task configuration
     * @param {any} input - Task input
     * @returns {Promise<Array>} Round 1 results
     */
    async executeRound1(executionId, task, input) {
        const results = [];
        let stepCount = 0;

        for (const facetId of task.facets) {
            // Build prompts for this facet
            const agentPrompt = task.buildRound1Prompt(facetId, input);

            // Query all models in parallel
            const facetResults = await this.kernelClient.sendParallel(
                task.models,
                agentPrompt,
                {
                    taskId: executionId,
                    facet: facetId,
                    round: 1
                }
            );

            // Increment API calls
            stateManager.incrementApiCalls(executionId, task.models.length);

            // Store results
            facetResults.forEach(result => {
                results.push({
                    facet: facetId,
                    model: result.model,
                    content: result.content,
                    error: result.error,
                    metadata: result.metadata
                });
            });

            // Update progress
            stepCount += task.models.length;
            stateManager.updateProgress(executionId, 'round1', stepCount);
        }

        return results;
    }

    /**
     * Basic analysis of Round 1 results (Layer 1 - measurement only)
     * @param {Array} round1Results - Results from Round 1
     * @returns {Object} Analysis (measurements only, no recommendations)
     */
    basicAnalysis(round1Results) {
        const analysis = {
            totalResponses: round1Results.length,
            successfulResponses: 0,
            failedResponses: 0,
            byFacet: {},
            byModel: {}
        };

        // Count successes/failures
        round1Results.forEach(result => {
            if (result.error) {
                analysis.failedResponses++;
            } else {
                analysis.successfulResponses++;
            }

            // Group by facet
            if (!analysis.byFacet[result.facet]) {
                analysis.byFacet[result.facet] = {
                    total: 0,
                    successful: 0,
                    failed: 0
                };
            }
            analysis.byFacet[result.facet].total++;
            if (result.error) {
                analysis.byFacet[result.facet].failed++;
            } else {
                analysis.byFacet[result.facet].successful++;
            }

            // Group by model
            if (!analysis.byModel[result.model]) {
                analysis.byModel[result.model] = {
                    total: 0,
                    successful: 0,
                    failed: 0
                };
            }
            analysis.byModel[result.model].total++;
            if (result.error) {
                analysis.byModel[result.model].failed++;
            } else {
                analysis.byModel[result.model].successful++;
            }
        });

        return analysis;
    }
}
