/**
 * Kernel Client - Bridge between Agent and AI Kernel
 * Converts Agent format to Kernel format and handles communication
 */

import { toKernelRequest, validateKernelResponse } from '../contracts/kernel-request.contract.js';

export class KernelClient {
    constructor(kernelBaseUrl = 'http://localhost:3000') {
        this.baseUrl = kernelBaseUrl;
    }

    /**
     * Send a request to the Kernel
     * @param {string} model - Model to use
     * @param {Object} agentPrompt - Agent prompt {system, user}
     * @param {Object} metadata - Metadata {taskId, facet, round}
     * @returns {Promise<{model: string, content: string, metadata: Object}>}
     * @throws {Error} If request fails
     */
    async send(model, agentPrompt, metadata) {
        // Convert to Kernel format
        const kernelRequest = toKernelRequest(agentPrompt, {
            ...metadata,
            model
        });

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(kernelRequest)
            });

            // Check HTTP status
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error || `HTTP ${response.status}`;
                throw new Error(`Kernel error: ${errorMsg} (status: ${response.status})`);
            }

            const data = await response.json();

            // Validate response shape
            validateKernelResponse(data);

            return {
                model,
                content: data.reply.content,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString(),
                    channelId: data.channel_id
                }
            };
        } catch (error) {
            // Re-throw with more context
            throw new Error(`${model} adapter failed: ${error.message}`);
        }
    }

    /**
     * Send parallel requests to multiple models
     * @param {string[]} models - Models to use
     * @param {Object} agentPrompt - Agent prompt
     * @param {Object} metadata - Metadata
     * @returns {Promise<Array>} Results (mix of success and errors)
     */
    async sendParallel(models, agentPrompt, metadata) {
        const promises = models.map(async (model) => {
            try {
                return await this.send(model, agentPrompt, metadata);
            } catch (error) {
                // Return error info instead of throwing
                // So other models can continue
                return {
                    model,
                    error: error.message,
                    metadata: {
                        ...metadata,
                        timestamp: new Date().toISOString()
                    }
                };
            }
        });

        return Promise.all(promises);
    }

    /**
     * Health check - test connection to Kernel
     * @returns {Promise<boolean>} True if Kernel is accessible
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}
