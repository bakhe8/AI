console.log("AI Kernel UI loaded");

// Check adapter health status on load
updateAdapterStatus();

const panelState = new Map();

document.querySelectorAll('.panel').forEach((panel, index) => {
    const model = panel.dataset.model;
    const channelId = `panel-${index + 1}`;
    const messagesContainer = panel.querySelector('.messages');
    const input = panel.querySelector('input');
    const button = panel.querySelector('button');

    // Add unique ID to panel for easy access if needed
    panel.id = channelId;
    panelState.set(channelId, []);

    // Load existing messages from backend
    loadMessages(channelId, messagesContainer);

    // Auto-refresh messages every 3 seconds
    setInterval(() => loadMessages(channelId, messagesContainer), 3000);

    button.addEventListener('click', () => sendMessage(panel, channelId, model, input, messagesContainer, button));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !button.disabled) {
            sendMessage(panel, channelId, model, input, messagesContainer, button);
        }
    });
});

async function loadMessages(channelId, container) {
    try {
        const response = await fetch(`/api/messages/${channelId}`);
        const data = await response.json();
        
        const currentMessages = panelState.get(channelId) || [];
        const newMessages = data.messages || [];
        
        // Only update if there are new messages
        if (JSON.stringify(currentMessages) !== JSON.stringify(newMessages)) {
            panelState.set(channelId, newMessages);
            
            // Clear container
            container.innerHTML = '';
            
            // Display all messages
            newMessages.forEach(msg => {
                addMessage(container, msg.role, msg.content, false);
            });
            
            // Scroll to bottom only when new messages arrive
            container.scrollTop = container.scrollHeight;
        }
    } catch (e) {
        console.error('Failed to load messages:', e);
    }
}

async function updateAdapterStatus() {
    try {
        const response = await fetch('/api/health');
        const status = await response.json();
        
        // Update status indicators
        document.querySelectorAll('.status-indicator').forEach(indicator => {
            const model = indicator.dataset.status;
            if (status[model]) {
                indicator.className = `status-indicator ${status[model].configured ? 'online' : 'offline'}`;
                indicator.title = status[model].message;
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

    // Disable input during processing
    button.disabled = true;
    input.disabled = true;
    button.textContent = 'Sending...';

    // Add loading indicator
    const loadingMsg = addMessage(messagesContainer, 'assistant loading', 'AI is thinking...');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel_id: channelId,
                model: model,
                messages: history
            })
        });

        // Remove loading indicator
        loadingMsg.remove();

        const data = await response.json();

        if (response.ok && data.reply) {
            addMessage(messagesContainer, 'assistant', data.reply.content);
            history.push({ role: 'assistant', content: data.reply.content });
        } else if (data.error) {
            // Display user-friendly error message
            const errorMsg = data.error.includes('not configured') 
                ? `⚠️ ${model.toUpperCase()}: API key not configured`
                : `⚠️ Error: ${data.error}`;
            addMessage(messagesContainer, 'error', errorMsg);
            history.push({ role: 'assistant', content: errorMsg });
        } else {
            addMessage(messagesContainer, 'error', '⚠️ Unknown error occurred');
            history.push({ role: 'assistant', content: '⚠️ Unknown error occurred' });
        }

    } catch (e) {
        // Remove loading indicator if still present
        if (loadingMsg.parentNode) {
            loadingMsg.remove();
        }
        console.error('Network error:', e);
        addMessage(messagesContainer, 'error', '⚠️ Network error: Unable to connect to server');
        history.push({ role: 'assistant', content: '⚠️ Network error: Unable to connect to server' });
    } finally {
        // Re-enable input
        button.disabled = false;
        input.disabled = false;
        button.textContent = 'Send';
    }
}

function addMessage(container, role, text, shouldScroll = true) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role.replace(' ', '-')}`;
    msgDiv.textContent = text;
    container.appendChild(msgDiv);
    if (shouldScroll) {
        container.scrollTop = container.scrollHeight;
    }
    return msgDiv;
}
