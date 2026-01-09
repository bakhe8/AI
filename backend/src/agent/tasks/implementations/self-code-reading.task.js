import sessionManager from '../../../core/session-manager.js';
import { BaseTask } from '../base-task.js';

/**
 * Self-Code Reading Task for AI Kernel
 * Allows the AI to read and analyze its own source code
 */
export class SelfCodeReadingTask extends BaseTask {
    constructor() {
        super({
            id: 'self-code-reading',
            name: 'Self-Code Reading',
            description: 'Read and analyze AI Kernel\'s own source code with self-modification protection',
            facets: ['analysis'],
            models: ['mock', 'openai']
        });
    }


    buildRound1Prompt(facet, input) {
        const { targetPath, analysisType = 'general' } = input;
        
        let prompt = `You are analyzing your own source code (AI Kernel). Perform a ${analysisType} analysis.\n\n`;
        
        if (targetPath) {
            prompt += `Focus on: ${targetPath}\n\n`;
        }
        
        prompt += `Analysis Type: ${analysisType}\n`;
        prompt += `Guidelines:\n`;
        prompt += `- Identify architectural patterns\n`;
        prompt += `- Review code quality and structure\n`;
        prompt += `- Note potential improvements\n`;
        prompt += `- Document key components and relationships\n`;
        
        if (analysisType === 'comprehensive') {
            prompt += `- Include test coverage analysis\n`;
            prompt += `- Review documentation completeness\n`;
        }
        
        return {
            system: `You are an AI code analyst examining your own source code (AI Kernel). Focus on the ${facet} facet of analysis.`,
            user: prompt
        };
    }

    async execute(input, executionId) {
        const { targetPath, sessionId, analysisType = 'general' } = input;
        
        console.log(`[SelfCodeReadingTask] Starting self-code analysis for ${executionId}`);
        
        try {
            // Get or create session for self-reading
            let session = sessionManager.getSession(sessionId);
            if (!session) {
                session = await sessionManager.startSession(
                    `self-reading-${executionId}`,
                    {
                        type: 'self-reading',
                        selfReadingEnabled: true,
                        includeTests: analysisType === 'comprehensive',
                        includeDocs: true
                    }
                );
            }

            // Perform self-reading
            const readResult = await sessionManager.performSelfReading(session.id, targetPath);
            
            // Prepare analysis based on type
            const analysis = await this.analyzeCode(readResult, analysisType);

            // Generate summary report
            const report = this.generateReport(readResult, analysis, analysisType);

            return {
                success: true,
                executionId,
                sessionId: session.id,
                targetPath,
                analysisType,
                summary: {
                    filesRead: readResult.readCount,
                    chunksProcessed: readResult.files.reduce((sum, f) => sum + f.chunks, 0),
                    totalLines: readResult.files.reduce((sum, f) => sum + f.data.reduce((lsum, chunk) => lsum + chunk.lines, 0), 0),
                    languages: [...new Set(readResult.files.flatMap(f => f.data.map(chunk => chunk.metadata.language)))]
                },
                analysis,
                report,
                rawData: readResult
            };

        } catch (error) {
            console.error(`[SelfCodeReadingTask] Error in ${executionId}:`, error);
            return {
                success: false,
                executionId,
                error: error.message,
                details: error.stack
            };
        }
    }

    /**
     * Analyze the read code based on analysis type
     */
    async analyzeCode(readResult, analysisType) {
        const analysis = {
            type: analysisType,
            timestamp: new Date().toISOString(),
            patterns: [],
            architecture: {},
            metrics: {},
            insights: []
        };

        // Basic pattern analysis
        for (const fileData of readResult.files) {
            const fileAnalysis = this.analyzeFile(fileData);
            analysis.patterns.push(...fileAnalysis.patterns);
        }

        // Architecture analysis
        analysis.architecture = this.analyzeArchitecture(readResult);

        // Code metrics
        analysis.metrics = this.calculateMetrics(readResult);

        // Generate insights based on analysis type
        analysis.insights = this.generateInsights(analysis, analysisType);

        return analysis;
    }

