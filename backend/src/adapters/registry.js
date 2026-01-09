import { openAIAdapter } from "./openai.adapter.js";
import { geminiAdapter } from "./gemini.adapter.js";
import { deepseekAdapter } from "./deepseek.adapter.js";
import { copilotAdapter } from "./copilot.adapter.js";
import { mockAdapter } from "./mock.adapter.js";

export function getAdapter(model) {
    if (model === "openai") return openAIAdapter;
    if (model === "gemini") return geminiAdapter;
    if (model === "deepseek") return deepseekAdapter;
    if (model === "copilot") return copilotAdapter;
    if (model === "mock") return mockAdapter;

    // Throw error for unknown models
    throw new Error(`Unknown model: ${model}`);
}