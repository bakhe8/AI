// Structured Logging with Winston

import winston from 'winston';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Define colors for each level (for console output)
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
};

winston.addColors(colors);

// Create format for logging
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    levels,
    format: logFormat,
    transports: [
        // Console output (for development)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            ),
            level: 'debug'
        }),
        // File output for errors
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // File output for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Export logger
export default logger;

// Helper functions for common log patterns
export const logRequest = (method, path, channelId, model) => {
    logger.info(`${method} ${path}`, {
        channelId,
        model,
        context: 'API Request'
    });
};

export const logError = (error, context = '') => {
    logger.error(`${context ? context + ': ' : ''}${error.message}`, {
        error: error.name,
        stack: error.stack,
        context
    });
};

export const logAdapterCall = (adapter, success, duration) => {
    logger.info(`Adapter call: ${adapter}`, {
        success,
        duration: `${duration}ms`,
        context: 'Adapter'
    });
};

export const logMemoryCleanup = (deletedCount) => {
    logger.info(`Memory cleanup: ${deletedCount} channels deleted`, {
        context: 'Memory Management'
    });
};
