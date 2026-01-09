const consultations = new Map();

function createConsultation({ id, question, snapshot, models }) {
    const entry = {
        id,
        question,
        snapshot,
        models: models.map(model => ({ model, status: "running", error: null })),
        status: "running",
        createdAt: Date.now(),
        completedAt: null,
        transcripts: [],
        consensus: null,
        warnings: []
    };
    consultations.set(id, entry);
    return entry;
}

function getConsultation(id) {
    return consultations.get(id) || null;
}

function updateModelStatus(id, model, status, error) {
    const consult = consultations.get(id);
    if (!consult) return;
    const target = consult.models.find(m => m.model === model);
    if (target) {
        target.status = status;
        target.error = error || null;
    }
    if (error) {
        consult.warnings.push({ model, message: error });
    }
}

function addTranscript(id, record) {
    const consult = consultations.get(id);
    if (!consult) return;
    consult.transcripts.push(record);
}

function finalize(id, consensus) {
    const consult = consultations.get(id);
    if (!consult) return;
    consult.status = "complete";
    consult.completedAt = Date.now();
    consult.consensus = consensus;
}

function reset() {
    consultations.clear();
}

export default {
    createConsultation,
    getConsultation,
    updateModelStatus,
    addTranscript,
    finalize,
    reset
};
