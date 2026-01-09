import OpenAI from "openai";
import { formatAdapterError } from "../core/error-handler.js";

let client = null;

function getClient() {
    if (!client && process.env.DEEPSEEK_API_KEY) {
        client = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: process.env.DEEPSEEK_API_KEY
        });
    }
    return client;
}

export const deepseekAdapter = {
    async send(messages) {
        const deepseek = getClient();
        const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

        if (!deepseek) {
            return formatAdapterError(new Error("DEEPSEEK_API_KEY not configured in .env"));
        }

        try {
            const completion = await deepseek.chat.completions.create({
                messages: messages,
                model: model,
            });

            return {
                role: "assistant",
                content: completion.choices[0].message.content
            };
        } catch (error) {
            console.error("DeepSeek Adapter Error:", error);
            return formatAdapterError(error);
        }
    }
};
