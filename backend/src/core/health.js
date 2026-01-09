import { getAdapter } from "../adapters/registry.js";

const MODELS = ["openai", "gemini", "deepseek", "copilot"];
const ENV_MAP = {
    openai: "OPENAI_API_KEY",
    gemini: "GEMINI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    copilot: "GITHUB_TOKEN"
};

export async function healthCheck(deep = false) {
    const status = {};
    const env = process.env;

    for (const model of MODELS) {
        const envVar = ENV_MAP[model];
        const configured = !!env[envVar];

        // Shallow check (existing behavior)
        status[model] = {
            status: configured ? "available" : "unavailable"
        };

        // Deep check (optional, may hit external APIs)
        if (deep && configured) {
            const start = Date.now();
            try {
                const adapter = getAdapter(model);
                const reply = await adapter.send([{ role: "user", content: "ping" }]);
                const latency = Date.now() - start;

                if (reply && typeof reply.content === "string") {
                    status[model] = {
                        status: "available",
                        latencyMs: latency
                    };
                } else {
                    status[model] = {
                        status: "degraded",
                        error: "Invalid reply structure"
                    };
                }
            } catch (err) {
                status[model] = {
                    status: "unavailable",
                    error: err.message
                };
            }
        }
    }

    return {
        status: "ok",
        adapters: status
    };
}
