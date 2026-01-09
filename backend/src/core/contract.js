export function validateContract(body) {
    // Check required fields
    if (!body.channel_id) {
        throw new Error("Missing channel_id");
    }

    if (!body.model) {
        throw new Error("Missing model");
    }

    if (!body.messages) {
        throw new Error("Missing messages");
    }

    if (!Array.isArray(body.messages)) {
        throw new Error("messages must be an array");
    }

    if (body.messages.length === 0) {
        throw new Error("messages must contain at least one message");
    }

    // Validate each message
    for (const message of body.messages) {
        if (!message || typeof message.role !== "string" || typeof message.content !== "string") {
            throw new Error("Each message must have role and content");
        }
    }
}
