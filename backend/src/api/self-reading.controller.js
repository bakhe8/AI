import selfReader from '../core/self-reader.js';
import sessionManager from '../core/session-manager.js';
import databaseService from '../core/database.js';

/**
 * Self-Reading Controller
 * Handles AI Kernel's self-code reading functionality
 */

export async function startSelfReading(req, res) {
    try {
        const { channelId, targetPath, analysisType = 'general' } = req.body;
        
        if (!channelId) {
            return res.status(400).json({ 
                success: false,
                error: 'channelId is required',
                code: 400 
            });
        }

        // Start session for self-reading
        const session = await sessionManager.startSession(channelId, {
            type: 'self-reading',
            selfReadingEnabled: true,
            includeTests: analysisType === 'comprehensive',
            includeDocs: true
        });

        // Perform self-reading
        const readResult = await sessionManager.performSelfReading(session.id, targetPath);
        
        // Simple analysis
        const analysis = performBasicAnalysis(readResult);
        
        // Save results to database  
        databaseService.addMessage(
            session.conversationId,
            'system',
            `Self-reading analysis completed: ${analysis.summary}`,
            'self-reader',
            {
                type: 'self_reading_complete',
                readResult,
                analysis
            }
        );

        res.json({
            success: true,
            sessionId: session.id,
            executionId: `self-reading-${Date.now()}`,
            analysis,
            readResult: {
                filesRead: readResult.readCount,
                chunksProcessed: readResult.files.reduce((sum, f) => sum + f.chunks, 0),
                snapshot: readResult.snapshot
            }
        });

    } catch (err) {
        console.error('[SelfReading] Error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message,
            code: 500 
        });
    }
}

export async function getSelfReadingSession(req, res) {
    try {
        const { sessionId } = req.params;
        
        const session = sessionManager.getSession(sessionId);
        if (!session) {
            return res.status(404).json({ 
                success: false,
                error: 'Session not found',
                code: 404 
            });
        }

        const selfReadingSession = selfReader.getSession(sessionId);
        
        res.json({
            success: true,
            session: {
                id: session.id,
                channelId: session.channelId,
                type: session.type,
                status: session.status,
                startTime: session.startTime,
                selfReadingEnabled: session.selfReadingEnabled
            },
            selfReading: selfReadingSession ? {
                snapshotHash: selfReadingSession.snapshot.hash,
                filesRead: selfReadingSession.readFiles.size,
                filesModified: selfReadingSession.modifiedFiles.size
            } : null
        });

    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message,
            code: 500 
        });
    }
}

export async function listSelfReadingSessions(req, res) {
    try {
        const activeSessions = sessionManager.listActiveSessions();
        const selfReadingSessions = activeSessions.filter(s => 
            s.type === 'self-reading' || s.selfReadingEnabled
        );
        
        res.json({
            success: true,
            count: selfReadingSessions.length,
            sessions: selfReadingSessions
        });

    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message,
            code: 500 
        });
    }
}

export async function endSelfReadingSession(req, res) {
    try {
        const { sessionId } = req.params;
        const { reason = 'manual' } = req.body;
        
        const result = await sessionManager.endSession(sessionId, reason);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Session not found',
                code: 404
            });
        }

        res.json({
            success: true,
            sessionId: result.sessionId,
            duration: result.duration,
            reason: result.reason,
            selfReadingStats: result.selfReadingStats
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            code: 500
        });
    }
}

/**
 * Perform basic analysis of self-read code
 */
function performBasicAnalysis(readResult) {
    const analysis = {
        timestamp: new Date().toISOString(),
        summary: '',
        metrics: {},
        insights: [],
        architecture: {}
    };

    // Calculate basic metrics
    let totalLines = 0;
    let totalChunks = 0;
    const languageStats = {};
    const moduleStats = {};

    for (const fileData of readResult.files) {
        totalChunks += fileData.chunks;
        
        // Determine module from file path
        const pathParts = fileData.file.split('/');
        const module = pathParts[0];
        moduleStats[module] = (moduleStats[module] || 0) + 1;

        for (const chunk of fileData.data) {
            totalLines += chunk.lines;
            const lang = chunk.metadata.language;
            languageStats[lang] = (languageStats[lang] || 0) + chunk.lines;
        }
    }

    analysis.metrics = {
        filesRead: readResult.readCount,
        totalLines,
        totalChunks,
        averageLinesPerFile: Math.round(totalLines / readResult.readCount),
        languageDistribution: languageStats,
        moduleDistribution: moduleStats
    };

    // Generate insights
    const primaryLanguage = Object.keys(languageStats)[0];
    const moduleCount = Object.keys(moduleStats).length;

    analysis.insights = [
        {
            type: 'architecture',
            insight: `Codebase consists of ${moduleCount} main modules with ${readResult.readCount} files`
        },
        {
            type: 'technology',
            insight: `Primary language is ${primaryLanguage} with ${languageStats[primaryLanguage]} lines`
        },
        {
            type: 'structure',
            insight: `Average file size is ${analysis.metrics.averageLinesPerFile} lines with ${Math.round(totalChunks/readResult.readCount)} chunks per file`
        }
    ];

    analysis.architecture = {
        modules: moduleStats,
        languages: languageStats,
        complexity: totalLines > 5000 ? 'high' : totalLines > 2000 ? 'medium' : 'low'
    };

    analysis.summary = `Analyzed ${readResult.readCount} files (${totalLines} lines) across ${moduleCount} modules`;

    return analysis;
}