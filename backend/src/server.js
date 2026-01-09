import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { chatHandler, getMessagesHandler } from "./api/chat.controller.js";
import { listAgentTasks, executeAgentTask, getAgentStatus, getAgentResults, getDatabaseStats, startAgentLoop, pauseAgentLoop, resumeAgentLoop, stopAgentLoop, getAgentLoopStatus } from "./api/agent.controller.js";
import { startSelfReading, getSelfReadingSession, listSelfReadingSessions, endSelfReadingSession } from "./api/self-reading.controller.js";
import { checkReadiness } from "./api/readiness.controller.js";
import { healthCheck } from "./core/health.js";
import { errorMiddleware } from "./core/error-handler.js";
import { validateEnvironment } from "./core/env-validator.js";
import { getMemoryStats } from "./core/memory.js";
import { rateLimiter, chatRateLimiter, agentRateLimiter } from "./core/rate-limiter.js";
import logger from "./core/logger.js";
import { createAdapterEventEmitter } from "./core/ws-bus.js";
import { WebSocketServer } from "ws";
import { startConsultation, getConsultationStatus, getConsultationTranscript, getConsultationConsensus } from "./consultation/controller.js";

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../../frontend");

const app = express();
const adapterEvents = createAdapterEventEmitter();

// CORS Policy - allow localhost only
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(express.static(publicDir));
app.use("/agent-ui", express.static(path.join(publicDir, "agent")));
app.use("/consult-ui", express.static(path.join(publicDir, "consultation")));
app.use("/unified", express.static(path.join(publicDir, "unified")));

// Route handlers for SPA routing
app.get('/unified', (req, res) => {
    res.sendFile(path.join(publicDir, 'unified', 'index.html'));
});

// Default route - redirect to unified interface  
app.get('/', (req, res) => {
    res.redirect('/unified');
});

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

// Apply rate limiting to all API routes
app.use("/api", rateLimiter());
app.use("/agent", rateLimiter());
app.use("/consult", rateLimiter());

app.post("/api/chat", chatRateLimiter(), chatHandler);
app.get("/api/messages/:channelId", getMessagesHandler);
app.get("/api/check-readiness", checkReadiness);

// Consultation (Layer 2 only)
app.post("/consult/start", startConsultation);
app.get("/consult/status/:id", getConsultationStatus);
app.get("/consult/transcript/:id", getConsultationTranscript);
app.get("/consult/consensus/:id", getConsultationConsensus);

// Agent endpoints
app.get("/agent/tasks", listAgentTasks);
app.post("/agent/execute", agentRateLimiter(), executeAgentTask);
app.get("/agent/status/:executionId", getAgentStatus);
app.get("/agent/results/:executionId", getAgentResults);

// Self-reading endpoints
app.post("/agent/self-reading/start", startSelfReading);
app.get("/agent/self-reading/session/:sessionId", getSelfReadingSession);
app.get("/agent/self-reading/sessions", listSelfReadingSessions);
app.post("/agent/self-reading/session/:sessionId/end", endSelfReadingSession);

// Database stats
app.get("/api/stats", getDatabaseStats);

// Agent Loop Control
app.post("/agent/loop/start", startAgentLoop);
app.post("/agent/loop/pause", pauseAgentLoop);
app.post("/agent/loop/resume", resumeAgentLoop);
app.post("/agent/loop/stop", stopAgentLoop);
app.get("/agent/loop/status", getAgentLoopStatus);

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
        return res.status(403).json({ error: "Forbidden", code: 403 });
    }
    // Protect if token is set
    if (process.env.HEALTH_TOKEN) {
        if (!requireHealthAuth(req, res)) return;
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

// Serve static files from frontend directory
app.use('/frontend', express.static(publicDir));

// Fallback route for index.html in frontend root
app.get('/frontend/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Route for unified interface
app.get('/frontend/unified/', (req, res) => {
    res.sendFile(path.join(publicDir, 'unified', 'index.html'));
});

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
