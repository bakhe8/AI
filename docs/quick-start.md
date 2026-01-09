# 🚀 Quick Start Guide - AI Cognitive Agent System

**Last Updated:** 2026-01-09  
**Status:** Production Ready ✅

---

## ⚡ Quick Setup (5 minutes)

### **1. Install Dependencies:**
```bash
cd backend
npm install
```

### **2. Configure API Keys:**
Create `.env` file in `backend/` directory:
```env
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
GITHUB_TOKEN=your_github_token_here  # For Copilot
HEALTH_TOKEN=your_secret_health_token
```

### **3. Start the Kernel:**
```bash
npm start
```

Server will run on `http://localhost:3000`

---

## 🎯 Using the Agent System

### **Example 1: Analyze Code for Security Issues**

```javascript
import { AgentOrchestrator } from './src/agent/core/orchestrator.js';
import taskRegistry from './src/agent/tasks/task-registry.js';
import { JSCodeAuditTask } from './src/agent/tasks/implementations/js-code-audit.task.js';

// 1. Register the task
const task = new JSCodeAuditTask();
taskRegistry.register(task.toConfig());

// 2. Create orchestrator
const orchestrator = new AgentOrchestrator();

// 3. Code to analyze
const vulnerableCode = `
function authenticateUser(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    
    // SQL Injection vulnerability!
    const query = "SELECT * FROM users WHERE username = '" + username + 
                  "' AND password = '" + password + "'";
    
    db.query(query, (err, results) => {
        if (results.length > 0) {
            res.json({ success: true });
        }
    });
}
`;

// 4. Run analysis
const result = await orchestrator.executeTask('js-code-audit', vulnerableCode);

// 5. View results
if (result.status === 'complete') {
    console.log('✅ Analysis complete!');
    console.log('\n📊 Summary:', result.results.report.summary);
    console.log('\n📝 Full Report:\n', result.results.report.markdown);
    console.log('\n🔍 Patterns found:', result.results.analysis.patterns);
}
```

### **Example 2: Check Analysis Results**

```javascript
const result = await orchestrator.executeTask('js-code-audit', code);

// Check patterns (cross-model agreement)
result.results.analysis.patterns.forEach(pattern => {
    console.log(`Pattern: "${pattern.text}"`);
    console.log(`Mentioned by: ${pattern.models.join(', ')}`);
    console.log(`Frequency: ${pattern.frequency}\n`);
});

// Check gaps (what some models found but others missed)
result.results.analysis.gaps.forEach(gap => {
    console.log(`Gap in ${gap.facet}: "${gap.topic}"`);
    console.log(`Found by: ${gap.mentionedBy.join(', ')}`);
    console.log(`Missed by: ${gap.missedBy.join(', ')}\n`);
});

// Check contradictions
result.results.analysis.contradictions.forEach(c => {
    console.log(`Contradiction in ${c.facet}:`);
    console.log(`Group A (${c.type}): ${c.modelsA.join(', ')}`);
    console.log(`Group B: ${c.modelsB.join(', ')}\n`);
});
```

---

## 🧪 Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- src/agent/__tests__/orchestrator.test.js

# With coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

---

## 📊 Understanding the Results

### **Analysis Structure:**
```json
{
  "status": "complete",
  "taskId": "exec-js-code-audit-1234567890",
  "results": {
    "round1": [...],      // Raw responses from all models
    "analysis": {
      "patterns": [...],  // Cross-model agreements
      "gaps": [...],      // Missed topics
      "contradictions": [...],
      "coverage": {...}   // Success rates per facet
    },
    "report": {
      "metadata": {...},
      "summary": {...},
      "measurements": {...},
      "markdown": "..."   // Full report as markdown
    }
  },
  "stats": {
    "duration": 15420,    // milliseconds
    "apiCalls": 9         // 3 facets × 3 models
  }
}
```

---

## 🎨 Creating Custom Tasks

```javascript
import { BaseTask } from './src/agent/tasks/base-task.js';

class MyCustomTask extends BaseTask {
    constructor() {
        super({
            id: 'my-task',
            name: 'My Custom Analysis',
            description: 'Describe what this task does',
            facets: ['security', 'performance'],  // Which facets to use
            models: ['openai', 'gemini'],         // Which models
            rounds: 1,
            outputFormat: 'markdown'
        });
    }

    buildRound1Prompt(facet, input) {
        // Build prompt for this facet
        return {
            system: 'You are an expert...',
            user: `Analyze this: ${input}`
        };
    }
}

// Register and use
const myTask = new MyCustomTask();
taskRegistry.register(myTask.toConfig());
await orchestrator.executeTask('my-task', 'your input here');
```

---

## 🔧 Configuration

### **Models Available:**
- `openai` - GPT-4/3.5
- `gemini` - Google Gemini
- `deepseek` - DeepSeek AI
- `copilot` - GitHub Copilot (via GitHub API)
- `mock` - For testing (returns predefined responses)

### **Facets Available:**
- `security` - Security vulnerabilities
- `performance` - Performance issues
- `quality` - Code quality & maintainability

---

## ⚙️ Advanced Usage

### **Parallel Execution:**
```javascript
// Analyze multiple code snippets
const codes = [code1, code2, code3];
const results = await Promise.all(
    codes.map(code => orchestrator.executeTask('js-code-audit', code))
);
```

### **Using Specific Models:**
```javascript
// Modify task to use only specific models
const customTask = {
    ...task.toConfig(),
    models: ['openai', 'gemini']  // Only these two
};
taskRegistry.register(customTask);
```

---

## 📖 API Reference

### **AgentOrchestrator**
```javascript
class AgentOrchestrator {
    constructor(kernelBaseUrl = 'http://localhost:3000')
    
    async executeTask(taskId, input)
    // Returns: { status, taskId, results, stats }
}
```

### **Task Registry**
```javascript
taskRegistry.register(taskConfig)
taskRegistry.get(taskId)
taskRegistry.list()
taskRegistry.has(taskId)
```

---

## 🐛 Troubleshooting

### **Issue: API Keys Not Working**
```bash
# Verify .env file exists
ls backend/.env

# Check if keys are loaded
node -e "require('dotenv').config(); console.log(process.env.OPENAI_API_KEY ? 'OK' : 'Missing')"
```

### **Issue: Tests Failing**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Run specific test
npm test -- src/agent/__tests__/orchestrator.test.js
```

### **Issue: Port 3000 Already in Use**
```bash
# Find process
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <process_id> /F

# Or change port in server.js
```

---

## 📞 Support

- **Documentation:** See `docs/agent-evolution/` folder
- **Examples:** Check `src/agent/__tests__/e2e.test.js`
- **Architecture:** Read `docs/agent-evolution/02-target-architecture.md`

---

**Happy Analyzing! 🚀**
