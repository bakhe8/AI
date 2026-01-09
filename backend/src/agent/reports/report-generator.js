/**
 * Report Generator
 * Generates Raw Measurement Reports (Layer 1 - NO recommendations)
 * 
 * CRITICAL: This generates MEASUREMENTS ONLY
 * - NO severity judgments
 * - NO recommendations
 * - NO executive decisions
 * 
 * Just structured data about what was found
 */

export class ReportGenerator {
    /**
     * Generate raw measurement report
     * @param {string} taskId - Task identifier
     * @param {Object} taskConfig - Task configuration
     * @param {Array} round1Results - Round 1 responses
     * @param {Object} analysis - Analysis results
     * @returns {Object} Raw report
     */
    static generateRawReport(taskId, taskConfig, round1Results, analysis) {
        const report = {
            metadata: {
                taskId,
                taskName: taskConfig.name || taskId,
                timestamp: new Date().toISOString(),
                facets: taskConfig.facets,
                models: taskConfig.models
            },

            summary: {
                totalResponses: round1Results.length,
                successfulResponses: round1Results.filter(r => !r.error).length,
                failedResponses: round1Results.filter(r => r.error).length,
                patternsDetected: analysis.patterns.length,
                gapsIdentified: analysis.gaps.length,
                contradictions: analysis.contradictions.length
            },

            measurements: {
                patterns: analysis.patterns,
                gaps: analysis.gaps,
                contradictions: analysis.contradictions,
                coverage: analysis.coverage
            },

            raw_responses: this._formatRawResponses(round1Results),

            markdown: this._generateMarkdown(taskId, taskConfig, round1Results, analysis)
        };

        return report;
    }

    /**
     * Format raw responses for the report
     * @private
     */
    static _formatRawResponses(responses) {
        return responses.map(response => ({
            facet: response.facet,
            model: response.model,
            success: !response.error,
            contentLength: response.content ? response.content.length : 0,
            error: response.error || null
        }));
    }

    /**
     * Generate markdown report
     * @private
     */
    static _generateMarkdown(taskId, taskConfig, round1Results, analysis) {
        const lines = [];

        lines.push(`# Raw Measurement Report: ${taskConfig.name || taskId}`);
        lines.push('');
        lines.push(`**Generated:** ${new Date().toISOString()}`);
        lines.push(`**Type:** Layer 1 Analysis (Measurements Only)`);
        lines.push('');
        lines.push('---');
        lines.push('');

        // Summary
        lines.push('## Data Collection Summary');
        lines.push('');
        lines.push(`- **Models Queried:** ${taskConfig.models.length} (${taskConfig.models.join(', ')})`);
        lines.push(`- **Facets Analyzed:** ${taskConfig.facets.length} (${taskConfig.facets.join(', ')})`);
        lines.push(`- **Total Responses:** ${round1Results.length}`);
        lines.push(`- **Successful:** ${round1Results.filter(r => !r.error).length}`);
        lines.push(`- **Failed:** ${round1Results.filter(r => r.error).length}`);
        lines.push('');

        // Pattern Measurements
        if (analysis.patterns.length > 0) {
            lines.push('## Pattern Measurements (Frequency Count)');
            lines.push('');
            lines.push('Patterns = topics mentioned by multiple models');
            lines.push('');

            analysis.patterns.forEach((pattern, i) => {
                lines.push(`### ${i + 1}. "${pattern.text}"`);
                lines.push(`- **Mentioned by:** ${pattern.models.join(', ')}`);
                lines.push(`- **Frequency:** ${pattern.frequency} models`);
                lines.push(`- **Facets:** ${pattern.facets.join(', ')}`);
                lines.push(`- **Total mentions:** ${pattern.count}`);
                lines.push('');
            });
        } else {
            lines.push('## Pattern Measurements');
            lines.push('');
            lines.push('No patterns detected (no topics mentioned by 2+ models)');
            lines.push('');
        }

        // Gap Measurements
        if (analysis.gaps.length > 0) {
            lines.push('## Gap Measurements');
            lines.push('');
            lines.push('Gaps = topics some models mentioned but others did not');
            lines.push('');

            const byFacet = {};
            analysis.gaps.forEach(gap => {
                if (!byFacet[gap.facet]) byFacet[gap.facet] = [];
                byFacet[gap.facet].push(gap);
            });

            for (const [facet, gaps] of Object.entries(byFacet)) {
                lines.push(`### ${facet} facet`);
                lines.push('');

                gaps.forEach(gap => {
                    lines.push(`**Topic:** "${gap.topic}"`);
                    lines.push(`- Mentioned by: ${gap.mentionedBy.join(', ')}`);
                    lines.push(`- **Gap:** Not mentioned by ${gap.missedBy.join(', ')}`);
                    lines.push('');
                });
            }
        } else {
            lines.push('## Gap Measurements');
            lines.push('');
            lines.push('No gaps detected (all models mentioned similar topics)');
            lines.push('');
        }

        // Contradictions
        if (analysis.contradictions.length > 0) {
            lines.push('## Contradiction Measurements');
            lines.push('');

            analysis.contradictions.forEach((contradiction, i) => {
                lines.push(`### ${i + 1}. ${contradiction.facet} facet`);
                lines.push(`- **Type:** ${contradiction.type}`);
                lines.push(`- **Group A:** ${contradiction.modelsA.join(', ')}`);
                lines.push(`- **Group B:** ${contradiction.modelsB.join(', ')}`);
                lines.push('');
            });
        } else {
            lines.push('## Contradiction Measurements');
            lines.push('');
            lines.push('No contradictions detected');
            lines.push('');
        }

        // Coverage
        lines.push('## Coverage Metrics');
        lines.push('');
        for (const [facet, coverage] of Object.entries(analysis.coverage)) {
            lines.push(`### ${facet}`);
            lines.push(`- Total queries: ${coverage.total}`);
            lines.push(`- Successful: ${coverage.successful}`);
            lines.push(`- Failures: ${coverage.failed}`);  // Changed from 'Failed' to 'Failures'
            lines.push(`- Success rate: ${coverage.percentage}%`);
            lines.push('');
        }

        lines.push('---');
        lines.push('');
        lines.push('**Note:** This is a Layer 1 report (measurements only).');
        lines.push('No recommendations or severity judgments are included.');

        return lines.join('\n');
    }
}
