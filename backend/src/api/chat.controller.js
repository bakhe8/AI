import { validateContract } from "../core/contract.js";
import { routeMessage } from "../core/router.js";
import { addMessage, getMessages } from "../core/memory.js";
import logger from "../core/logger.js";

export async function chatHandler(req, res) {
    try {
        validateContract(req.body);

        const { channel_id, model, messages } = req.body;
        logger.info(`Chat request: channel=${channel_id}, model=${model}`);

        // Save user message
        const userMessage = messages[messages.length - 1];
        addMessage(channel_id, userMessage.role, userMessage.content);

        // Get AI reply
        const startTime = Date.now();
        const reply = await routeMessage(model, messages);
        const duration = Date.now() - startTime;

        logger.info(`${model} responded in ${duration}ms`);

        // Save assistant reply
        addMessage(channel_id, reply.role, reply.content);

        res.json({
            channel_id,
            model,
            reply
        });
    } catch (e) {
        logger.error(`Chat handler error: ${e.message}`);
        res.status(400).json({ error: e.message });
    }
}

export function getMessagesHandler(req, res) {
    const channelId = req.params.channelId;
    const messages = getMessages(channelId);
    res.json({ channel_id: channelId, messages });
}