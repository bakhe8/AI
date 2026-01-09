# 📝 ملخص العقود (Contracts)

هذا المستند يجمع جميع العقود (Contracts) المطلوبة للتواصل بين الطبقات.

---

## 1️⃣ Agent Task Contract

**الغرض:** تعريف Agent Task

```typescript
interface AgentTask {
  // التعريف
  id: string;                    // 'js-code-audit'
  name: string;                  // 'JavaScript Security Audit'
  description: string;
  
  // الإعدادات
  facets: string[];              // ['security', 'performance']
  models: string[];              // ['openai', 'gemini', 'deepseek']
  rounds: number;                // 1 or 2
  
  // الدوال
  buildRound1Prompt(facet: string, input: any): Prompt;
  buildRound2Prompt(facet: string, round1: any, gaps: any): Prompt;
  analyzeResponse(responses: Response[]): Analysis;
  
  // الإخراج
  outputFormat: 'markdown' | 'json' | 'structured';
}
```

---

## 2️⃣ Facet Definition Contract

```typescript
interface Facet {
  id: string;                    // 'security'
  name: string;                  // 'Security Analysis'
  systemPrompt: string;          // Domain-specific instructions
  constraints: string[];         // Rules to follow
  examples: Example[];           // Few-shot examples
  outputFormat: string;          // Expected format
}
```

---

## 3️⃣ Agent Prompt Contract

**من Agent → Kernel Client**

```typescript
interface AgentPrompt {
  system: string;                // System message
  user: string;                  // User message
  examples?: Example[];          // Optional few-shot
}
```

---

## 4️⃣ Kernel Request Contract  

**من Kernel Client → AI Kernel**

```typescript
interface KernelRequest {
  channel_id: string;            // 'agent-{taskId}-{facet}-{model}-r{round}'
  model: string;                 // 'openai' | 'gemini' | ...
  messages: Message[];           // Conversation history
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

---

## 5️⃣ Kernel Response Contract

**من AI Kernel → Kernel Client**

```typescript
interface KernelResponse {
  channel_id: string;
  model: string;
  reply: {
    role: 'assistant';
    content: string;
  };
}
```

---

## 6️⃣ Model Response Contract

**من Kernel Client → Agent**

```typescript
interface ModelResponse {
  model: string;                 // 'openai'
  content: string;               // AI response text
  metadata: {
    taskId: string;
    facet: string;
    round: number;
    timestamp: string;
  };
  error?: string;                // If failed
}
```

---

## 7️⃣ Analysis Contract

```typescript
interface Analysis {
  patterns: Pattern[];           // Common findings
  gaps: Gap[];                   // Missing coverage
  contradictions: Contradiction[];
  confidence: number;            // 0-1
}

interface Pattern {
  text: string;                  // 'SQL Injection'
  models: string[];              // ['openai', 'gemini', 'deepseek']
  frequency: number;             // 3/3
}

interface Gap {
  model: string;                 // 'openai'
  missing: string;               // 'CSRF not mentioned'
  severity: 'low' | 'medium' | 'high';
}
```

---

## 8️⃣ Agent Response Contract

**من Agent → Frontend**

```typescript
interface AgentResponse {
  status: 'running' | 'analyzing' | 'complete' | 'error';
  taskId: string;
  
  progress?: {
    current: number;
    total: number;
    phase: string;
  };
  
  results?: {
    round1: ModelResponse[];
    analysis: Analysis;
    round2?: ModelResponse[];
    report: Report;
  };
  
  error?: {
    message: string;
    phase: string;
    details: any;
  };
  
  stats: {
    duration: number;            // seconds
    apiCalls: number;
    tokensUsed: number;
  };
}
```

---

## 9️⃣ Raw Report Contract (Layer 1 Only)

> [!IMPORTANT]
> **Layer 1 Report = Measurements Only**
> - No recommendations
> - No severity judgments  
> - No interpretations
> 
> See [`SYSTEM_CONTRACT.md`](../SYSTEM_CONTRACT.md) for details.

```typescript
interface RawReport {
  // Structured measurements
  measurements: {
    patterns: PatternMeasurement[];
    gaps: GapMeasurement[];
    contradictions: ContradictionMeasurement[];
  };
  
  // Raw findings (what models said)
  raw_findings: {
    [facet: string]: RawFinding[];
  };
  
  // Statistics (counts only)
  stats: {
    total_patterns: number;
    model_agreement: { [pattern: string]: number };  // e.g. "SQL Injection": 3/3
    coverage: { [model: string]: number };
  };
  
  // Metadata
  metadata: {
    taskId: string;
    timestamp: string;
    models: string[];
    facets: string[];
  };
  
  // Formatted output
  markdown: string;              // Presentation of raw data
}

interface RawFinding {
  text: string;                  // What the model said
  model: string;                 // Which model
  location?: string;             // Where (if mentioned)
  // NO severity - that's interpretation!
  // NO recommendations - that's Layer 2!
}

interface PatternMeasurement {
  text: string;                  // "SQL Injection"
  models: string[];              // ["openai", "gemini", "deepseek"]
  frequency: number;             // 3/3
  locations: string[];           // ["line 45", "line 78"]
}
```

---

## 🔄 Data Flow Example

```
1. User Request
{
  taskType: 'js-code-audit',
  input: '<code>'
}

2. Agent Task Loaded
{
  id: 'js-code-audit',
  facets: ['security', 'performance'],
  models: ['openai', 'gemini']
}

3. Agent Prompt Built
{
  system: 'You are a security auditor...',
  user: 'Find ONLY security issues:\n<code>'
}

4. Kernel Request
{
  channel_id: 'agent-task1-security-openai-r1',
  model: 'openai',
  messages: [
    { role: 'system', content: '...' },
    { role: 'user', content: '...' }
  ]
}

5. Kernel Response
{
  channel_id: 'agent-task1-security-openai-r1',
  model: 'openai',
  reply: {
    role: 'assistant',
    content: 'Issue 1: SQL Injection...'
  }
}

6. Model Response
{
  model: 'openai',
  content: 'Issue 1: SQL Injection...',
  metadata: { taskId, facet, round, timestamp }
}

7. Analysis
{
  patterns: [{ text: 'SQL Injection', models: ['openai', 'gemini'] }],
  gaps: [{ model: 'openai', missing: 'XSS check' }],
  confidence: 0.9
}

8. Agent Response
{
  status: 'complete',
  results: {
    round1: [...],
    analysis: {...},
    report: {...}
  }
}
```

---

## ✅ Validation Rules

### **Agent Task:**
- ✅ Must have unique `id`
- ✅ Must have at least 1 facet
- ✅ Must have at least 1 model
- ✅ `buildRound1Prompt` is required

### **Kernel Request:**
- ✅ `channel_id` must be unique
- ✅ `model` must be valid
- ✅ `messages` must not be empty

### **Agent Response:**
- ✅ `status` must be valid enum
- ✅ If `complete`, `results` required
- ✅ If `error`, `error` object required

---

**السابق:** [← README.md](./README.md)
