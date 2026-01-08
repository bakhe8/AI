export function validateContract(body) {
    if (!body.channel_id || !body.model || !Array.isArray(body.messages) || body.messages.length === 0) {
        throw new Error("Invalid contract");
    }

    for (const message of body.messages) {
        if (!message || typeof message.role !== "string" || typeof message.content !== "string") {
            throw new Error("Invalid contract");
        }
    }
}
