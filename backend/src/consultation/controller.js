import consultationService from "./service.js";

export function startConsultation(req, res, next) {
    try {
        const { question, snapshot, models } = req.body || {};
        const result = consultationService.start({ question, snapshot, models });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

export function getConsultationStatus(req, res) {
    const consult = consultationService.status(req.params.id);
    if (!consult) {
        return res.status(404).json({ error: "Consultation not found", code: 404 });
    }
    return res.json(consult);
}

export function getConsultationTranscript(req, res) {
    const consult = consultationService.transcript(req.params.id);
    if (!consult) {
        return res.status(404).json({ error: "Consultation not found", code: 404 });
    }
    return res.json(consult);
}

export function getConsultationConsensus(req, res) {
    const consult = consultationService.consensus(req.params.id);
    if (!consult) {
        return res.status(404).json({ error: "Consultation not found", code: 404 });
    }
    return res.json(consult);
}
