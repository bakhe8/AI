import Anthropic from "@anthropic-ai/sdk";
import { ApiError } from "../core/error-handler.js";

let client = null;
const REQUEST_TIMEOUT_MS = 30000;

function getClient() {
    if (!client && process.env.ANTHROPIC_API_KEY) {
        client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
            timeout: REQUEST_TIMEOUT_MS,
            maxRetries: 2
        });
    }
    return client;
}

export const claudeAdapter = {
    async send(messages) {
        const claude = getClient();
        const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";

        if (!claude) {
            throw new ApiError("ANTHROPIC_API_KEY not configured in .env", 503);
        }

        try {
            // Claude requires separating system message from conversation
            const systemMessage = messages.find(m => m.role === 'system');
            const conversationMessages = messages.filter(m => m.role !== 'system');

            const completion = await claude.messages.create({
                model: model,
                max_tokens: 4096,
                system: systemMessage?.content,
                messages: conversationMessages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }))
            });

            const content = completion?.content?.[0]?.text;
            if (!content) {
                throw new ApiError("Empty response from Claude", 502);
            }

            return {
                role: "assistant",
                content
            };
        } catch (error) {
            console.error("Claude Adapter Error:", error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(error.message || "Claude request failed", 502);
        }
    }
};
