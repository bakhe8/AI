import OpenAI from "openai";

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
        
        if (!deepseek) {
            return {
                role: "assistant",
                content: "Error: DEEPSEEK_API_KEY not configured in .env"
            };
        }

        try {
            const completion = await deepseek.chat.completions.create({
                messages: messages,
                model: "deepseek-chat",
            });

            return {
                role: "assistant",
                content: completion.choices[0].message.content
            };
        } catch (error) {
            console.error("DeepSeek Adapter Error:", error);
            return {
                role: "assistant",
                content: "Error: " + (error.message || "Failed to connect to DeepSeek")
            };
        }
    }
};
