// Error Handler - Unified error handling across the project

/**
 * Custom Error Classes for better error handling
 */

export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

export class ApiError extends Error {
    constructor(message, statusCode = 502) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
    }
}

export class ServerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ServerError';
        this.statusCode = 500;
    }
}

/**
 * Format error response for adapters
 * @param {Error} error - The error object
 * @returns {Object} Formatted error response
 */
export function formatAdapterError(error) {
    let message = error.message || 'Unknown error occurred';
    
    // Clean up common error patterns
    if (message.includes('not configured')) {
        message = `⚠️ API key not configured`;
    } else if (message.includes('API')) {
        message = `⚠️ API Error: ${message}`;
    } else {
        message = `⚠️ Error: ${message}`;
    }

    return {
        role: 'assistant',
        content: message
    };
}

/**
 * Express error handling middleware
 */
export function errorMiddleware(err, req, res, next) {
    console.error(`[Error] ${err.name}: ${err.message}`);
    
    const statusCode = err.statusCode || 500;
    const response = {
        error: err.message || 'Internal server error'
    };

    res.status(statusCode).json(response);
}
