export async function healthCheck() {
    const models = ["openai", "gemini", "deepseek", "copilot"];
    const status = {};
    const env = process.env;

    // Quick check based on environment variables only
    status.openai = {
        available: true,
        configured: !!env.OPENAI_API_KEY,
        message: env.OPENAI_API_KEY ? "Ready" : "API key not configured"
    };

    status.gemini = {
        available: true,
        configured: !!env.GEMINI_API_KEY,
        message: env.GEMINI_API_KEY ? "Ready" : "API key not configured"
    };

    status.deepseek = {
        available: true,
        configured: !!env.DEEPSEEK_API_KEY,
        message: env.DEEPSEEK_API_KEY ? "Ready" : "API key not configured"
    };

    status.copilot = {
        available: true,
        configured: !!env.GITHUB_TOKEN,
        message: env.GITHUB_TOKEN ? "Ready" : "API key not configured"
    };

    return status;
}
