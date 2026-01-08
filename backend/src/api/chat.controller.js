import { validateContract } from "../core/contract.js";
import { routeMessage } from "../core/router.js";
import { addMessage, getMessages } from "../core/memory.js";

export async function chatHandler(req, res) {
    try {
        validateContract(req.body);
        
        // Save user message
        const userMessage = req.body.messages[req.body.messages.length - 1];
        addMessage(req.body.channel_id, userMessage.role, userMessage.content);
        
        // Get AI reply
        const reply = await routeMessage(req.body.model, req.body.messages);
        
        // Save assistant reply
        addMessage(req.body.channel_id, reply.role, reply.content);
        
        res.json({
            channel_id: req.body.channel_id,
            model: req.body.model,
            reply
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

export function getMessagesHandler(req, res) {
    const channelId = req.params.channelId;
    const messages = getMessages(channelId);
    res.json({ channel_id: channelId, messages });
}