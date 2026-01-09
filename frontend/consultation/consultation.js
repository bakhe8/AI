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
    
    // Add comparison toggle
    if ((data?.transcripts || []).length > 1) {
        const toggleDiv = document.createElement("div");
        toggleDiv.className = "view-toggle";
        toggleDiv.innerHTML = `
            <button class="toggle-btn" data-view="list">List View</button>
            <button class="toggle-btn active" data-view="compare">Side-by-Side Compare</button>
        `;
        transcriptsEl.appendChild(toggleDiv);
        
        toggleDiv.querySelectorAll(".toggle-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                toggleDiv.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const view = btn.dataset.view;
                transcriptsEl.querySelector(".transcripts-container").className = 
                    view === "compare" ? "transcripts-container compare-view" : "transcripts-container list-view";
            });
        });
    }
    
    const container = document.createElement("div");
    container.className = "transcripts-container compare-view";
    
    (data?.transcripts || []).forEach(entry => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "entry";
        
        const header = document.createElement("div");
        header.className = "entry-header";
        header.innerHTML = `
            <span class="model-badge">${entry.model}</span>
            <span class="timestamp">${new Date(entry.timestamp).toLocaleString()}</span>
            <button class="copy-btn" data-content="${escapeHtml(entry.response || '')}">📋 Copy</button>
        `;
        entryDiv.appendChild(header);
        
        const responseDiv = document.createElement("div");
        responseDiv.className = "response-content";
        const responseText = extractCode(entry.response || "");
        responseDiv.textContent = responseText;
        entryDiv.appendChild(responseDiv);
        
        container.appendChild(entryDiv);
    });
    
    transcriptsEl.appendChild(container);
    
    // Add copy button listeners
    transcriptsEl.querySelectorAll(".copy-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const content = btn.dataset.content;
            navigator.clipboard.writeText(content).then(() => {
                btn.textContent = "✓ Copied";
                setTimeout(() => btn.textContent = "📋 Copy", 2000);
            });
        });
    });
}

function escapeHtml(text) {
    return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractCode(text) {
    const match = text.match(/```[a-zA-Z0-9]*\s*([\s\S]*?)```/);
    if (match && match[1]) {
        return match[1].trim();
    }
    return text;
}

function renderConsensus(consensus) {
    consensusEl.innerHTML = "";
    if (!consensus) return;
    
    // Add summary stats
    const stats = document.createElement("div");
    stats.className = "consensus-stats";
    stats.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Agreement Points</span>
            <span class="stat-value">${(consensus.agreement || []).length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Disagreements</span>
            <span class="stat-value">${(consensus.disagreements || []).length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Gaps</span>
            <span class="stat-value">${(consensus.gaps || []).length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Warnings</span>
            <span class="stat-value">${(consensus.warnings || []).length}</span>
        </div>
    `;
    consensusEl.appendChild(stats);
    
    const sections = [
        ["Agreement", consensus.agreement, "✓"],
        ["Disagreements", consensus.disagreements, "⚠"],
        ["Gaps", consensus.gaps, "◯"],
        ["Warnings", consensus.warnings, "!"]
    ];
    
    sections.forEach(([title, items, icon]) => {
        const section = document.createElement("div");
        section.className = "consensus-section";
        
        const header = document.createElement("h4");
        header.innerHTML = `<span class="section-icon">${icon}</span> ${title}`;
        section.appendChild(header);
        
        if (!items || items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "pill muted";
            empty.textContent = "None";
            section.appendChild(empty);
        } else {
            items.forEach(item => {
                const itemEl = document.createElement("div");
                itemEl.className = "consensus-item";
                itemEl.textContent = JSON.stringify(item, null, 2);
                section.appendChild(itemEl);
            });
        }
        
        consensusEl.appendChild(section);
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

// Export functionality
const exportBtn = document.getElementById("export-btn");
if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
        if (!consultId) {
            alert("No consultation to export");
            return;
        }
        
        try {
            const [statusRes, transcriptRes, consensusRes] = await Promise.all([
                fetch(`/consult/status/${consultId}`),
                fetch(`/consult/transcript/${consultId}`),
                fetch(`/consult/consensus/${consultId}`)
            ]);
            
            const status = await statusRes.json();
            const transcript = await transcriptRes.json();
            const consensus = await consensusRes.json();
            
            const report = {
                consultationId: consultId,
                exportDate: new Date().toISOString(),
                status: status,
                transcripts: transcript.transcripts,
                consensus: consensus.consensus
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `consultation-${consultId}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            decisionNote.textContent = "✓ Report exported successfully";
            setTimeout(() => decisionNote.textContent = "", 3000);
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export report");
        }
    });
}
