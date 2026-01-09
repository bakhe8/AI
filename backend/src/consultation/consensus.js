const STOPWORDS = new Set(["the", "and", "that", "with", "from", "this", "there", "have", "will", "should", "would", "could", "about", "which", "their", "your", "into", "only", "other", "these", "those", "been", "being", "without", "under", "over", "after", "before", "while", "through", "between", "because", "where", "when", "what", "why", "how", "التي", "هذا", "هذه", "هناك", "على", "من", "في"]);

function normalize(text) {
    return text.toLowerCase();
}

function extractKeywords(text) {
    const tokens = normalize(text)
        .split(/[^a-zA-Z0-9\u0600-\u06FF]+/)
        .filter(t => t.length > 3 && !STOPWORDS.has(t));
    const counts = new Map();
    tokens.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
    return Array.from(counts.keys());
}

function computeAgreement(keywordUsage) {
    const agreement = [];
    Object.entries(keywordUsage).forEach(([kw, models]) => {
        if (models.length >= 2) {
            agreement.push({ keyword: kw, models });
        }
    });
    return agreement;
}

function computeGaps(keywordUsage, modelNames) {
    const gaps = [];
    Object.entries(keywordUsage).forEach(([kw, models]) => {
        if (models.length === 1) {
            const missing = modelNames.filter(m => !models.includes(m));
            gaps.push({ keyword: kw, mentionedBy: models, missedBy: missing });
        }
    });
    return gaps;
}

const CONTRADICTION_PAIRS = [
    ["safe", "vulnerable"],
    ["secure", "insecure"],
    ["fast", "slow"],
    ["pass", "fail"]
];

function computeDisagreements(keywordUsage) {
    const disagreements = [];
    CONTRADICTION_PAIRS.forEach(([a, b]) => {
        const modelsA = keywordUsage[a] || [];
        const modelsB = keywordUsage[b] || [];
        if (modelsA.length && modelsB.length) {
            disagreements.push({ topic: `${a} vs ${b}`, modelsA, modelsB });
        }
    });
    return disagreements;
}

export function buildConsensus(transcripts, warnings = []) {
    const keywordUsage = {};
    const modelNames = [];

    transcripts.forEach(({ model, response }) => {
        modelNames.push(model);
        if (!response) return;
        const keywords = extractKeywords(response);
        keywords.forEach(kw => {
            if (!keywordUsage[kw]) keywordUsage[kw] = [];
            if (!keywordUsage[kw].includes(model)) {
                keywordUsage[kw].push(model);
            }
        });
    });

    return {
        agreement: computeAgreement(keywordUsage),
        disagreements: computeDisagreements(keywordUsage),
        gaps: computeGaps(keywordUsage, modelNames),
        warnings
    };
}
