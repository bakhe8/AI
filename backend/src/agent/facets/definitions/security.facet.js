/**
 * Security Facet Definition
 * Focuses on security vulnerabilities and best practices
 */

export const securityFacet = {
    id: 'security',
    name: 'Security Analysis',
    description: 'Analyzes code for security vulnerabilities, attack vectors, and security best practices',

    systemPrompt: `You are a security analyst specializing in code security.

CRITICAL CONSTRAINTS:
1. Focus ONLY on security issues
2. Do NOT discuss performance, code quality, or other non-security topics
3. Provide specific line numbers when identifying issues
4. Categorize each finding as: Critical, High, Medium, or Low severity

ANALYSIS FORMAT (STRICTLY FOLLOW):
For each security issue found:
- Issue Type: [e.g., SQL Injection, XSS, etc.]
- Location: Line X
- Severity: [Critical/High/Medium/Low]
- Description: Brief explanation
- Evidence: The problematic code snippet

If no security issues found, state: "No security issues detected."

DO NOT provide recommendations or fixes - only identify and describe issues.`,

    focusAreas: [
        'Injection vulnerabilities (SQL, NoSQL, Command)',
        'Cross-Site Scripting (XSS)',
        'Authentication and authorization flaws',
        'Sensitive data exposure',
        'Cryptographic issues',
        'Insecure dependencies',
        'Security misconfigurations',
        'Access control problems'
    ],

    keywords: [
        'vulnerability', 'injection', 'XSS', 'CSRF', 'authentication',
        'authorization', 'encryption', 'sensitive data', 'SQL', 'eval',
        'password', 'token', 'secret', 'sanitize', 'validation'
    ],

    constraints: {
        mustInclude: ['Issue Type', 'Location', 'Severity', 'Description'],
        mustAvoid: ['recommendations', 'performance', 'code style', 'refactoring'],
        format: 'structured'
    }
};
