/**
 * Response Analyzer
 * Analyzes responses from multiple models (Layer 1 - Measurements Only)
 * 
 * CRITICAL: This is Layer 1 analysis - NO recommendations, NO judgments
 * We only MEASURE, DETECT, and COUNT
 */

export class ResponseAnalyzer {
    /**
     * Analyze Round 1 responses
     * @param {Array} responses - Array of model responses
     * @returns {Object} Analysis results (measurements only)
     */
    static analyzeRound1(responses) {
        const analysis = {
            patterns: this.detectPatterns(responses),
            gaps: this.findGaps(responses),
            contradictions: this.detectContradictions(responses),
            coverage: this.measureCoverage(responses)
        };

        return analysis;
    }

    /**
     * Detect patterns across model responses
     * Pattern = something mentioned by multiple models
     * @param {Array} responses - Model responses
     * @returns {Array} Detected patterns with frequency
     */
    static detectPatterns(responses) {
        const patterns = [];
        const mentionMap = new Map(); // keyword -> {models: Set, facets: Set, count}

        // Group responses by facet
        const byFacet = this._groupByFacet(responses);

        // For each facet, extract mentioned issues/topics
        for (const [facetId, facetResponses] of Object.entries(byFacet)) {
            facetResponses.forEach(response => {
                if (response.error) return;

                // Extract keywords/phrases (simple approach)
                const keywords = this._extractKeywords(response.content);

                keywords.forEach(keyword => {
                    if (!mentionMap.has(keyword)) {
                        mentionMap.set(keyword, {
                            models: new Set(),
                            facets: new Set(),
                            count: 0
                        });
                    }

                    const entry = mentionMap.get(keyword);
                    entry.models.add(response.model);
                    entry.facets.add(response.facet);
                    entry.count++;
                });
            });
        }

        // Convert to patterns (only items mentioned by 2+ models)
        for (const [keyword, data] of mentionMap.entries()) {
            if (data.models.size >= 2) {
                patterns.push({
                    text: keyword,
                    models: Array.from(data.models),
                    facets: Array.from(data.facets),
                    frequency: `${data.models.size}/${responses.filter(r => !r.error).length}`,
                    count: data.count
                });
            }
        }

        // Sort by frequency (most common first)
        patterns.sort((a, b) => b.models.length - a.models.length);

        return patterns;
    }

    /**
     * Find gaps - things some models mentioned but others didn't
     * @param {Array} responses - Model responses
     * @returns {Array} Identified gaps
     */
    static findGaps(responses) {
        const gaps = [];
        const byFacet = this._groupByFacet(responses);

        for (const [facetId, facetResponses] of Object.entries(byFacet)) {
            const successfulResponses = facetResponses.filter(r => !r.error);

            if (successfulResponses.length < 2) continue;

            // Find unique mentions per model
            const modelMentions = new Map();

            successfulResponses.forEach(response => {
                const keywords = this._extractKeywords(response.content);
                modelMentions.set(response.model, new Set(keywords));
            });

            // Find gaps (mentioned by some but not all)
            const allModels = Array.from(modelMentions.keys());
            const allKeywords = new Set();

            modelMentions.forEach(keywords => {
                keywords.forEach(k => allKeywords.add(k));
            });

            allKeywords.forEach(keyword => {
                const mentioningModels = allModels.filter(model =>
                    modelMentions.get(model).has(keyword)
                );

                const missingModels = allModels.filter(model =>
                    !modelMentions.get(model).has(keyword)
                );

                // Gap = mentioned by some but not all
                if (missingModels.length > 0 && mentioningModels.length > 0) {
                    gaps.push({
                        facet: facetId,
                        topic: keyword,
                        mentionedBy: mentioningModels,
                        missedBy: missingModels
                    });
                }
            });
        }

        return gaps;
    }

    /**
     * Detect contradictions between model responses
     * @param {Array} responses - Model responses
     * @returns {Array} Detected contradictions
     */
    static detectContradictions(responses) {
        // Simple implementation: just detect if one says "no issues" and others find issues
        const contradictions = [];
        const byFacet = this._groupByFacet(responses);

        for (const [facetId, facetResponses] of Object.entries(byFacet)) {
            const successful = facetResponses.filter(r => !r.error);

            if (successful.length < 2) continue;

            const noIssuesModels = [];
            const foundIssuesModels = [];

            successful.forEach(response => {
                const content = response.content.toLowerCase();
                if (content.includes('no') && (content.includes('issue') || content.includes('detected'))) {
                    noIssuesModels.push(response.model);
                } else if (content.length > 50) {
                    foundIssuesModels.push(response.model);
                }
            });

            // Contradiction if some say "no issues" while others found issues
            if (noIssuesModels.length > 0 && foundIssuesModels.length > 0) {
                contradictions.push({
                    facet: facetId,
                    type: 'no-issues-vs-issues',
                    modelsA: noIssuesModels,
                    modelsB: foundIssuesModels
                });
            }
        }

        return contradictions;
    }

    /**
     * Measure coverage across models
     * @param {Array} responses - Model responses
     * @returns {Object} Coverage metrics
     */
    static measureCoverage(responses) {
        const byFacet = this._groupByFacet(responses);
        const coverage = {};

        for (const [facetId, facetResponses] of Object.entries(byFacet)) {
            const total = facetResponses.length;
            const successful = facetResponses.filter(r => !r.error).length;

            coverage[facetId] = {
                total,
                successful,
                failed: total - successful,
                percentage: total > 0 ? Math.round((successful / total) * 100) : 0
            };
        }

        return coverage;
    }

    /**
     * Group responses by facet
     * @private
     */
    static _groupByFacet(responses) {
        const grouped = {};

        responses.forEach(response => {
            if (!grouped[response.facet]) {
                grouped[response.facet] = [];
            }
            grouped[response.facet].push(response);
        });

        return grouped;
    }

    /**
     * Extract keywords from response content
     * Simple implementation - look for common security/performance/quality terms
     * @private
     */
    static _extractKeywords(content) {
        const keywords = new Set();
        const lowerContent = content.toLowerCase();

        // Common issue patterns
        const patterns = [
            'sql injection', 'xss', 'csrf', 'authentication', 'authorization',
            'memory leak', 'performance', 'n+1', 'bottleneck', 'complexity',
            'code duplication', 'naming', 'error handling', 'documentation',
            'security', 'vulnerability', 'race condition', 'buffer overflow'
        ];

        patterns.forEach(pattern => {
            if (lowerContent.includes(pattern)) {
                keywords.add(pattern);
            }
        });

        return Array.from(keywords);
    }
}
