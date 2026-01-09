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
import { createAdapterEventEmitter } from "./core/ws-bus.js";
import { WebSocketServer } from "ws";

// Simple auth for health endpoints (enforced when token is set)
function requireHealthAuth(req, res) {
    const expectedToken = process.env.HEALTH_TOKEN;
    if (!expectedToken) {
        res.status(401).json({ error: 'Unauthorized', code: 401, detail: 'HEALTH_TOKEN not configured' });
        return false;
    }
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (token !== expectedToken) {
        res.status(401).json({ error: 'Unauthorized', code: 401 });
        return false;
    }
    return true;
}

// Validate environment variables on startup
validateEnvironment();

const app = express();
const adapterEvents = createAdapterEventEmitter();

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
    if (!requireHealthAuth(req, res)) return;
    try {
        const deep = req.query.deep === 'true' || process.env.HEALTH_ACTIVE_CHECK === 'true';
        const status = await healthCheck(deep);
        res.json(status);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Memory stats endpoint (for monitoring)
app.get("/api/memory-stats", (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: "Forbidden" });
    }
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
const server = app.listen(PORT, () => {
    logger.info(`AI Kernel running on http://localhost:${PORT}`);
    logger.info('Press Ctrl+C to stop');
});

// WebSocket server for real-time replies
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
    logger.info("WebSocket client connected");

    const handler = (payload) => {
        try {
            ws.send(JSON.stringify({ type: "reply", data: payload }));
        } catch (err) {
            logger.warn(`Failed to send WS message: ${err.message}`);
        }
    };

    adapterEvents.on("reply", handler);

    ws.on("close", () => {
        adapterEvents.off("reply", handler);
        logger.info("WebSocket client disconnected");
    });
});
