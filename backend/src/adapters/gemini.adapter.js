import { formatAdapterError } from "../core/error-handler.js";

// Gemini API configuration
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export const geminiAdapter = {
    async send(messages) {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

        if (!apiKey) {
            return formatAdapterError(new Error("GEMINI_API_KEY not configured in .env"));
        }

        try {
            // Convert Kernel messages to Gemini format
            const contents = messages
                .filter((message) => message && typeof message.content === "string")
                .map((message) => ({
                    role: message.role === "assistant" ? "model" : "user",
                    parts: [{ text: message.content }]
                }));

            if (contents.length === 0) {
                throw new Error("Invalid message history");
            }

            const payload = { contents };

            // Use x-goog-api-key header instead of query parameter
            const response = await fetch(`${API_URL}/${model}:generateContent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Extract text from response
            // Response structure: candidates[0].content.parts[0].text
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error("Invalid response structure from Gemini API");
            }

            return {
                role: "assistant",
                content: text
            };

        } catch (error) {
            console.error("Gemini Adapter Error:", error);
            return formatAdapterError(error);
        }
    }
};
