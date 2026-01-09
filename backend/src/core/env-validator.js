// Environment Variables Validation

import logger from './logger.js';

// Required environment variables (app won't start without these)
const REQUIRED_VARS = [];

// Optional environment variables (will show warnings if missing)
const OPTIONAL_VARS = [
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'DEEPSEEK_API_KEY',
    'GITHUB_TOKEN',
    'HEALTH_TOKEN',
    'HEALTH_ACTIVE_CHECK'
];

// Model configuration variables (have defaults)
const MODEL_CONFIG_VARS = {
    'OPENAI_MODEL': 'gpt-3.5-turbo',
    'GEMINI_MODEL': 'gemini-2.0-flash',
    'DEEPSEEK_MODEL': 'deepseek-chat',
    'COPILOT_MODEL': 'gpt-4o'
};

/**
 * Validate environment variables
 * Returns true if all required vars are present
 * Warns about missing optional vars
 */
export function validateEnvironment() {
    let valid = true;
    const warnings = [];
    const info = [];

    console.log('\n========================================');
    console.log('Environment Variables Validation');
    console.log('========================================\n');

    // Check required variables
    for (const varName of REQUIRED_VARS) {
        if (!process.env[varName]) {
            logger.error(`Missing required environment variable: ${varName}`);
            valid = false;
        } else {
            logger.info(`✓ ${varName} is set`);
        }
    }

    // Check optional variables (API keys)
    const configuredAdapters = [];
    const unconfiguredAdapters = [];

    for (const varName of OPTIONAL_VARS) {
        if (!process.env[varName]) {
            const adapterName = varName.replace(/_API_KEY|_TOKEN/, '');
            unconfiguredAdapters.push(adapterName);
            warnings.push(`${varName} not configured - ${adapterName} adapter will be unavailable`);
        } else {
            const adapterName = varName.replace(/_API_KEY|_TOKEN/, '');
            configuredAdapters.push(adapterName);
            logger.info(`✓ ${varName} is configured`);
        }
    }

    // Check model configuration (show defaults if not set)
    console.log('\nModel Configuration:');
    for (const [varName, defaultValue] of Object.entries(MODEL_CONFIG_VARS)) {
        const value = process.env[varName] || defaultValue;
        const isDefault = !process.env[varName];
        logger.info(`  ${varName} = ${value}${isDefault ? ' (default)' : ''}`);
    }

    // Summary
    console.log('\n========================================');
    console.log('Summary');
    console.log('========================================\n');

    if (configuredAdapters.length > 0) {
        logger.info(`✓ Configured adapters: ${configuredAdapters.join(', ')}`);
    }

    if (unconfiguredAdapters.length > 0) {
        logger.warn(`⚠ Unconfigured adapters: ${unconfiguredAdapters.join(', ')}`);
        logger.warn(`  These adapters will return error messages when called`);
    }

    // Show warnings
    if (warnings.length > 0) {
        console.log('\nWarnings:');
        warnings.forEach(w => logger.warn(`  ⚠ ${w}`));
    }

    console.log('\n========================================\n');

    if (!valid) {
        logger.error('Environment validation failed - missing required variables');
        process.exit(1);
    }

    return {
        valid,
        configuredAdapters,
        unconfiguredAdapters,
        warnings
    };
}

/**
 * Get environment info for /api/health endpoint
 */
export function getEnvironmentInfo() {
    const info = {
        nodeVersion: process.version,
        env: process.env.NODE_ENV || 'development',
        adapters: {}
    };

    // Check which adapters are configured
    for (const varName of OPTIONAL_VARS) {
        const adapterName = varName.replace(/_API_KEY|_TOKEN/, '').toLowerCase();
        info.adapters[adapterName] = {
            configured: !!process.env[varName]
        };
    }

    return info;
}
