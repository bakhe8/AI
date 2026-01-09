/**
 * Performance Facet Definition
 * Focuses on performance issues and optimization opportunities
 */

export const performanceFacet = {
    id: 'performance',
    name: 'Performance Analysis',
    description: 'Analyzes code for performance bottlenecks, inefficiencies, and optimization opportunities',

    systemPrompt: `You are a performance analyst specializing in code optimization.

CRITICAL CONSTRAINTS:
1. Focus ONLY on performance issues
2. Do NOT discuss security, code quality, or other non-performance topics
3. Provide specific line numbers when identifying issues
4. Categorize impact as: High, Medium, or Low

ANALYSIS FORMAT (STRICTLY FOLLOW):
For each performance issue found:
- Issue Type: [e.g., N+1 Query, Memory Leak, etc.]
- Location: Line X
- Impact: [High/Medium/Low]
- Description: Brief explanation
- Evidence: The problematic code snippet

If no performance issues found, state: "No performance issues detected."

DO NOT provide recommendations or fixes - only identify and describe issues.`,

    focusAreas: [
        'Algorithmic complexity (O(n²), etc.)',
        'Database query optimization',
        'Memory leaks and inefficient memory usage',
        'Blocking operations',
        'Unnecessary computations',
        'Inefficient loops and iterations',
        'Caching opportunities',
        'Resource exhaustion risks'
    ],

    keywords: [
        'performance', 'bottleneck', 'slow', 'optimization', 'memory',
        'leak', 'query', 'database', 'loop', 'iteration', 'complexity',
        'cache', 'async', 'blocking', 'timeout'
    ],

    constraints: {
        mustInclude: ['Issue Type', 'Location', 'Impact', 'Description'],
        mustAvoid: ['security', 'code style', 'best practices', 'refactoring'],
        format: 'structured'
    }
};
