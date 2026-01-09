const MODEL_ENV = {
    openai: "OPENAI_API_KEY",
    gemini: "GEMINI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    copilot: "GITHUB_TOKEN",
    mock: null
};

const COOLDOWN_MS = 10_000;
const lastChecks = new Map();

// Test helper to clear cooldown cache between runs
export function resetReadinessCooldown() {
    lastChecks.clear();
}

export function checkReadiness(req, res) {
    const model = (req.body?.model || "").toLowerCase();
    const key = model || "all";
    const now = Date.now();
    const last = lastChecks.get(key) || 0;

    if (now - last < COOLDOWN_MS) {
        return res.json({
            status: "busy",
            reason: "temporary cooldown"
        });
    }
    lastChecks.set(key, now);

    // If a specific model requested
    if (model) {
        if (!MODEL_ENV[model]) {
            return res.json({
                status: "unavailable",
                reason: "model not available"
            });
        }
        const envVar = MODEL_ENV[model];
        if (envVar && !process.env[envVar]) {
            return res.json({
                status: "unavailable",
                reason: "model not configured"
            });
        }
        return res.json({ status: "ready" });
    }

    // No model specified: ready if at least one configured
    const anyConfigured = Object.entries(MODEL_ENV).some(([, env]) => !env || process.env[env]);
    if (anyConfigured) {
        return res.json({ status: "ready" });
    }

    return res.json({
        status: "unavailable",
        reason: "no model configured"
    });
}
