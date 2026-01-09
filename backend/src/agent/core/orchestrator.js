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
    async executeTask(taskId, input, executionIdOverride) {
        const task = taskRegistry.get(taskId);

        if (!task) {
            throw new Error(`Task '${taskId}' not found in registry`);
        }

        const executionId = executionIdOverride || `exec-${taskId}-${Date.now()}`;

        try {
            // Initialize state
            const state = stateManager.createTask(executionId, {
                taskType: taskId,
                facets: task.facets,
                models: task.models,
                rounds: task.rounds
            });
            stateManager.updateTask(executionId, { status: 'running' });

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

            // Check if Round 2 is needed and enabled
            if (task.rounds >= 2 && this.shouldRunRound2(analysis)) {
                stateManager.updateProgress(executionId, 'round2', 0);
                const round2Results = await this.executeRound2(executionId, task, input, round1Results, analysis);
                state.results.round2 = round2Results;
            }

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

    /**
     * Check if Round 2 should be executed based on analysis
     * @param {Object} analysis - Round 1 analysis
     * @returns {boolean} True if Round 2 should run
     */
    shouldRunRound2(analysis) {
        // Run Round 2 if we have significant gaps or contradictions
        const hasGaps = analysis.gaps && analysis.gaps.length > 0;
        const hasContradictions = analysis.contradictions && analysis.contradictions.length > 0;
        const hasLowCoverage = analysis.coverage && analysis.coverage.overall < 0.7;

        return hasGaps || hasContradictions || hasLowCoverage;
    }

    /**
     * Execute Round 2: Deep dive based on Round 1 findings
     * @param {string} executionId - Execution identifier
     * @param {Object} task - Task configuration
     * @param {any} input - Original task input
     * @param {Array} round1Results - Results from Round 1
     * @param {Object} analysis - Analysis from Round 1
     * @returns {Promise<Array>} Round 2 results
     */
    async executeRound2(executionId, task, input, round1Results, analysis) {
        const results = [];
        let stepCount = 0;

        // Focus on facets with gaps or contradictions
        const targetFacets = this.identifyRound2Targets(analysis);

        for (const facetId of targetFacets) {
            // Build targeted prompts for this facet based on gaps
            const agentPrompt = task.buildRound2Prompt(facetId, round1Results, analysis.gaps);

            // Query models again with targeted questions
            const facetResults = await this.kernelClient.sendParallel(
                task.models,
                agentPrompt,
                {
                    taskId: executionId,
                    facet: facetId,
                    round: 2
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
                    metadata: result.metadata,
                    targetedIssues: analysis.gaps.filter(g => g.facet === facetId)
                });
            });

            // Update progress
            stepCount += task.models.length;
            stateManager.updateProgress(executionId, 'round2', stepCount);
        }

        return results;
    }

    /**
     * Identify which facets need Round 2 investigation
     * @param {Object} analysis - Round 1 analysis
     * @returns {string[]} Facet IDs for Round 2
     */
    identifyRound2Targets(analysis) {
        const targets = new Set();

        // Add facets with gaps
        if (analysis.gaps) {
            analysis.gaps.forEach(gap => {
                if (gap.facet) targets.add(gap.facet);
            });
        }

        // Add facets with contradictions
        if (analysis.contradictions) {
            analysis.contradictions.forEach(contradiction => {
                if (contradiction.facet) targets.add(contradiction.facet);
            });
        }

        return Array.from(targets);
    }
}
