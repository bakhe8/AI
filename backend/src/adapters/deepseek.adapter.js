import OpenAI from "openai";
import { ApiError } from "../core/error-handler.js";

let client = null;
const REQUEST_TIMEOUT_MS = 30000;

function getClient() {
    if (!client && process.env.DEEPSEEK_API_KEY) {
        client = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: process.env.DEEPSEEK_API_KEY,
            timeout: REQUEST_TIMEOUT_MS,
            maxRetries: 2
        });
    }
    return client;
}

export const deepseekAdapter = {
    async send(messages) {
        const deepseek = getClient();
        const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

        if (!deepseek) {
            throw new ApiError("DEEPSEEK_API_KEY not configured in .env", 503);
        }

        try {
            const completion = await deepseek.chat.completions.create({
                messages: messages,
                model: model
            });

            const content = completion?.choices?.[0]?.message?.content;
            if (!content) {
                throw new ApiError("Empty response from DeepSeek", 502);
            }

            return {
                role: "assistant",
                content
            };
        } catch (error) {
            console.error("DeepSeek Adapter Error:", error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(error.message || "DeepSeek request failed", 502);
        }
    }
};
