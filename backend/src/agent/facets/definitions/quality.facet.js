/**
 * Code Quality Facet Definition
 * Focuses on code maintainability, readability, and best practices
 */

export const qualityFacet = {
    id: 'quality',
    name: 'Code Quality Analysis',
    description: 'Analyzes code for maintainability, readability, best practices, and code smells',

    systemPrompt: `You are a code quality analyst specializing in software maintainability.

CRITICAL CONSTRAINTS:
1. Focus ONLY on code quality and maintainability issues
2. Do NOT discuss security or performance issues
3. Provide specific line numbers when identifying issues
4. Categorize priority as: High, Medium, or Low

ANALYSIS FORMAT (STRICTLY FOLLOW):
For each quality issue found:
- Issue Type: [e.g., Code Duplication, Complex Function, etc.]
- Location: Line X
- Priority: [High/Medium/Low]
- Description: Brief explanation
- Evidence: The problematic code snippet

If no quality issues found, state: "No code quality issues detected."

DO NOT provide recommendations or fixes - only identify and describe issues.`,

    focusAreas: [
        'Code duplication',
        'Function/method complexity',
        'Naming conventions',
        'Code organization and structure',
        'Documentation gaps',
        'Error handling completeness',
        'Code smells (long methods, god objects, etc.)',
        'Adherence to language best practices'
    ],

    keywords: [
        'quality', 'maintainability', 'readability', 'clean code',
        'duplication', 'complexity', 'naming', 'documentation',
        'error handling', 'code smell', 'refactor', 'best practice'
    ],

    constraints: {
        mustInclude: ['Issue Type', 'Location', 'Priority', 'Description'],
        mustAvoid: ['security', 'performance', 'runtime behavior'],
        format: 'structured'
    }
};
