import { kernelClient } from "../core/kernel-client.js";

class ConsultationOrchestrator {
    constructor() {
        this.sessions = new Map(); // In-memory storage (volatile)
    }

    /**
     * Start a parallel consultation
     * @param {string} question - Human question
     * @param {string} context - Optional context/snapshot
     * @param {string[]} models - List of models to consult
     * @returns {Promise<string>} consultationId
     */
    async startSession(question, context, models) {
        const consultationId = `consult-${Date.now()}`;

        // Initialize state
        this.sessions.set(consultationId, {
            id: consultationId,
            status: 'running',
            progress: { total: models.length, completed: 0 },
            question,
            context,
            responses: [],
            startTime: Date.now()
        });

        // Fire and forget (async execution)
        this._executeParallel(consultationId, question, context, models);

        return consultationId;
    }

    async _executeParallel(consultationId, question, context, models) {
        const session = this.sessions.get(consultationId);
        if (!session) return;

        // Build the prompt for the council
        const prompt = {
            system: `You are a member of an expert AI council.
Your goal is to provide your honest, independent expert opinion.
Do not try to agree with others; your unique perspective is required.
Focus on logic, facts, and potential risks.`,
            user: `QUESTION: ${question}\n\nCONTEXT:\n${context || 'No specific context provided.'}`
        };

        // Send to all models in parallel
        // Note: kernelClient.sendParallel is ideal for this
        try {
            const results = await kernelClient.sendParallel(models, prompt, {
                type: 'consultation',
                id: consultationId
            });

            // Update session with results
            session.responses = results.map(r => ({
                model: r.model,
                content: r.content,
                timestamp: Date.now(),
                metadata: r.metadata
            }));

            session.status = 'complete';
            session.progress.completed = models.length;
            session.endTime = Date.now();

        } catch (err) {
            console.error(`Consultation failed: ${err.message}`);
            session.status = 'failed';
            session.error = err.message;
        }
    }

    getStatus(id) {
        return this.sessions.get(id);
    }

    getTranscript(id) {
        const session = this.sessions.get(id);
        if (!session) return null;

        return {
            id: session.id, // Fixed: accessing id from session object
            question: session.question,
            prompt: `QUESTION: ${session.question}\n\nCONTEXT:\n${session.context || 'No specific context provided.'}`,
            responses: session.responses
        };
    }
}

export const consultationOrchestrator = new ConsultationOrchestrator();
