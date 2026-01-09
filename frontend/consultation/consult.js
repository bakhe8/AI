const API_BASE = '/consult';
let currentConsultationId = null;
let pollInterval = null;

document.getElementById('startBtn').addEventListener('click', startConsultation);

async function startConsultation() {
    const question = document.getElementById('questionInput').value.trim();
    const context = document.getElementById('contextInput').value.trim();

    if (!question) {
        alert('Please enter a question to consult the council.');
        return;
    }

    // UI Update
    document.getElementById('startBtn').disabled = true;
    document.getElementById('statusIndicator').classList.remove('hidden');
    document.getElementById('statusIndicator').textContent = 'Consulting Council...';

    // Clear previous results
    document.getElementById('transcriptGrid').innerHTML = '';
    document.getElementById('transcriptGrid').classList.add('hidden');
    document.getElementById('decisionGate').classList.add('hidden');
    document.getElementById('consensusPanel').classList.add('hidden');

    try {
        // Log request payload for debugging
        const payload = {
            question,
            context, // Matches backend controller expectation
            models: ['openai', 'gemini', 'deepseek', 'copilot', 'claude']
        };
        console.log('Sending consultation request:', payload);

        const response = await fetch(`${API_BASE}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            currentConsultationId = data.consultationId;
            pollStatus(currentConsultationId);
        } else {
            throw new Error(data.error || 'Failed to start');
        }


    } catch (err) {
        console.error(err);
        alert('Error: ' + err.message);
        resetUI();
    }
}

function pollStatus(id) {
    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/status/${id}`);
            const status = await res.json();

            if (status.status === 'complete') {
                clearInterval(pollInterval);
                document.getElementById('statusIndicator').textContent = 'Analysis Complete';
                document.getElementById('statusIndicator').className = 'status-badge success';

                await loadTranscript(id);
                // await loadConsensus(id); // Optional: if we implement consensus view

                document.getElementById('decisionGate').classList.remove('hidden');
                document.getElementById('startBtn').disabled = false;
            } else if (status.status === 'failed') {
                clearInterval(pollInterval);
                document.getElementById('statusIndicator').textContent = 'Failed';
                alert('Consultation failed: ' + status.error);
                resetUI();
            } else {
                // Update progress
                const completed = status.progress?.completed || 0;
                const total = status.progress?.total || 1;
                document.getElementById('statusIndicator').textContent = `Consulting... (${completed}/${total})`;
            }
        } catch (err) {
            console.error('Polling error', err);
        }
    }, 1000);
}

async function loadTranscript(id) {
    const res = await fetch(`${API_BASE}/transcript/${id}`);
    const transcript = await res.json();

    const grid = document.getElementById('transcriptGrid');
    grid.innerHTML = '';
    grid.classList.remove('hidden');

    if (!transcript.responses || transcript.responses.length === 0) {
        grid.innerHTML = '<div class="panel" style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No responses received from the council yet. Models may be busy or offline.</div>';
        return;
    }

    transcript.responses.forEach(response => {
        const col = document.createElement('div');
        col.className = 'model-column';

        const contentHtml = marked.parse(response.content);

        col.innerHTML = `
            <div class="model-header">${response.model}</div>
            <div class="model-content markdown-body">${contentHtml}</div>
        `;
        grid.appendChild(col);
    });
}

function resetUI() {
    document.getElementById('startBtn').disabled = false;
    document.getElementById('statusIndicator').classList.add('hidden');
}
