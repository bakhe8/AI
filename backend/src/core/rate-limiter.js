/**
 * Rate Limiting Middleware
 * Protects API endpoints from excessive use
 */

import logger from "./logger.js";

// Store request counts per IP/identifier
const requestCounts = new Map();
const REQUEST_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const MAX_REQUESTS_CHAT = 30; // 30 chat requests per minute
const MAX_REQUESTS_AGENT = 10; // 10 agent executions per minute

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
        if (now - data.resetTime > REQUEST_WINDOW_MS * 5) {
            requestCounts.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Get client identifier (IP or custom header)
 */
function getClientId(req) {
    // Check for custom identifier first (for authenticated users)
    const customId = req.headers['x-client-id'];
    if (customId) return `custom:${customId}`;
    
    // Fallback to IP address
    return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Check if request should be rate limited
 */
function shouldLimit(clientId, limit) {
    const now = Date.now();
    const clientData = requestCounts.get(clientId);
    
    if (!clientData || now - clientData.resetTime > REQUEST_WINDOW_MS) {
        // Reset window
        requestCounts.set(clientId, {
            count: 1,
            resetTime: now
        });
        return false;
    }
    
    if (clientData.count >= limit) {
        return true;
    }
    
    clientData.count++;
    return false;
}

/**
 * General rate limiter middleware
 */
export function rateLimiter(maxRequests = MAX_REQUESTS_PER_WINDOW) {
    return (req, res, next) => {
        const clientId = getClientId(req);
        
        if (shouldLimit(clientId, maxRequests)) {
            const clientData = requestCounts.get(clientId);
            const resetIn = Math.ceil((REQUEST_WINDOW_MS - (Date.now() - clientData.resetTime)) / 1000);
            
            logger.warn(`Rate limit exceeded for client: ${clientId}`);
            
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', resetIn);
            
            return res.status(429).json({
                error: 'Too many requests',
                code: 429,
                message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
                retryAfter: resetIn
            });
        }
        
        // Add rate limit headers
        const clientData = requestCounts.get(clientId);
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientData.count));
        
        next();
    };
}

/**
 * Chat-specific rate limiter
 */
export function chatRateLimiter() {
    return rateLimiter(MAX_REQUESTS_CHAT);
}

/**
 * Agent-specific rate limiter (stricter)
 */
export function agentRateLimiter() {
    return rateLimiter(MAX_REQUESTS_AGENT);
}

/**
 * Get current rate limit stats for a client
 */
export function getRateLimitStats(clientId) {
    const data = requestCounts.get(clientId);
    if (!data) {
        return {
            requests: 0,
            limit: MAX_REQUESTS_PER_WINDOW,
            remaining: MAX_REQUESTS_PER_WINDOW,
            resetIn: 0
        };
    }
    
    const now = Date.now();
    const resetIn = Math.ceil((REQUEST_WINDOW_MS - (now - data.resetTime)) / 1000);
    
    return {
        requests: data.count,
        limit: MAX_REQUESTS_PER_WINDOW,
        remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - data.count),
        resetIn: resetIn > 0 ? resetIn : 0
    };
}
