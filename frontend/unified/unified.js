// AI Kernel - Unified Interface JavaScript
class UnifiedInterface {
    constructor() {
        this.currentMode = 'chat';
        this.ws = null;
        this.wsConnected = false;
        this.activeExecution = null;
        this.activeConsultation = null;
        this.activeSelfReading = null;
        this.awaitingCodeInput = false;
        this.awaitingConsultationInput = null;
        this.models = ['openai', 'deepseek']; // Only configured models
        
        // Checkpoint system for undo functionality
        this.checkpoints = [];
        this.maxCheckpoints = 10;
        this.currentCheckpoint = -1;
        
        this.initializeInterface();
        this.initializeWebSocket();
        this.loadAvailableModels();
        this.createInitialCheckpoint();
    }

    initializeInterface() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.messagesArea = document.getElementById('messages');
        this.modeIndicator = document.getElementById('mode-indicator');
        this.activeModels = document.getElementById('active-models');
        this.commandSuggestions = document.getElementById('command-suggestions');
        this.agentStatus = document.getElementById('agent-status');
        this.agentActivity = document.getElementById('agent-activity');
        this.stopAgent = document.getElementById('stop-agent');

        // Event listeners
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.messageInput.addEventListener('input', () => this.handleInput());
        this.stopAgent.addEventListener('click', () => this.handleStop());

