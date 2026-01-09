const form = document.getElementById("start-form");
const statusList = document.getElementById("status-list");
const transcriptsEl = document.getElementById("transcripts");
const consensusEl = document.getElementById("consensus");
const refreshBtn = document.getElementById("refresh-btn");
const approveBtn = document.getElementById("approve-btn");
const reaskBtn = document.getElementById("reask-btn");
const stopBtn = document.getElementById("stop-btn");
const reaskInput = document.getElementById("reask-input");
const decisionNote = document.getElementById("decision-note");
const currentId = document.getElementById("current-id");
const errorBox = document.getElementById("start-error");

let consultId = null;

function getSelectedModels() {
    return Array.from(form.querySelectorAll("input[type=checkbox]:checked")).map(cb => cb.value);
}

function renderStatus(models = []) {
    statusList.innerHTML = "";
    models.forEach(m => {
        const li = document.createElement("li");
        li.className = "status-item";
        const left = document.createElement("span");
        left.textContent = m.model;
        const pill = document.createElement("span");
        pill.className = `pill ${m.status}`;
        pill.textContent = m.status.toUpperCase();
        if (m.error) {
            pill.title = m.error;
        }
        li.append(left, pill);
        statusList.appendChild(li);
    });
}

function renderTranscripts(data) {
    transcriptsEl.innerHTML = "";
    (data?.transcripts || []).forEach(entry => {
        const container = document.createElement("div");
        container.className = "entry";
        const title = document.createElement("div");
        title.textContent = `${entry.model} — ${new Date(entry.timestamp).toLocaleString()}`;
        const prompt = document.createElement("pre");
        prompt.textContent = JSON.stringify(entry.prompt, null, 2);
        const response = document.createElement("pre");
        response.textContent = entry.response || "";
        container.append(title);
        container.append(document.createTextNode("Prompt:"));
        container.append(prompt);
        container.append(document.createTextNode("Response:"));
        container.append(response);
        transcriptsEl.appendChild(container);
    });
}

function renderConsensus(consensus) {
    consensusEl.innerHTML = "";
    if (!consensus) return;
    const sections = [
        ["Agreement", consensus.agreement],
        ["Disagreements", consensus.disagreements],
        ["Gaps", consensus.gaps],
        ["Warnings", consensus.warnings]
    ];
    sections.forEach(([title, items]) => {
        const h = document.createElement("h4");
        h.textContent = title;
        consensusEl.appendChild(h);
        if (!items || items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "pill muted";
            empty.textContent = "None";
            consensusEl.appendChild(empty);
            return;
        }
        items.forEach(item => {
            const pre = document.createElement("pre");
            pre.textContent = JSON.stringify(item, null, 2);
            consensusEl.appendChild(pre);
        });
    });
}

async function refreshData() {
    if (!consultId) return;
    try {
        const [statusRes, transcriptRes, consensusRes] = await Promise.all([
            fetch(`/consult/status/${consultId}`),
            fetch(`/consult/transcript/${consultId}`),
            fetch(`/consult/consensus/${consultId}`)
        ]);
        const status = await statusRes.json();
        const transcript = await transcriptRes.json();
        const consensus = await consensusRes.json();
        renderStatus(status.models || []);
        renderTranscripts(transcript);
        renderConsensus(consensus.consensus);
    } catch (err) {
        console.error("Refresh failed", err);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.textContent = "";
    decisionNote.textContent = "";
    const question = document.getElementById("question").value.trim();
    const snapshot = document.getElementById("snapshot").value.trim();
    const models = getSelectedModels();
    if (!question || !snapshot) {
        errorBox.textContent = "Question and snapshot are required.";
        return;
    }
    if (models.length === 0) {
        errorBox.textContent = "Select at least one model.";
        return;
    }
    const body = { question, snapshot, models };
    try {
        const res = await fetch("/consult/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start");
        consultId = data.consultId;
        currentId.textContent = `Consultation: ${consultId}`;
        renderStatus(data.models.map(m => ({ model: m, status: "running" })));
    } catch (err) {
        console.error("Start failed", err);
        errorBox.textContent = err.message || "Failed to start consultation";
    }
});

refreshBtn.addEventListener("click", () => {
    refreshData();
});

approveBtn.addEventListener("click", () => {
    if (!consultId) {
        decisionNote.textContent = "No consultation in progress.";
        return;
    }
    decisionNote.textContent = "✅ Approved (analysis/plan only). No code applied.";
});

reaskBtn.addEventListener("click", () => {
    if (!consultId) {
        decisionNote.textContent = "No consultation in progress.";
        return;
    }
    const guidance = reaskInput.value.trim();
    if (!guidance) {
        decisionNote.textContent = "Please provide new guidance for re-ask.";
        return;
    }
    decisionNote.textContent = `🔄 Re-ask queued locally with guidance: ${guidance}`;
});

stopBtn.addEventListener("click", () => {
    if (!consultId) {
        decisionNote.textContent = "No consultation in progress.";
        return;
    }
    decisionNote.textContent = "⛔ Stopped. No further action taken.";
});
