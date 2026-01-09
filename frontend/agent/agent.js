const taskSelect = document.getElementById('task-select');
const runBtn = document.getElementById('run-btn');
const runStatus = document.getElementById('run-status');
const statusText = document.getElementById('status-text');
const progressText = document.getElementById('progress-text');
const codeInput = document.getElementById('code-input');
const fileInput = document.getElementById('file-input');
const tabContent = document.getElementById('tab-content');
const backBtn = document.getElementById('back-btn');
let currentExecutionId = null;
let tasks = [];

backBtn.onclick = () => {
    window.location = '/';
};

document.querySelectorAll('input[name="input-mode"]').forEach(r => {
    r.addEventListener('change', () => {
        const mode = getInputMode();
        if (mode === 'upload') {
            codeInput.classList.add('hidden');
            fileInput.classList.remove('hidden');
        } else {
            codeInput.classList.remove('hidden');
            fileInput.classList.add('hidden');
        }
    });
});

document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        renderTab(btn.dataset.tab);
    });
});

runBtn.addEventListener('click', startRun);

loadTasks();

async function loadTasks() {
    try {
        const res = await fetch('/agent/tasks');
        const data = await res.json();
        tasks = Array.isArray(data) ? data : [];
        taskSelect.innerHTML = '';
        tasks.forEach(task => {
            const opt = document.createElement('option');
            opt.value = task.id;
            opt.textContent = `${task.name}`;
            taskSelect.appendChild(opt);
        });
        taskSelect.disabled = tasks.length === 0;
    } catch (err) {
        taskSelect.innerHTML = '<option>Error loading tasks</option>';
        taskSelect.disabled = true;
    }
}

function getInputMode() {
    return document.querySelector('input[name="input-mode"]:checked')?.value || 'paste';
}

async function getCodeContent() {
    const mode = getInputMode();
    if (mode === 'paste') {
        return codeInput.value.trim();
    }
    const file = fileInput.files[0];
    if (!file) return '';
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

async function startRun() {
    const code = await getCodeContent();
    if (!code) {
        alert('Please provide JS code (paste or upload).');
        return;
    }
    if (!taskSelect.value) {
        alert('No task available.');
        return;
    }

    runBtn.disabled = true;
    runStatus.textContent = 'Running...';
    statusText.textContent = 'Running...';
    progressText.textContent = 'Models: — | Calls: —';
    tabContent.textContent = '';

    try {
        const res = await fetch('/agent/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskId: taskSelect.value,
                input: { type: 'code', content: code }
            })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to start');
        }
        currentExecutionId = data.executionId;
        runStatus.textContent = `Started: ${currentExecutionId}`;
        pollStatus();
    } catch (err) {
        runStatus.textContent = `Error: ${err.message}`;
        statusText.textContent = 'Error';
        runBtn.disabled = false;
    }
}

async function pollStatus() {
    if (!currentExecutionId) return;
    try {
        const res = await fetch(`/agent/status/${currentExecutionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Status error');

        const completed = data.progress?.current ?? 0;
        const total = data.progress?.total ?? '?';
        statusText.textContent = `Status: ${data.status}`;
        progressText.textContent = `Progress: ${completed}/${total}`;

        if (data.status === 'complete' || data.status === 'error') {
            await loadResults();
            runBtn.disabled = false;
            return;
        }
    } catch (err) {
        runStatus.textContent = `Error: ${err.message}`;
        runBtn.disabled = false;
        return;
    }
    setTimeout(pollStatus, 1000);
}

async function loadResults() {
    if (!currentExecutionId) return;
    try {
        const res = await fetch(`/agent/results/${currentExecutionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Results error');

        window.__agentResults = data;
        renderTab(document.querySelector('.tab.active')?.dataset.tab || 'patterns');
        runStatus.textContent = 'Completed';
        statusText.textContent = `Status: ${data.status}`;
    } catch (err) {
        runStatus.textContent = `Error: ${err.message}`;
        statusText.textContent = 'Error';
    } finally {
        runBtn.disabled = false;
    }
}

function renderTab(tab) {
    const data = window.__agentResults || {};
    if (tab === 'patterns') {
        renderList('Patterns', data.patterns);
    } else if (tab === 'gaps') {
        renderGaps(data.gaps);
    } else if (tab === 'contradictions') {
        renderList('Contradictions', data.contradictions);
    } else if (tab === 'metrics') {
        renderMetrics(data.metrics);
    } else if (tab === 'raw') {
        tabContent.textContent = data.rawReport || 'No report available.';
    }
}

function renderList(title, items) {
    if (!items || items.length === 0) {
        tabContent.textContent = `No ${title.toLowerCase()} detected.`;
        return;
    }
    const lines = items.map((item, i) => `${i + 1}. ${item.text || item.type || JSON.stringify(item)}`);
    tabContent.textContent = lines.join('\n');
}

function renderGaps(gaps) {
    if (!gaps || gaps.length === 0) {
        tabContent.textContent = 'No gaps detected.';
        return;
    }
    const lines = gaps.map((gap, i) => {
        return `${i + 1}. [${gap.facet}] ${gap.topic}\n  Mentioned by: ${gap.mentionedBy?.join(', ') || '—'}\n  Missed by: ${gap.missedBy?.join(', ') || '—'}`;
    });
    tabContent.textContent = lines.join('\n\n');
}

function renderMetrics(metrics) {
    if (!metrics || Object.keys(metrics).length === 0) {
        tabContent.textContent = 'No metrics available.';
        return;
    }
    const lines = [];
    for (const [facet, m] of Object.entries(metrics)) {
        lines.push(`${facet.toUpperCase()}: total=${m.total}, success=${m.successful}, failed=${m.failed}, successRate=${m.percentage}%`);
    }
    tabContent.textContent = lines.join('\n');
}
