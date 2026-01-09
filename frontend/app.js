console.log("AI Kernel UI loaded");

// Configure marked.js for better rendering
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) { }
            }
            return hljs.highlightAuto(code).value;
        }
    });
}

const POLL_INTERVAL_MS = 10000;
let pageHidden = false;
const HEALTH_TOKEN = (typeof localStorage !== 'undefined' && localStorage.getItem('health_token')) || null;
const ENABLE_HEALTH_STATUS = !!HEALTH_TOKEN;
let ws;
let ws;

// Track page visibility to reduce unnecessary polling
document.addEventListener('visibilitychange', () => {
    pageHidden = document.visibilityState === 'hidden';
});

// Check adapter health status on load and start WS
if (ENABLE_HEALTH_STATUS) {
    updateAdapterStatus();
}
initWebSocket();
initWebSocket();

const panelState = new Map();
const processingState = new Map(); // Track if panel is processing a message

document.querySelectorAll('.panel').forEach((panel, index) => {
    const model = panel.dataset.model;
    const channelId = `panel-${index + 1}`;
    const messagesContainer = panel.querySelector('.messages');
    const input = panel.querySelector('input');
    const button = panel.querySelector('button');

    // Add unique ID to panel for easy access if needed
    panel.id = channelId;
    panelState.set(channelId, []);
    processingState.set(channelId, false);

    // Load existing messages from backend
    loadMessages(channelId, messagesContainer);

    // Auto-refresh messages every POLL_INTERVAL_MS (only if not processing and page visible)
    setInterval(() => {
        if (!processingState.get(channelId) && !pageHidden) {
            loadMessages(channelId, messagesContainer);
        }
    }, POLL_INTERVAL_MS);

    button.addEventListener('click', () => sendMessage(panel, channelId, model, input, messagesContainer, button));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !button.disabled) {
            sendMessage(panel, channelId, model, input, messagesContainer, button);
        }
    });
});

function initWebSocket() {
    try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        ws = new WebSocket(`${wsProtocol}://${window.location.host}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'reply' && msg.data) {
                    const { channel_id, reply } = msg.data;
                    const panel = document.getElementById(channel_id);
                    if (!panel) return;
                    const messagesContainer = panel.querySelector('.messages');
                    const history = panelState.get(channel_id) || [];
                    addMessage(messagesContainer, 'assistant', reply.content);
                    history.push({ role: 'assistant', content: reply.content });
                    panelState.set(channel_id, history);
                }
            } catch (err) {
                console.error('Failed to handle WS message', err);
            }
        };

        ws.onclose = () => {
            console.warn('WebSocket disconnected, retrying in 5s');
            setTimeout(initWebSocket, 5000);
        };
    } catch (err) {
        console.error('Failed to initialize WebSocket', err);
    }
}

async function loadMessages(channelId, container) {
    try {
        const response = await fetch(`/api/messages/${channelId}`);
        const data = await response.json();

        const currentMessages = panelState.get(channelId) || [];
        const newMessages = data.messages || [];

        // Only update if there are new messages
        if (JSON.stringify(currentMessages) !== JSON.stringify(newMessages)) {
            const currentLength = currentMessages.length;
            const newLength = newMessages.length;

            panelState.set(channelId, newMessages);

            // Only add new messages instead of redrawing everything
            if (newLength > currentLength) {
                for (let i = currentLength; i < newLength; i++) {
                    const msg = newMessages[i];
                    addMessage(container, msg.role, msg.content, false);
                }
                // Scroll to bottom only when new messages arrive
                container.scrollTop = container.scrollHeight;
            } else {
                // Full redraw only if messages were deleted/changed
                container.innerHTML = '';
                newMessages.forEach(msg => {
                    addMessage(container, msg.role, msg.content, false);
                });
                container.scrollTop = container.scrollHeight;
            }
        }
    } catch (e) {
        console.error('Failed to load messages:', e);
    }
}

async function updateAdapterStatus() {
    if (!ENABLE_HEALTH_STATUS) return;
    try {
        const response = await fetch('/api/health', {
            headers: {
                'Authorization': `Bearer ${HEALTH_TOKEN}`
            }
        });
        const status = await response.json();

        // Update status indicators
        document.querySelectorAll('.status-indicator').forEach(indicator => {
            const model = indicator.dataset.status;
            const adapter = status.adapters?.[model];
            if (adapter) {
                const isOnline = adapter.status === 'available';
                indicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
                indicator.title = isOnline ? 'Available' : 'Unavailable';
            }
        });
    } catch (e) {
        console.error('Failed to check adapter status:', e);
    }
}

async function sendMessage(panel, channelId, model, input, messagesContainer, button) {
    const text = input.value.trim();
    if (!text) return;

    const history = panelState.get(channelId);

    // Display User Message
    addMessage(messagesContainer, 'user', text);
    input.value = '';
    history.push({ role: 'user', content: text });

    // Disable input during processing and set flag
    processingState.set(channelId, true);
    button.disabled = true;
    input.disabled = true;
    button.textContent = 'Sending...';

    // Add improved loading indicator with animated dots
    const loadingMsg = addMessage(messagesContainer, 'assistant loading', 'AI is thinking<span class="dots"></span>');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel_id: channelId,
                model: model,
                messages: [
                    { role: 'user', content: text }
                ]
            })
        });

        // Remove loading indicator
        loadingMsg.remove();

        const data = await response.json();

        if (response.ok && data.reply) {
            addMessage(messagesContainer, 'assistant', data.reply.content);
            history.push({ role: 'assistant', content: data.reply.content });
        } else if (data.error) {
            const errorMsg = data.code ? `${data.error} (code ${data.code})` : data.error;
            addMessage(messagesContainer, 'error', `⚠️ ${errorMsg}`);
        } else {
            addMessage(messagesContainer, 'error', '⚠️ Unknown error occurred');
        }

    } catch (e) {
        // Remove loading indicator if still present
        if (loadingMsg.parentNode) {
            loadingMsg.remove();
        }
        console.error('Network error:', e);
        addMessage(messagesContainer, 'error', '⚠️ Network error: Unable to connect to server');
    } finally {
        // Re-enable input and clear processing flag
        processingState.set(channelId, false);
        button.disabled = false;
        input.disabled = false;
        button.textContent = 'Send';

        // Immediate refresh after sending
        loadMessages(channelId, messagesContainer);
    }
}

function addMessage(container, role, text, shouldScroll = true) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role.replace(' ', '-')}`;

    // Render Markdown for assistant messages (not for loading or error states)
    if (role === 'assistant' && typeof marked !== 'undefined') {
        const htmlContent = marked.parse(text);
        msgDiv.innerHTML = htmlContent;

        // Apply syntax highlighting to code blocks
        msgDiv.querySelectorAll('pre code').forEach((block) => {
            if (typeof hljs !== 'undefined') {
                hljs.highlightElement(block);
            }
        });

        // Add copy button for assistant messages
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.onclick = () => copyMessage(text, copyBtn);
        msgDiv.appendChild(copyBtn);
    } else {
        // For user messages, errors, and loading - use plain text
        msgDiv.textContent = text;
    }

    container.appendChild(msgDiv);
    if (shouldScroll) {
        container.scrollTop = container.scrollHeight;
    }
    return msgDiv;
}

async function copyMessage(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        const originalText = button.innerHTML;
        button.innerHTML = '✅ Copied!';
        button.classList.add('copied');

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        button.innerHTML = '❌ Failed';
        setTimeout(() => {
            button.innerHTML = '📋 Copy';
        }, 2000);
    }
}
