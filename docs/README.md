# AI Cognitive Agent System - Documentation Index

**Project Status:** Production Ready ✅  
**Tests:** 98/98 passing (100%)  
**Phases:** 0, 1, 2, 3 Complete

---

## 🎯 What This System Does

### Two Modes:

**1. Chat Mode** (`/`)
- Traditional AI chat interface
- 4 models in parallel (OpenAI, Gemini, DeepSeek, Copilot)
- Real-time responses
- For: Quick questions, exploration

**2. Agent Mode** (`/agent-ui/`)
- **Structured code analysis**
- Multi-model measurement (Layer 1)
- Pattern detection, gap finding, contradictions
- Professional reports (measurements ONLY)
- For: Code audits, security analysis

---

## 🚀 Quick Start

### Start Server:
```bash
cd backend
npm start
```

Server runs on `http://localhost:3000`

### Use Chat Mode:
1. Open `http://localhost:3000/`
2. Type message in any panel
3. Get responses from all models

### Use Agent Mode:
1. Open `http://localhost:3000/agent-ui/`
2. Select task (e.g., "JavaScript Code Audit")
3. Paste code or upload .js file
4. Click "Run Analysis"
5. View results in tabs

---

## 📚 Documentation

### Essential Reading:

**[API.md](./API.md)** ⭐ START HERE for Agent API
- REST endpoints
- Request/response examples
- Integration guide

**[quick-start.md](./quick-start.md)** - Setup & usage
- Installation (5 min)
- Chat mode usage
- Agent mode usage

### Layer Compliance (Critical):

**[LAYER-SEPARATION-GUIDE.md](./LAYER-SEPARATION-GUIDE.md)** ⚠️ MUST READ
- Layer 1 vs Layer 2 boundaries
- What Agent does vs doesn't do
- Compliance rules

**[AGENT-OUTPUT-EXAMPLE.md](./AGENT-OUTPUT-EXAMPLE.md)** - Real Agent output
- Measurements ONLY format
- Reference for Layer 1

### Architecture & Design:

**[agent-evolution/](./agent-evolution/)** - Technical docs (9 files)
- Architecture design
- Contracts
- Implementation details

### Reports (Management/Human Layer 2):

**[PROJECT-MANAGEMENT-REPORT.md](./PROJECT-MANAGEMENT-REPORT.md)** ⚠️ Human only
- Project completion report
- Contains ratings, recommendations
- NOT Agent output

---

## 🔍 Chat vs Agent - Key Differences

| Feature | Chat Mode | Agent Mode |
|---------|-----------|------------|
| **Purpose** | Quick Q&A | Code analysis |
| **Input** | Text message | Code file |
| **Output** | Free-form text | Structured report |
| **Models** | All 4 (parallel) | All 3 (orchestrated) |
| **Format** | Conversation | Measurements |
| **Use Case** | Exploration | Audit |
| **Layer** | N/A | **Layer 1 ONLY** |

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── adapters/       # AI model adapters (5)
│   ├── agent/          # Agent System (Phase 0-3)
│   │   ├── core/       # Orchestrator, state
│   │   ├── facets/     # Analysis facets (3)
│   │   ├── tasks/      # Task definitions
│   │   ├── analyzer/   # Pattern/gap detection
│   │   ├── reports/    # Report generation
│   │   └── service.js  # API service layer
│   ├── api/            # REST controllers
│   ├── core/           # Kernel core
│   └── server.js       # Express server

frontend/
├── index.html          # Chat UI
├── app.js
├── styles.css
└── agent/              # Agent UI
    ├── index.html
    ├── agent.js
    └── agent.css
```

---

## ⚙️ Configuration

### Environment Variables:
```env
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
GITHUB_TOKEN=your_token
HEALTH_TOKEN=your_secret
```

### Health Indicators:
Set in browser console:
```javascript
localStorage.setItem('health_token', 'your_secret');
```

---

## 🧪 Testing

```bash
# All tests
npm test

# Specific file
npm test -- path/to/file.test.js

# Watch mode
npm run test:watch
```

**Current:** 98/98 tests passing (100%)

---

## 🎯 Use Cases

### Internal Use Only:
- Code review automation
- Security audits
- Performance analysis
- Quality checks

**NOT for:**
- External users
- Production deployment (auth needed)
- Billing/monetization

---

## 📖 Quick Reference

### Chat Mode:
```
Open: http://localhost:3000/
Use: Type message → Enter
Models: 4 in parallel
```

### Agent Mode:
```
Open: http://localhost:3000/agent-ui/
Use: Paste code → Run Analysis → View tabs
Models: 3 orchestrated (security, performance, quality)
Output: Patterns, Gaps, Contradictions, Metrics
```

### API:
```
POST /agent/execute    - Start analysis
GET  /agent/status/:id - Poll status  
GET  /agent/results/:id - Get results
GET  /agent/tasks      - List tasks
```

See [API.md](./API.md) for details.

---

## ⚠️ Important Notes

1. **Layer 1 Compliance**
   - Agent produces measurements ONLY
   - NO ratings, NO recommendations
   - See LAYER-SEPARATION-GUIDE.md

2. **Internal Use**
   - No authentication (add if deploying)
   - No rate limiting (add if needed)
   - No billing

3. **Performance**
   - Analysis takes 10-30s (3 models × 3 facets)
   - Status updates every 1s
   - Results cached in memory

---

**Need Help?**
- API: See [API.md](./API.md)
- Examples: See [quick-start.md](./quick-start.md)
- Architecture: See [agent-evolution/](./agent-evolution/)
