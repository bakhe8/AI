import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { chatHandler, getMessagesHandler } from "./api/chat.controller.js";
import { healthCheck } from "./core/health.js";
import { errorMiddleware } from "./core/error-handler.js";
import { validateEnvironment } from "./core/env-validator.js";
import { getMemoryStats } from "./core/memory.js";
import logger from "./core/logger.js";

// Validate environment variables on startup
validateEnvironment();

const app = express();

// CORS Policy - allow localhost only
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(express.static("../frontend"));

// Set UTF-8 encoding for all responses
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// Log all requests
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

app.post("/api/chat", chatHandler);
app.get("/api/messages/:channelId", getMessagesHandler);

app.get("/api/health", async (req, res) => {
    try {
        const status = await healthCheck();
        res.json(status);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Memory stats endpoint (for monitoring)
app.get("/api/memory-stats", (req, res) => {
    try {
        const stats = getMemoryStats();
        res.json(stats);
    } catch (error) {
        logger.error('Failed to get memory stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

const PORT = 3000;
app.listen(PORT, () => {
    logger.info(`AI Kernel running on http://localhost:${PORT}`);
    logger.info('Press Ctrl+C to stop');
});