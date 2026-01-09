const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_CHANNEL_ID_LENGTH = 100;
const CHANNEL_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const ALLOWED_MODELS = ["openai", "gemini", "deepseek", "copilot", "claude", "mock"];
const ALLOWED_ROLES = ["user", "assistant"];

export function validateContract(body) {
    if (!body || typeof body !== "object") {
        throw new Error("Invalid payload");
    }

    // channel_id checks
    if (typeof body.channel_id !== "string" || body.channel_id.trim().length === 0) {
        throw new Error("channel_id must be a non-empty string");
    }
    if (body.channel_id.length > MAX_CHANNEL_ID_LENGTH) {
        throw new Error("channel_id too long");
    }
    if (!CHANNEL_ID_PATTERN.test(body.channel_id)) {
        throw new Error("channel_id contains invalid characters");
    }

    // model checks
    if (typeof body.model !== "string" || body.model.trim().length === 0) {
        throw new Error("model must be a non-empty string");
    }
    if (!ALLOWED_MODELS.includes(body.model)) {
        throw new Error(`Invalid model. Allowed: ${ALLOWED_MODELS.join(", ")}`);
    }

    // messages checks
    if (!Array.isArray(body.messages)) {
        throw new Error("messages must be an array");
    }
    if (body.messages.length === 0) {
        throw new Error("messages must contain at least one message");
    }
    if (body.messages.length > MAX_MESSAGES) {
        throw new Error("messages limit exceeded");
    }

    // Validate each message
    for (const message of body.messages) {
        if (!message || typeof message !== "object") {
            throw new Error("Each message must be an object with role and content");
        }
        if (!ALLOWED_ROLES.includes(message.role)) {
            throw new Error(`Invalid message role. Allowed: ${ALLOWED_ROLES.join(", ")}`);
        }
        if (typeof message.content !== "string" || message.content.length === 0) {
            throw new Error("Each message must have role and content");
        }
        if (message.content.length > MAX_MESSAGE_LENGTH) {
            throw new Error("Message content too long");
        }
    }

    // Require last message to be from user to avoid injecting assistant/system content
    const lastMessage = body.messages[body.messages.length - 1];
    if (lastMessage.role !== "user") {
        throw new Error("Last message must be from user");
    }
}
