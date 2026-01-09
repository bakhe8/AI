import { getAdapter } from "../adapters/registry.js";
import consultationStore from "./store.js";
import { buildConsensus } from "./consensus.js";

const MODEL_ENV = {
    openai: "OPENAI_API_KEY",
    gemini: "GEMINI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    copilot: "GITHUB_TOKEN",
    claude: "ANTHROPIC_API_KEY",
    mock: null
};

const MODEL_TIMEOUT_MS = 35_000;

function filterModels(models) {
    const unique = Array.from(new Set(models));
    const available = unique.filter(m => MODEL_ENV[m] !== undefined);
    const configured = available.filter(m => {
        const env = MODEL_ENV[m];
        return env === null || process.env[env];
    });
    // If nothing configured, allow mock to keep flow testable
    if (configured.length === 0 && available.includes("mock")) return ["mock"];
    return configured;
}

function buildMessages(question, snapshot) {
    return [
        {
            role: "system",
            content: "You are participating in a consultation. Provide independent analysis. Do not propose implementation steps. No recommendations for deployment. Return concise findings only."
        },
        {
            role: "user",
            content: `Question:\n${question}\n\nSnapshot:\n${snapshot}`
        }
    ];
}

let adapterResolver = getAdapter;

// Test hook
export function __setAdapterResolver(fn) {
    adapterResolver = fn || getAdapter;
}

async function runModel(consultId, model, question, snapshot) {
    consultationStore.updateModelStatus(consultId, model, "running");
    const adapter = adapterResolver(model);
    const messages = buildMessages(question, snapshot);

    try {
        const reply = await Promise.race([
            adapter.send(messages),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), MODEL_TIMEOUT_MS))
        ]);
        consultationStore.addTranscript(consultId, {
            model,
            prompt: messages,
            response: reply?.content || "",
            timestamp: Date.now(),
            tokens: reply?.tokens || null
        });
        consultationStore.updateModelStatus(consultId, model, "complete");
    } catch (err) {
        consultationStore.updateModelStatus(consultId, model, "error", err.message || "model failed");
    }
}

class ConsultationService {
    start({ question, snapshot, models }) {
        if (!question || typeof question !== "string" || !question.trim()) {
            throw new Error("question is required");
        }
        if (!snapshot || typeof snapshot !== "string" || !snapshot.trim()) {
            throw new Error("snapshot is required");
        }
        const targetModels = filterModels(models && models.length ? models : ["openai", "deepseek", "gemini", "copilot", "claude", "mock"]);
        if (targetModels.length === 0) {
            throw new Error("no configured models available");
        }

        const consultId = `consult-${Date.now()}`;
        consultationStore.createConsultation({
            id: consultId,
            question: question.trim(),
            snapshot: snapshot.trim(),
            models: targetModels
        });

        Promise.all(targetModels.map(model => runModel(consultId, model, question, snapshot)))
            .then(() => {
                const consult = consultationStore.getConsultation(consultId);
                if (consult) {
                    const consensus = buildConsensus(consult.transcripts, consult.warnings);
                    consultationStore.finalize(consultId, consensus);
                }
            })
            .catch(() => {
                const consult = consultationStore.getConsultation(consultId);
                if (consult) {
                    const consensus = buildConsensus(consult.transcripts, consult.warnings);
                    consultationStore.finalize(consultId, consensus);
                }
            });

        return { consultId, status: "running", models: targetModels };
    }

    status(id) {
        const consult = consultationStore.getConsultation(id);
        if (!consult) return null;
        return {
            id: consult.id,
            status: consult.status,
            models: consult.models,
            createdAt: consult.createdAt,
            completedAt: consult.completedAt
        };
    }

    transcript(id) {
        const consult = consultationStore.getConsultation(id);
        if (!consult) return null;
        return {
            id: consult.id,
            question: consult.question,
            snapshot: consult.snapshot,
            transcripts: consult.transcripts,
            warnings: consult.warnings
        };
    }

    consensus(id) {
        const consult = consultationStore.getConsultation(id);
        if (!consult) return null;
        return {
            id: consult.id,
            status: consult.status,
            consensus: consult.consensus,
            warnings: consult.warnings
        };
    }
}

const consultationService = new ConsultationService();
export default consultationService;
