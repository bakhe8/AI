import { validateContract } from "../core/contract.js";
import { routeMessage } from "../core/router.js";
import { addMessage, getMessages } from "../core/memory.js";
import logger from "../core/logger.js";
import { ApiError, ValidationError } from "../core/error-handler.js";
import { getAdapterEventEmitter } from "../core/ws-bus.js";

export async function chatHandler(req, res) {
    try {
        try {
            validateContract(req.body);
        } catch (err) {
            throw new ValidationError(err.message);
        }

        const { channel_id, model, messages } = req.body;
        logger.info(`Chat request: channel=${channel_id}, model=${model}`);

        // Always take only the latest user message from the client
        const userMessage = messages[messages.length - 1];
        addMessage(channel_id, userMessage.role, userMessage.content);

        // Build authoritative history from server memory (ignore client-sent history)
        const history = getMessages(channel_id).map(({ role, content }) => ({ role, content }));

        const startTime = Date.now();
        const reply = await routeMessage(model, history);
        const duration = Date.now() - startTime;

        logger.info(`${model} responded in ${duration}ms`);

        // Validate adapter reply shape
        if (!reply || typeof reply.role !== "string" || typeof reply.content !== "string") {
            throw new ApiError("Invalid adapter reply", 502);
        }

        // Save assistant reply
        addMessage(channel_id, reply.role, reply.content);

        // Emit reply to websocket listeners (non-blocking)
        try {
            const emitter = getAdapterEventEmitter();
            emitter.emit("reply", {
                channel_id,
                model,
                reply
            });
        } catch (emitErr) {
            logger.warn(`WS emit failed: ${emitErr.message}`);
        }

        res.json({
            channel_id,
            model,
            reply
        });
    } catch (e) {
        const status = e.statusCode || (e instanceof ValidationError ? 400 : 500);
        logger.error(`Chat handler error: ${e.message}`);
        res.status(status).json({ error: e.message, code: status });
    }
}

export function getMessagesHandler(req, res) {
    const channelId = req.params.channelId;
    const messages = getMessages(channelId);
    res.json({ channel_id: channelId, messages });
}
