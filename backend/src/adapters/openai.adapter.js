import OpenAI from "openai";

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
        
        if (!openai) {
            return {
                role: "assistant",
                content: "Error: OPENAI_API_KEY not configured in .env"
            };
        }

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
            });

            return {
                role: "assistant",
                content: completion.choices[0].message.content
            };
        } catch (error) {
            console.error("OpenAI Adapter Error:", error);
            return {
                role: "assistant",
                content: "Error: " + (error.message || "Failed to connect to OpenAI")
            };
        }
    }
};