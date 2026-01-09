import OpenAI from "openai";
import { ApiError } from "../core/error-handler.js";

let client = null;
const REQUEST_TIMEOUT_MS = 30000;

function getClient() {
    if (!client && process.env.GITHUB_TOKEN) {
        client = new OpenAI({
            baseURL: 'https://models.inference.ai.azure.com',
            apiKey: process.env.GITHUB_TOKEN,
            timeout: REQUEST_TIMEOUT_MS,
            maxRetries: 2
        });
    }
    return client;
}

export const copilotAdapter = {
    async send(messages) {
        const copilot = getClient();
        const model = process.env.COPILOT_MODEL || "gpt-4o";

        if (!copilot) {
            throw new ApiError("GITHUB_TOKEN not configured in .env", 503);
        }

        try {
            const completion = await copilot.chat.completions.create({
                messages: messages,
                model: model,
                temperature: 1.0,
                top_p: 1.0,
                max_tokens: 1000,
                timeout: REQUEST_TIMEOUT_MS
            });

            const content = completion?.choices?.[0]?.message?.content;
            if (!content) {
                throw new ApiError("Empty response from Copilot", 502);
            }

            return {
                role: "assistant",
                content
            };
        } catch (error) {
            console.error("Copilot Adapter Error:", error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(error.message || "Copilot request failed", 502);
        }
    }
};
