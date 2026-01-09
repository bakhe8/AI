/**
 * Kernel Request Contract
 * Defines how Agent communicates with AI Kernel
 */

/**
 * @typedef {Object} KernelRequest
 * @property {string} channel_id - Unique channel identifier
 * @property {string} model - Model to use ('openai' | 'gemini' | 'deepseek' | 'copilot' | 'mock')
 * @property {Array<{role: string, content: string}>} messages - Conversation messages
 */

/**
 * @typedef {Object} AgentPrompt
 * @property {string} system - System message (instructions)
 * @property {string} user - User message (the actual prompt)
 */

/**
 * Convert Agent Prompt format to Kernel Request format
 * @param {AgentPrompt} agentPrompt - The agent's prompt
 * @param {Object} metadata - Additional metadata (taskId, facet, model, round)
 * @returns {KernelRequest} Kernel-compatible request
 */
export function toKernelRequest(agentPrompt, metadata) {
    const { taskId, facet, model, round } = metadata;

    // Generate unique channel ID for this Agent task execution
    const channelId = `agent-${taskId}-${facet}-${model}-r${round}`;

    return {
        channel_id: channelId,
        model: model,
        messages: [
            {
                role: 'user',
                content: agentPrompt.user
            }
        ]
    };
}

/**
 * @typedef {Object} KernelResponse
 * @property {string} channel_id - The channel ID
 * @property {string} model - The model used
 * @property {{role: string, content: string}} reply - The AI's reply
 */

/**
 * Validate Kernel Response
 * @param {any} response - Response from Kernel
 * @throws {Error} If response is invalid
 * @returns {boolean} True if valid
 */
export function validateKernelResponse(response) {
    if (!response || typeof response !== 'object') {
        throw new Error('Invalid response: must be an object');
    }

    if (!response.reply || typeof response.reply.content !== 'string') {
        throw new Error('Invalid response: missing reply.content');
    }

    return true;
}
