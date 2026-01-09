import OpenAI from "openai";
import { ApiError } from "../core/error-handler.js";

let client = null;
const REQUEST_TIMEOUT_MS = 30000;

function getClient() {
    if (!client && process.env.OPENAI_API_KEY) {
        client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: REQUEST_TIMEOUT_MS,
            maxRetries: 2
        });
    }
    return client;
}

export const openAIAdapter = {
    async send(messages) {
        const openai = getClient();
        const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

        if (!openai) {
            throw new ApiError("OPENAI_API_KEY not configured in .env", 503);
        }

        try {
            const completion = await openai.chat.completions.create({
                model: model,
                messages: messages,
                timeout: REQUEST_TIMEOUT_MS
            });

            const content = completion?.choices?.[0]?.message?.content;
            if (!content) {
                throw new ApiError("Empty response from OpenAI", 502);
            }

            return {
                role: "assistant",
                content
            };
        } catch (error) {
            console.error("OpenAI Adapter Error:", error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(error.message || "OpenAI request failed", 502);
        }
    }
};
