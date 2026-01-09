import { consultationOrchestrator } from "./orchestrator.js";
import { consensusAnalyzer } from "./consensus.js";

/**
 * Start a new consultation session
 * POST /consult/start
 */
export async function startConsultation(req, res) {
    try {
        const { question, context, models } = req.body;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Use requested models or all available (default)
        const targetModels = models || ['openai', 'gemini', 'deepseek', 'copilot', 'claude'];

        // Start async orchestration
        const consultationId = await consultationOrchestrator.startSession(question, context, targetModels);

        res.status(202).json({
            success: true,
            consultationId: consultationId,
            statusUrl: `/consult/status/${consultationId}`,
            transcriptUrl: `/consult/transcript/${consultationId}`,
            message: 'Consultation started with council'
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/**
 * Get status of a consultation
 * GET /consult/status/:id
 */
export async function getConsultationStatus(req, res) {
    try {
        const { id } = req.params;
        const status = consultationOrchestrator.getStatus(id);

        if (!status) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/**
 * Get full transcript (prompts & responses)
 * GET /consult/transcript/:id
 */
export async function getConsultationTranscript(req, res) {
    try {
        const { id } = req.params;
        const transcript = consultationOrchestrator.getTranscript(id);

        if (!transcript) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.json(transcript);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/**
 * Get consensus analysis
 * GET /consult/consensus/:id
 */
export async function getConsultationConsensus(req, res) {
    try {
        const { id } = req.params;
        const transcript = consultationOrchestrator.getTranscript(id);

        if (!transcript) {
            return res.status(404).json({ error: 'Data not found' });
        }

        // Analyze consensus on demand (or retrieve cached)
        const consensus = await consensusAnalyzer.analyze(transcript);

        res.json(consensus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