    /**
     * Analyze individual file
     */
    analyzeFile(fileData) {
        const patterns = [];
        const fileName = fileData.file;

        // Detect file purpose and patterns
        for (const chunk of fileData.data) {
            const content = chunk.content;
            
            // Function/class detection
            const functions = content.match(/(?:function\s+\w+|class\s+\w+|\w+\s*:\s*(?:async\s+)?function)/g) || [];
            const imports = content.match(/import\s+.+from\s+['"].+['"]/g) || [];
            const exports = content.match(/export\s+(?:default\s+|(?:async\s+)?function|\{|class)/g) || [];

            if (functions.length > 0) {
                patterns.push({
                    type: 'functions',
                    file: fileName,
                    count: functions.length,
                    examples: functions.slice(0, 3)
                });
            }

            if (imports.length > 0) {
                patterns.push({
                    type: 'imports',
                    file: fileName,
                    count: imports.length,
                    dependencies: imports.map(imp => {
                        const match = imp.match(/from\s+['"](.+)['"]/);
                        return match ? match[1] : 'unknown';
                    })
                });
            }

            if (exports.length > 0) {
                patterns.push({
                    type: 'exports',
                    file: fileName,
                    count: exports.length
                });
            }
        }

        return { patterns };
    }

    /**
     * Analyze overall architecture
     */
    analyzeArchitecture(readResult) {
        const architecture = {
            modules: {},
            dependencies: new Set(),
            layers: {},
            components: []
        };

        // Group files by directory structure
        for (const fileData of readResult.files) {
            const pathParts = fileData.file.split('/');
            const module = pathParts[0];
            const subModule = pathParts[1] || 'root';

            if (!architecture.modules[module]) {
                architecture.modules[module] = { files: 0, subModules: new Set() };
            }
            
            architecture.modules[module].files++;
            architecture.modules[module].subModules.add(subModule);

            // Detect architectural layers
            if (fileData.file.includes('controller')) {
                architecture.layers.controller = (architecture.layers.controller || 0) + 1;
            } else if (fileData.file.includes('service')) {
                architecture.layers.service = (architecture.layers.service || 0) + 1;
            } else if (fileData.file.includes('model') || fileData.file.includes('database')) {
                architecture.layers.data = (architecture.layers.data || 0) + 1;
            } else if (fileData.file.includes('core')) {
                architecture.layers.core = (architecture.layers.core || 0) + 1;
            }
        }

        // Convert Sets to arrays for serialization
        for (const module of Object.keys(architecture.modules)) {
            architecture.modules[module].subModules = Array.from(architecture.modules[module].subModules);
        }

        return architecture;
    }

    /**
     * Calculate code metrics
     */
    calculateMetrics(readResult) {
        let totalLines = 0;
        let totalSize = 0;
        let totalChunks = 0;
        const languageStats = {};
        const fileTypeStats = {};

        for (const fileData of readResult.files) {
            totalChunks += fileData.chunks;

            for (const chunk of fileData.data) {
                totalLines += chunk.lines;
                totalSize += chunk.size;
                
                const lang = chunk.metadata.language;
                const type = chunk.metadata.type;
                
                languageStats[lang] = (languageStats[lang] || 0) + chunk.lines;
                fileTypeStats[type] = (fileTypeStats[type] || 0) + 1;
            }
        }

        return {
            totalFiles: readResult.readCount,
            totalLines,
            totalSize,
            totalChunks,
            averageLinesPerFile: Math.round(totalLines / readResult.readCount),
            averageChunksPerFile: Math.round(totalChunks / readResult.readCount),
            languageDistribution: languageStats,
            fileTypeDistribution: fileTypeStats
        };
    }

    /**
     * Generate insights based on analysis
     */
    generateInsights(analysis, analysisType) {
        const insights = [];

        // Architecture insights
        const moduleCount = Object.keys(analysis.architecture.modules).length;
        insights.push({
            type: 'architecture',
            insight: `Project has ${moduleCount} main modules with layered architecture including ${Object.keys(analysis.architecture.layers).join(', ')} layers`
        });

        // Code quality insights
        const avgLinesPerFile = analysis.metrics.averageLinesPerFile;
        if (avgLinesPerFile > 200) {
            insights.push({
                type: 'quality',
                insight: 'Some files are quite large (>200 lines average), consider breaking down into smaller modules'
            });
        }

        // Language insights
        const mainLanguage = Object.keys(analysis.metrics.languageDistribution)[0];
        insights.push({
            type: 'technology',
            insight: `Primary language is ${mainLanguage} with ${analysis.metrics.languageDistribution[mainLanguage]} lines of code`
        });

        // Pattern insights
        const functionPatterns = analysis.patterns.filter(p => p.type === 'functions');
        if (functionPatterns.length > 0) {
            const totalFunctions = functionPatterns.reduce((sum, p) => sum + p.count, 0);
            insights.push({
                type: 'patterns',
                insight: `Codebase contains ${totalFunctions} functions across ${functionPatterns.length} files`
            });
        }

        return insights;
    }

    /**
     * Generate comprehensive report
     */
    generateReport(readResult, analysis, analysisType) {
        const report = {
            title: `AI Kernel Self-Code Analysis Report`,
            analysisType,
            timestamp: new Date().toISOString(),
            summary: `Analyzed ${readResult.readCount} files containing ${analysis.metrics.totalLines} lines of code`,
            sections: []
        };

        // Executive Summary
        report.sections.push({
            title: 'Executive Summary',
            content: this.generateExecutiveSummary(analysis)
        });

        // Architecture Overview
        report.sections.push({
            title: 'Architecture Overview',
            content: this.generateArchitectureSection(analysis.architecture)
        });

        // Code Metrics
        report.sections.push({
            title: 'Code Metrics',
            content: this.generateMetricsSection(analysis.metrics)
        });

        // Key Insights
        report.sections.push({
            title: 'Key Insights',
            content: analysis.insights.map(insight => `**${insight.type.toUpperCase()}:** ${insight.insight}`).join('\n\n')
        });

        // Recommendations (for comprehensive analysis)
        if (analysisType === 'comprehensive') {
            report.sections.push({
                title: 'Recommendations',
                content: this.generateRecommendations(analysis)
            });
        }

        return report;
    }

    generateExecutiveSummary(analysis) {
        return `The AI Kernel codebase consists of ${analysis.metrics.totalFiles} files with ${analysis.metrics.totalLines} total lines of code. The architecture follows a ${Object.keys(analysis.architecture.layers).length}-layer pattern with clear separation between ${Object.keys(analysis.architecture.layers).join(', ')} components. Primary development language is ${Object.keys(analysis.metrics.languageDistribution)[0]}.`;
    }

    generateArchitectureSection(architecture) {
        const moduleList = Object.entries(architecture.modules)
            .map(([name, info]) => `- **${name}**: ${info.files} files, ${info.subModules.length} sub-modules`)
            .join('\n');

        return `**Modules:**\n${moduleList}\n\n**Layers:**\n${Object.entries(architecture.layers).map(([name, count]) => `- **${name}**: ${count} files`).join('\n')}`;
    }

    generateMetricsSection(metrics) {
        return `**Files:** ${metrics.totalFiles}\n**Lines of Code:** ${metrics.totalLines}\n**Average Lines per File:** ${metrics.averageLinesPerFile}\n**Code Chunks:** ${metrics.totalChunks}\n\n**Language Distribution:**\n${Object.entries(metrics.languageDistribution).map(([lang, lines]) => `- **${lang}**: ${lines} lines`).join('\n')}`;
    }

    generateRecommendations(analysis) {
        const recommendations = [];

        if (analysis.metrics.averageLinesPerFile > 200) {
            recommendations.push('Consider refactoring larger files into smaller, more focused modules');
        }

        if (Object.keys(analysis.architecture.modules).length > 10) {
            recommendations.push('Large number of modules - consider grouping related functionality');
        }

        const functionPatterns = analysis.patterns.filter(p => p.type === 'functions');
        if (functionPatterns.length > 0) {
            const avgFunctionsPerFile = functionPatterns.reduce((sum, p) => sum + p.count, 0) / functionPatterns.length;
            if (avgFunctionsPerFile > 15) {
                recommendations.push('High function density detected - consider breaking down complex files');
            }
        }

        return recommendations.length > 0 
            ? recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')
            : 'Code structure appears well-organized with good separation of concerns.';
    }
}

export default SelfCodeReadingTask;