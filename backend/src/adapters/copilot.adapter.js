import OpenAI from "openai";
import { formatAdapterError } from "../core/error-handler.js";

let client = null;

function getClient() {
    if (!client && process.env.GITHUB_TOKEN) {
        client = new OpenAI({
            baseURL: 'https://models.inference.ai.azure.com',
            apiKey: process.env.GITHUB_TOKEN
        });
    }
    return client;
}

export const copilotAdapter = {
    async send(messages) {
        const copilot = getClient();
        const model = process.env.COPILOT_MODEL || "gpt-4o";

        if (!copilot) {
            return formatAdapterError(new Error("GITHUB_TOKEN not configured in .env"));
        }

        try {
            const completion = await copilot.chat.completions.create({
                messages: messages,
                model: model,
                temperature: 1.0,
                top_p: 1.0,
                max_tokens: 1000
            });

            return {
                role: "assistant",
                content: completion.choices[0].message.content
            };
        } catch (error) {
            console.error("Copilot Adapter Error:", error);
            return formatAdapterError(error);
        }
    }
};
