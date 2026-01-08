import OpenAI from "openai";

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
        
        if (!copilot) {
            return {
                role: "assistant",
                content: "Error: GITHUB_TOKEN not configured in .env"
            };
        }

        try {
            const completion = await copilot.chat.completions.create({
                messages: messages,
                model: "gpt-4o", // Standard GitHub Model
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
            return {
                role: "assistant",
                content: "Error: " + (error.message || "Failed to connect to GitHub Models")
            };
        }
    }
};
