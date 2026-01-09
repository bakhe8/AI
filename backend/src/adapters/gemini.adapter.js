import { ApiError } from "../core/error-handler.js";

// Gemini API configuration
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 30000;

export const geminiAdapter = {
    async send(messages) {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

        if (!apiKey) {
            throw new ApiError("GEMINI_API_KEY not configured in .env", 503);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            // Convert Kernel messages to Gemini format
            const contents = messages
                .filter((message) => message && typeof message.content === "string")
                .map((message) => ({
                    role: message.role === "assistant" ? "model" : "user",
                    parts: [{ text: message.content }]
                }));

            if (contents.length === 0) {
                throw new ApiError("Invalid message history", 400);
            }

            const payload = { contents };

            // Use x-goog-api-key header instead of query parameter
            const response = await fetch(`${API_URL}/${model}:generateContent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new ApiError(`Gemini API Error: ${response.status} - ${errorText}`, response.status || 502);
            }

            const data = await response.json();

            // Extract text from response
            // Response structure: candidates[0].content.parts[0].text
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new ApiError("Invalid response structure from Gemini API", 502);
            }

            return {
                role: "assistant",
                content: text
            };

        } catch (error) {
            console.error("Gemini Adapter Error:", error);
            if (error.name === "AbortError") {
                throw new ApiError("Gemini request timed out", 504);
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(error.message || "Gemini request failed", 502);
        } finally {
            clearTimeout(timeoutId);
        }
    }
};
