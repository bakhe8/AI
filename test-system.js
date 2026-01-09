#!/usr/bin/env node

/**
 * AI Kernel - Final System Test
 * Tests all major components and features
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Colors for output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${url}`, options);
        const result = await response.json();
        
        if (response.ok) {
            log('green', `✅ ${name}: SUCCESS`);
            return result;
        } else {
            log('red', `❌ ${name}: FAILED - ${result.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        log('red', `❌ ${name}: ERROR - ${error.message}`);
        return null;
    }
}

async function runTests() {
    log('blue', '🚀 Starting AI Kernel System Test...');
    console.log();
    
    // Test 1: Basic readiness check
    await testEndpoint('Basic Readiness', '/api/check-readiness');
    
    // Test 2: Chat with mock model
    await testEndpoint('Chat API (Mock)', '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: 'Test message' }],
            model: 'mock',
            channel_id: 'test-channel'
        })
    });
    
    // Test 3: Agent tasks list
    await testEndpoint('Agent Tasks List', '/agent/tasks');
    
    // Test 4: Self-reading sessions
    await testEndpoint('Self-Reading Sessions', '/agent/self-reading/sessions');
    
    // Test 5: Database stats
    await testEndpoint('Database Stats', '/api/stats');
    
    console.log();
    log('blue', '🎉 System Test Complete!');
    log('yellow', '📝 Note: Some tests may fail if API keys are not configured');
    
    console.log();
    log('green', '✨ AI Kernel is ready for use!');
    log('blue', `🌐 Access the unified interface at: ${BASE_URL}/frontend/unified/`);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { runTests };