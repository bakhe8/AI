import OpenAI from "openai";
import { formatAdapterError } from "../core/error-handler.js";

let client = null;

function getClient() {
    if (!client && process.env.OPENAI_API_KEY) {
        client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return client;
}

export const openAIAdapter = {
    async send(messages) {
        const openai = getClient();
        const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

        if (!openai) {
            return formatAdapterError(new Error("OPENAI_API_KEY not configured in .env"));
        }

        try {
            const completion = await openai.chat.completions.create({
                model: model,
                messages: messages,
            });

            return {
                role: "assistant",
                content: completion.choices[0].message.content
            };
        } catch (error) {
            console.error("OpenAI Adapter Error:", error);
            return formatAdapterError(error);
        }
    }
};