        // Command suggestions
        document.querySelectorAll('.suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const command = suggestion.dataset.command;
                this.messageInput.value = command;
                this.messageInput.focus();
                this.commandSuggestions.classList.add('hidden');
            });
        });

        // Welcome message timeout
        setTimeout(() => {
            if (this.messagesArea.children.length === 1) {
                this.addWelcomeHint();
            }
        }, 3000);
    }

    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.connectWebSocket(wsUrl);
    }

    connectWebSocket(url, attempt = 1) {
        try {
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => {
                this.wsConnected = true;
                console.log('WebSocket connected');
                this.updateConnectionStatus(true);
                
                if (attempt > 1) {
                    this.addSystemMessage(`✅ Reconnected successfully after ${attempt} attempts`);
                }
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.ws.onclose = () => {
                this.wsConnected = false;
                this.updateConnectionStatus(false);
                
                // Exponential backoff reconnection
                const delay = Math.min(30000, Math.pow(2, attempt) * 1000);
                console.log(`WebSocket disconnected. Reconnecting in ${delay/1000}s (attempt ${attempt})`);
                
                setTimeout(() => {
                    this.connectWebSocket(url, attempt + 1);
                }, delay);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
        }
    }

    async loadAvailableModels() {
        try {
            const response = await fetch('/api/check-readiness');
            const status = await response.json();
            
            const available = Object.entries(status)
                .filter(([model, ready]) => ready)
                .map(([model]) => model);
            
            this.updateActiveModels(available);
        } catch (error) {
            console.warn('Could not load model status:', error);
            this.updateActiveModels(['mock']); // Fallback to mock
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSend();
        }
    }

    handleInput() {
        const value = this.messageInput.value;
        
        // Show command suggestions for @ commands
        if (value.startsWith('@')) {
            this.commandSuggestions.classList.remove('hidden');
        } else {
            this.commandSuggestions.classList.add('hidden');
        }
    }

    async handleSend() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.messageInput.value = '';
        this.commandSuggestions.classList.add('hidden');
        this.sendButton.disabled = true;

        // Add user message
        this.addMessage('user', message);

        // Handle commands vs regular messages
        if (message.startsWith('@')) {
            await this.handleCommand(message);
        } else {
            await this.handleRegularMessage(message);
        }

        this.sendButton.disabled = false;
    }

    async handleCommand(command) {
        const [cmd, ...args] = command.slice(1).split(' ');
        
        switch (cmd.toLowerCase()) {
            case 'start':
                await this.handleAgentStart(args);
                break;
            case 'consult':
                await this.handleConsultation(args);
                break;
            case 'models':
                await this.showAvailableModels();
                break;
            case 'status':
                await this.showCurrentStatus();
                break;
            case 'stop':
                await this.handleStop();
                break;
            case 'undo':
                await this.handleUndo(args);
                break;
            case 'self-read':
            case 'selfread':
                await this.handleSelfReading(args);
                break;
            case 'help':
                this.showHelp();
                break;
            default:
                this.addSystemMessage(`❌ Unknown command: @${cmd}. Type @help for available commands.`);
        }
    }

    async handleAgentStart(args) {
        this.setMode('agent');
        this.showAgentStatus('🚀 Starting agent analysis...');
        
        // If no arguments provided, ask for code
        if (args.length === 0) {
            this.addSystemMessage(`🤖 **Agent Mode Activated**

**Ready for JavaScript code analysis!**

Please paste your JavaScript code below and I'll analyze it for:
- 🔒 Security vulnerabilities  
- ⚡ Performance issues
- 📝 Code quality patterns
- 🧩 Architecture insights

**Paste your code and press Enter:**`, true);
            
            this.awaitingCodeInput = true;
        } else {
            // If arguments provided, use them as the code directly
            const code = args.join(' ');
            await this.executeAgentAnalysis(code);
        }
    }

    async handleConsultation(args) {
        if (args.length === 0) {
            this.addSystemMessage(`❌ Please provide a question. Example: @consult Is this code secure?`);
            return;
        }
        
        const question = args.join(' ');
        this.setMode('consultation');
        
        this.addSystemMessage(`🔍 **Consultation Mode Activated**

**Question:** ${question}

Please paste code/context for analysis:`, true);
        
        this.awaitingConsultationInput = { question };
    }

    async handleRegularMessage(message) {
        if (this.awaitingCodeInput) {
            await this.executeAgentAnalysis(message);
            this.awaitingCodeInput = false;
            return;
        }
        
        if (this.awaitingConsultationInput) {
            await this.executeConsultation(this.awaitingConsultationInput.question, message);
            this.awaitingConsultationInput = null;
            return;
        }

        // Regular chat mode - send to all models
        await this.sendToAllModels(message);
    }

    async executeAgentAnalysis(code) {
        try {
            this.showAgentStatus('Analyzing code...');
            
            const response = await fetch('/agent/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: 'js-code-audit',
                    input: {
                        type: 'code',
                        content: code
                    }
                })
            });
            
            const result = await response.json();
            this.activeExecution = result.executionId;
            
            this.pollAgentStatus();
            
        } catch (error) {
            this.addSystemMessage(`❌ Agent analysis failed: ${error.message}`);
            this.hideAgentStatus();
        }
    }

    async pollAgentStatus() {
        if (!this.activeExecution) return;
        
        try {
            const response = await fetch(`/agent/status/${this.activeExecution}`);
            const status = await response.json();
            
            this.updateAgentProgress(status);
            
            if (status.status === 'complete') {
                await this.showAgentResults();
                this.hideAgentStatus();
                this.activeExecution = null;
            } else if (status.status === 'error') {
                this.addSystemMessage(`❌ Agent analysis failed: ${status.error || 'Unknown error'}`);
                this.hideAgentStatus();
                this.activeExecution = null;
            } else {
                setTimeout(() => this.pollAgentStatus(), 2000);
            }
            
        } catch (error) {
            this.addSystemMessage(`❌ Failed to get agent status: ${error.message}`);
            this.hideAgentStatus();
        }
    }

    async showAgentResults() {
        try {
            const response = await fetch(`/agent/results/${this.activeExecution}`);
            const results = await response.json();
            
            this.addSystemMessage(`✅ **Agent Analysis Complete**

**Patterns Found:** ${results.results?.patterns?.length || 0}
**Gaps Detected:** ${results.results?.gaps?.length || 0}  
**Contradictions:** ${results.results?.contradictions?.length || 0}

**Analysis Duration:** ${results.stats?.duration || 0}s
**API Calls Made:** ${results.stats?.apiCalls || 0}`, true);

            // Show detailed results in expandable sections
            if (results.results) {
                this.showDetailedResults(results.results);
            }
            
        } catch (error) {
            this.addSystemMessage(`❌ Failed to load results: ${error.message}`);
        }
    }

    showDetailedResults(results) {
        let details = '**📊 Detailed Results:**\n\n';
        
        if (results.patterns && results.patterns.length > 0) {
            details += '**🔍 Patterns:**\n';
            results.patterns.forEach(pattern => {
                details += `- ${pattern.text} (${pattern.frequency})\n`;
            });
            details += '\n';
        }
        
        if (results.gaps && results.gaps.length > 0) {
            details += '**⚠️ Gaps:**\n';
            results.gaps.forEach(gap => {
                details += `- ${gap.text}\n`;
            });
            details += '\n';
        }
        
        if (results.contradictions && results.contradictions.length > 0) {
            details += '**❗ Contradictions:**\n';
            results.contradictions.forEach(contradiction => {
                details += `- ${contradiction.text}\n`;
            });
            details += '\n';
        }
        
        this.addMessage('assistant', details, 'Agent Analysis');
    }

    async handleSelfReading(args) {
        const targetPath = args.join(' ').trim();
        const analysisType = targetPath.startsWith('--comprehensive') ? 'comprehensive' : 'general';
        const actualPath = targetPath.replace('--comprehensive', '').trim() || null;
        
        this.setMode('self-reading');
        this.showAgentStatus('🔍 Starting self-code analysis...');
        
        this.addSystemMessage(`🤖 **Self-Reading Mode Activated**

**Target:** ${actualPath || 'Entire AI Kernel codebase'}
**Analysis:** ${analysisType}
**Protection:** Self-modification prevention enabled

Reading own source code for analysis...`, true);

        try {
            const response = await fetch('/agent/self-reading/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: `unified-self-reading-${Date.now()}`,
                    targetPath: actualPath,
                    analysisType: analysisType
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.activeSelfReading = {
                    executionId: result.executionId,
                    sessionId: result.sessionId,
                    targetPath: result.targetPath,
                    analysisType: result.analysisType
                };
                
                this.addSystemMessage(`✅ **Self-reading started successfully**

**Execution ID:** ${result.executionId}
**Session ID:** ${result.sessionId}
**Analysis Type:** ${result.analysisType}

Monitoring progress...`, true);

                this.pollSelfReadingStatus();
            } else {
                throw new Error(result.error || 'Unknown error');
            }
            
        } catch (error) {
            this.addSystemMessage(`❌ Self-reading failed: ${error.message}`);
            this.hideAgentStatus();
        }
    }

    async pollSelfReadingStatus() {
        if (!this.activeSelfReading) return;
        
        try {
            const response = await fetch(`/agent/status/${this.activeSelfReading.executionId}`);
            const status = await response.json();
            
            this.updateAgentProgress(status);
            
            if (status.status === 'complete') {
                await this.showSelfReadingResults();
                this.hideAgentStatus();
                this.activeSelfReading = null;
            } else if (status.status === 'error') {
                this.addSystemMessage(`❌ Self-reading failed: ${status.error || 'Unknown error'}`);
                this.hideAgentStatus();
                this.activeSelfReading = null;
            } else {
                setTimeout(() => this.pollSelfReadingStatus(), 2000);
            }
            
        } catch (error) {
            this.addSystemMessage(`❌ Failed to get self-reading status: ${error.message}`);
            this.hideAgentStatus();
        }
    }

    async showSelfReadingResults() {
        try {
            const [resultsResponse, sessionResponse] = await Promise.all([
                fetch(`/agent/results/${this.activeSelfReading.executionId}`),
                fetch(`/agent/self-reading/session/${this.activeSelfReading.sessionId}`)
            ]);
            
            const results = await resultsResponse.json();
            const session = await sessionResponse.json();
            
            this.addSystemMessage(`✅ **Self-Reading Analysis Complete**

**Files Analyzed:** ${results.summary?.filesRead || 0}
**Code Chunks:** ${results.summary?.chunksProcessed || 0}
**Total Lines:** ${results.summary?.totalLines || 0}
**Languages:** ${results.summary?.languages?.join(', ') || 'Unknown'}
**Session ID:** ${this.activeSelfReading.sessionId}

**Key Insights:**`, true);

            // Show analysis insights
            if (results.analysis?.insights) {
                let insightsText = '';
                for (const insight of results.analysis.insights) {
                    insightsText += `**${insight.type.toUpperCase()}:** ${insight.insight}\n\n`;
                }
                this.addMessage('assistant', insightsText, 'Self-Analysis Insights');
            }

            // Show architecture overview
            if (results.analysis?.architecture) {
                const arch = results.analysis.architecture;
                const archText = `**Architecture Overview:**

**Modules:** ${Object.keys(arch.modules).length}
${Object.entries(arch.modules).map(([name, info]) => `- **${name}**: ${info.files} files`).join('\n')}

**Layers:** ${Object.keys(arch.layers).join(', ')}

**Code Distribution:**
${Object.entries(arch.layers).map(([layer, count]) => `- **${layer}**: ${count} files`).join('\n')}`;
                
                this.addMessage('assistant', archText, 'Architecture Analysis');
            }

            // Show detailed report if available
            if (results.report) {
                this.addMessage('assistant', this.formatSelfReadingReport(results.report), 'Detailed Report');
            }

            // Show session protection info
            if (session.success && session.selfReading) {
                this.addSystemMessage(`🔒 **Self-Modification Protection Active**

**Snapshot Hash:** ${session.selfReading.snapshotHash}
**Files Read:** ${session.selfReading.filesRead}
**Files Modified:** ${session.selfReading.filesModified}

Any code modifications suggested in this analysis cannot be applied within this session (protection against infinite loops).`, true);
            }
            
        } catch (error) {
            this.addSystemMessage(`❌ Failed to load self-reading results: ${error.message}`);
        }
    }

    formatSelfReadingReport(report) {
        let formatted = `# ${report.title}\n\n`;
        formatted += `**Analysis Type:** ${report.analysisType}\n`;
        formatted += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
        formatted += `${report.summary}\n\n`;
        
        for (const section of report.sections) {
            formatted += `## ${section.title}\n\n${section.content}\n\n`;
        }
        
        return formatted;
    }

    getConversationContext() {
        // Extract recent messages as context
        const messages = Array.from(this.messagesArea.children)
            .slice(-5) // Last 5 messages
            .map(msg => {
                const role = msg.querySelector('.message-role')?.textContent || '';
                const content = msg.querySelector('.message-content')?.textContent || '';
                return { role, content };
            });
        
        return messages;
    }

    async startConsultation(question) {
        try {
            // Get current conversation as context
            const context = this.getConversationContext();
            
            this.showAgentStatus('Starting consultation...');
            
            const response = await fetch('/consult/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question,
                    snapshot: context,
                    models: this.models.filter(m => m !== 'mock')
                })
            });
            
            const result = await response.json();
            this.activeConsultation = result.consultId;
            
            this.pollConsultationStatus();
            
        } catch (error) {
            this.addSystemMessage(`❌ Consultation failed: ${error.message}`);
            this.hideAgentStatus();
        }
    }

    async pollConsultationStatus() {
        if (!this.activeConsultation) return;
        
        try {
            const response = await fetch(`/consult/status/${this.activeConsultation}`);
            const status = await response.json();
            
            const completed = status.models?.filter(m => m.status === 'complete').length || 0;
            const total = status.models?.length || 0;
            
            this.agentActivity.textContent = `Consultation: ${completed}/${total} models complete`;
            
            if (status.status === 'complete') {
                await this.showConsultationResults();
                this.hideAgentStatus();
                this.activeConsultation = null;
            } else if (status.status === 'error') {
                this.addSystemMessage(`❌ Consultation failed`);
                this.hideAgentStatus();
                this.activeConsultation = null;
            } else {
                setTimeout(() => this.pollConsultationStatus(), 2000);
            }
            
        } catch (error) {
            this.addSystemMessage(`❌ Failed to get consultation status: ${error.message}`);
            this.hideAgentStatus();
        }
    }

    async showConsultationResults() {
        try {
            const [transcriptRes, consensusRes] = await Promise.all([
                fetch(`/consult/transcript/${this.activeConsultation}`),
                fetch(`/consult/consensus/${this.activeConsultation}`)
            ]);
            
            const transcript = await transcriptRes.json();
            const consensus = await consensusRes.json();
            
            this.addSystemMessage(`✅ **Consultation Complete**

**Models Consulted:** ${transcript.models?.length || 0}
**Agreement Points:** ${consensus.agreement?.length || 0}
**Disagreements:** ${consensus.disagreements?.length || 0}  
**Gaps Found:** ${consensus.gaps?.length || 0}`, true);

            // Show consensus summary
            this.showConsensusResults(consensus, transcript);
            
        } catch (error) {
            this.addSystemMessage(`❌ Failed to load consultation results: ${error.message}`);
        }
    }

    showConsensusResults(consensus, transcript) {
        // Show model responses
        if (transcript.models) {
            transcript.models.forEach(modelData => {
                const response = modelData.responses?.[0];
                if (response) {
                    this.addMessage('assistant', response.content, `${modelData.model} Response`);
                }
            });
        }
        
        // Show consensus analysis
        let consensusText = '**🎯 Consensus Analysis:**\n\n';
        
        if (consensus.agreement && consensus.agreement.length > 0) {
            consensusText += '**✅ Agreement:**\n';
            consensus.agreement.forEach(item => {
                consensusText += `- ${item}\n`;
            });
            consensusText += '\n';
        }
        
        if (consensus.disagreements && consensus.disagreements.length > 0) {
            consensusText += '**❌ Disagreements:**\n';
            consensus.disagreements.forEach(item => {
                consensusText += `- ${item}\n`;
            });
            consensusText += '\n';
        }
        
        if (consensus.gaps && consensus.gaps.length > 0) {
            consensusText += '**⚠️ Gaps:**\n';
            consensus.gaps.forEach(item => {
                consensusText += `- ${item}\n`;
            });
        }
        
        this.addMessage('assistant', consensusText, 'Consensus Analysis');
    }

    async sendToAllModels(message) {
        this.setMode('chat');
        
        // Send to each model and collect responses
        const availableModels = this.models.filter(model => 
            this.activeModels.textContent.includes(model)
        );
        
        if (availableModels.length === 0) {
            availableModels.push('mock'); // Fallback
        }
        
        this.addSystemMessage(`💬 **Chat Mode** - Sending to ${availableModels.length} models...`, true);
        
        const promises = availableModels.map(async (model, index) => {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channel_id: `unified-${index + 1}`,
                        model: model,
                        messages: [{ role: 'user', content: message }]
                    })
                });
                
                const result = await response.json();
                return { model, response: result.reply?.content || 'No response' };
                
            } catch (error) {
                return { model, response: `Error: ${error.message}` };
            }
        });
        
        const results = await Promise.all(promises);
        
        // Display results
        results.forEach(({ model, response }) => {
            this.addMessage('assistant', response, `${model} Response`);
        });
    }

    async showAvailableModels() {
        try {
            const response = await fetch('/api/check-readiness');
            const status = await response.json();
            
            let modelList = '';
            if (typeof status === 'object' && status !== null) {
                // If it's a status object like {openai: true, deepseek: true}
                const available = Object.entries(status)
                    .filter(([model, ready]) => ready)
                    .map(([model]) => `✅ ${model.toUpperCase()}`)
                    .join('\n');
                
                const unavailable = Object.entries(status)
                    .filter(([model, ready]) => !ready)
                    .map(([model]) => `❌ ${model.toUpperCase()}`)
                    .join('\n');
                    
                modelList = available + (unavailable ? '\n' + unavailable : '');
            } else {
                // If it's just a simple response
                modelList = this.models.map(model => `✅ ${model.toUpperCase()}`).join('\n');
            }
            
            this.addSystemMessage(`🤖 **Available Models:**

${modelList || 'Loading...'}

**Available Commands:**
- Type naturally to chat
- **@start** - Begin agent analysis  
- **@consult <question>** - Multi-model consultation`, true);
            
        } catch (error) {
            console.warn('Could not load model status:', error);
            this.addSystemMessage(`🤖 **Available Models:**

✅ OPENAI
✅ DEEPSEEK

**Status:** Connected (fallback mode)`, true);
        }
    }

    async showCurrentStatus() {
        let status = `📊 **System Status:**

**Mode:** ${this.currentMode.toUpperCase()}
**WebSocket:** ${this.wsConnected ? '✅ Connected' : '❌ Disconnected'}  
**Server:** ${window.location.origin}
**Models:** ${this.models.length} configured`;

        if (this.activeExecution) {
            status += `\n**🔄 Active Agent:** ${this.activeExecution}`;
        }
        
        if (this.activeConsultation) {
            status += `\n**🔄 Active Consultation:** ${this.activeConsultation}`;
        }
        
        if (this.awaitingCodeInput) {
            status += `\n**⏳ Awaiting:** Code input for agent analysis`;
        }
        
        if (this.awaitingConsultationInput) {
            status += `\n**⏳ Awaiting:** Context for consultation`;
        }
        
        // Add current time
        const now = new Date().toLocaleTimeString();
        status += `\n**Time:** ${now}`;
        
        this.addSystemMessage(status, true);
    }

    async handleStop() {
        if (this.activeExecution) {
            this.addSystemMessage('⏹️ Stopping agent analysis...');
            this.activeExecution = null;
        }
        
        if (this.activeConsultation) {
            this.addSystemMessage('⏹️ Stopping consultation...');
            this.activeConsultation = null;
        }
        
        this.hideAgentStatus();
        this.setMode('chat');
        this.awaitingCodeInput = false;
        this.awaitingConsultationInput = null;
    }

    showHelp() {
        const help = `🚀 **AI Kernel Commands:**

**@start** - Begin agent code analysis
**@consult <question>** - Multi-model consultation  
**@models** - Show available models
**@status** - Show current status
**@stop** - Stop current operation
**@self-read [path]** - Read and analyze own source code
**@self-read --comprehensive** - Deep self-analysis
**@undo** - Undo last action
**@undo all** - Undo entire session
**@help** - Show this help

**💬 Regular Messages:**
- Type normally to chat with all models
- Use Shift+Enter for new lines
- Commands start with @

**🤖 Agent Analysis:**
1. Type @start
2. Paste your code when prompted
3. Wait for multi-facet analysis

**🔍 Consultation:**
1. Type @consult followed by your question
2. Paste code/context when prompted  
3. Get consensus from multiple models`;

        this.addSystemMessage(help, true);
    }

    addMessage(role, content, source = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        
        const roleSpan = document.createElement('span');
        roleSpan.className = 'message-role';
        roleSpan.textContent = source || (role === 'user' ? 'You' : 'Assistant');
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString();
        
        headerDiv.appendChild(roleSpan);
        headerDiv.appendChild(timeSpan);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (content.includes('**') || content.includes('#') || content.includes('-')) {
            // Render as markdown
            contentDiv.innerHTML = marked.parse(content);
        } else {
            contentDiv.textContent = content;
        }
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);
        
        this.messagesArea.appendChild(messageDiv);
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
        
        // Create checkpoint for user messages or important assistant responses
        if (role === 'user' || (role === 'assistant' && source)) {
            this.createCheckpoint(`message_${role}`, { 
                source: source,
                preview: content.substring(0, 50) + '...'
            });
        }
    }

    addSystemMessage(content, isMarkdown = false) {
        this.addMessage('system', content, 'System');
    }

    addWelcomeHint() {
        this.addSystemMessage(`💡 **Quick Start:**

Try typing:
- **@help** - See all commands
- **@models** - Check available AI models  
- **Hello** - Chat with all models
- **@start** - Analyze code with agent`, true);
    }

    setMode(mode) {
        this.currentMode = mode;
        this.modeIndicator.textContent = mode.charAt(0).toUpperCase() + mode.slice(1) + ' Mode';
    }

    showAgentStatus(message) {
        this.agentActivity.textContent = message;
        this.agentStatus.classList.remove('hidden');
    }

    hideAgentStatus() {
        this.agentStatus.classList.add('hidden');
    }

    updateAgentProgress(status) {
        if (status.progress) {
            this.agentActivity.textContent = 
                `Analyzing... ${status.progress.current}/${status.progress.total} (${status.progress.phase})`;
        } else {
            this.agentActivity.textContent = `Status: ${status.status}`;
        }
    }

    updateActiveModels(models) {
        this.activeModels.textContent = models.join(', ');
    }

    updateConnectionStatus(connected) {
        // Could show connection indicator in UI
        console.log(`Connection status: ${connected ? 'Connected' : 'Disconnected'}`);
    }

    handleWebSocketMessage(data) {
        if (data.type === 'reply' && data.data) {
            // Handle real-time updates if needed
            console.log('WebSocket update:', data);
        }
    }

    // Checkpoint system for undo functionality
    createCheckpoint(action, data = {}) {
        const checkpoint = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action: action,
            messages: this.messagesArea.innerHTML,
            mode: this.currentMode,
            activeExecution: this.activeExecution,
            activeConsultation: this.activeConsultation,
            data: data
        };

        this.checkpoints.push(checkpoint);
        
        // Keep only last N checkpoints
        if (this.checkpoints.length > this.maxCheckpoints) {
            this.checkpoints.shift();
        }
        
        this.currentCheckpoint = this.checkpoints.length - 1;
        return checkpoint.id;
    }

    createInitialCheckpoint() {
        this.createCheckpoint('initial', { description: 'Session started' });
    }

    async handleUndo(args) {
        if (args.length > 0 && args[0].toLowerCase() === 'all') {
            return this.undoAll();
        }
        
        return this.undoLastAction();
    }

    undoLastAction() {
        if (this.checkpoints.length <= 1) {
            this.addSystemMessage('❌ Nothing to undo - this is the initial state.');
            return;
        }

        // Get previous checkpoint
        const previousCheckpoint = this.checkpoints[this.checkpoints.length - 2];
        this.restoreCheckpoint(previousCheckpoint);
        
        this.addSystemMessage(`↶ **Undid last action**
        
**Restored to:** ${new Date(previousCheckpoint.timestamp).toLocaleTimeString()}
**Action:** ${previousCheckpoint.action}`, true);
    }

    undoAll() {
        if (this.checkpoints.length <= 1) {
            this.addSystemMessage('❌ Nothing to undo - already at initial state.');
            return;
        }

        // Restore to first checkpoint
        const initialCheckpoint = this.checkpoints[0];
        this.restoreCheckpoint(initialCheckpoint);
        
        this.addSystemMessage(`↶ **Undid entire session**
        
**Restored to:** Session start
**Actions undone:** ${this.checkpoints.length - 1}`, true);
        
        // Reset checkpoints
        this.checkpoints = [initialCheckpoint];
        this.currentCheckpoint = 0;
    }

    restoreCheckpoint(checkpoint) {
        // Stop any active operations
        this.activeExecution = null;
        this.activeConsultation = null;
        this.awaitingCodeInput = false;
        this.awaitingConsultationInput = null;
        
        // Restore UI state
        this.messagesArea.innerHTML = checkpoint.messages;
        this.setMode(checkpoint.mode);
        this.hideAgentStatus();
        
        // Restore operational state
        this.activeExecution = checkpoint.activeExecution;
        this.activeConsultation = checkpoint.activeConsultation;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiKernel = new UnifiedInterface();
});