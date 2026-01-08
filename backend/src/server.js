import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { chatHandler, getMessagesHandler } from "./api/chat.controller.js";
import { healthCheck } from "./core/health.js";

const app = express();
app.use(bodyParser.json());
app.use(express.static("../frontend"));

// Set UTF-8 encoding for all responses
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

app.post("/api/chat", chatHandler);
app.get("/api/messages/:channelId", getMessagesHandler);

app.get("/api/health", async (req, res) => {
    try {
        const status = await healthCheck();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("AI Kernel running on :3000"));