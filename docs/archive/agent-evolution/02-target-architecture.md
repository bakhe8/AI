# 🏛️ البنية المستهدفة: Cognitive Agent System

## 🎯 الرؤية

تحويل AI Kernel من **أداة اتصال بسيطة** إلى **نظام وكيل معرفي متكامل** يمكنه:
1. فهم المهام المعقدة
2. تقسيمها إلى أوجه (Facets)
3. تنسيق نماذج متعددة
4. تحليل النتائج
5. إنتاج رؤى قيّمة

---

## 🏗️ البنية الكاملة

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│                                                               │
│  ┌──────────────────┐       ┌──────────────────┐            │
│  │   Chat Mode      │       │   Agent Mode     │            │
│  │ (Direct Kernel)  │       │ (Via Agent)      │            │
│  └──────────────────┘       └──────────────────┘            │
└─────────────┬───────────────────────┬───────────────────────┘
              │                       │
              │                       │
      ┌───────┘                       └───────┐
      │                                       │
      │ Direct                          Agent │
      │ Access                          Access│
      ▼                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Orchestrator                        │
│                    (NEW - Intelligence Layer)                │
│                                                               │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │Task Manager  │ Facet System │  Prompt      │            │
│  │              │              │  Builder     │            │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                               │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │  Analyzer    │ Pattern      │  Report      │            │
│  │              │ Detector     │  Generator   │            │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                               │
│  ┌───────────────────────────────────────────┐              │
│  │        Kernel Client (Bridge)             │              │
│  └───────────────────────────────────────────┘              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI Kernel                               │
│                 (EXISTING - Infrastructure)                  │
│                                                               │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │   Router     │   Contract   │   Memory     │            │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                               │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │   Logger     │ Error Handler│ Health Check │            │
│  └──────────────┴──────────────┴──────────────┘            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Adapter Layer                             │
│                                                               │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ OpenAI   │  Gemini  │ DeepSeek │ Copilot  │             │
│  │ Adapter  │  Adapter │  Adapter │  Adapter │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Layer 1 Hard Constraint (Non-Negotiable)

> [!CAUTION]
> **هذا النظام = Layer 1 فقط (Measurement Layer)**
> 
> **ممنوع منعاً باتاً:**
> ```
> ❌ Analyzer يُحلل → لا يُفسر
> ❌ Pattern Detector يكتشف → لا يُقيّم
> ❌ Gap Finder يُسجل → لا يُوصي
> ❌ Report Generator يُوثق → لا يحكم
> ```
> 
> **الفرق الحاسم:**
> ```javascript
> // ✅ Layer 1 (مسموح)
> {
>   pattern: "SQL Injection",
>   found_by: ["openai", "gemini", "deepseek"],
>   frequency: 3/3
> }
> 
> // ❌ Layer 1 (ممنوع!)
> {
>   issue: "SQL Injection",
>   severity: "critical",           ← تقييم ممنوع
>   recommendation: "Use prepared statements"  ← توصية ممنوعة
> }
> ```
> 
> **Layer 2 (المستقبل)** سيفعل التفسير والتوصيات.  
> **Layer 1 (هذا المشروع)** يُقيس فقط.
> 
> **المرجع:** [`SYSTEM_CONTRACT.md`](../../docs/SYSTEM_CONTRACT.md) - Source of Truth

---

## 📦 مكونات Agent Layer الجديدة

### **1. Agent Orchestrator** (القائد)

**المسؤوليات:**
```javascript
class AgentOrchestrator {
  async executeTask(taskConfig, input) {
    // 1. Initialize
    // 2. Execute Round 1
    // 3. Analyze
    // 4. Execute Round 2 (if needed)
    // 5. Generate Report
  }
}
```

**الخصائص:**
- ✅ ينسّق بين جميع المكونات
- ✅ يدير تدفق العمل (Workflow)
- ✅ يتخذ قرارات (متى Round 2؟ أي Models؟)

---

### **2. Task Manager** (مدير المهام)

**المسؤوليات:**
```javascript
class TaskManager {
  registerTask(task) { }
  getTask(taskId) { }
  validateTask(task) { }
}
```

**Tasks المخطط لها:**
- `js-code-audit` - مراجعة كود JavaScript
- `api-design-review` - مراجعة تصميم API
- `security-scan` - فحص أمني
- `performance-analysis` - تحليل أداء

**البنية:**
```javascript
{
  id: 'js-code-audit',
  name: 'JavaScript Security Audit',
  facets: ['security', 'performance', 'quality'],
  models: ['openai', 'gemini', 'deepseek'],
  rounds: 2,
  promptBuilder: Function,
  analyzer: Function
}
```

---

### **3. Facet System** (نظام الأوجه)

**الفكرة:**
كل مهمة لها **أوجه متعددة** (Security, Performance, Quality, etc.)

**المثال:**
```javascript
// Code Audit Task
facets = [
  {
    id: 'security',
    name: 'Security Issues',
    systemPrompt: 'You are a security auditor. Find ONLY security vulnerabilities.',
    constraints: [
      'List issues only, no explanations',
      'Use this format: Issue: ... | Location: ... | Severity: ...'
    ],
    examples: [...]
  },
  {
    id: 'performance',
    name: 'Performance Problems',
    systemPrompt: 'You are a performance expert. Find ONLY performance issues.',
    constraints: [...]
  }
]
```

**الفوائد:**
- ✅ Domain Lock واضح
- ✅ قابل لإعادة الاستخدام
- ✅ سهل التوسع

---

### **4. Prompt Builder** (بناء الأوامر)

**المسؤوليات:**
```javascript
class PromptBuilder {
  buildRound1Prompt(facet, input) {
    return {
      system: facet.systemPrompt,
      user: `${facet.constraints.join('\n')}\n\nCode:\n${input}`,
      examples: facet.examples
    };
  }
  
  buildRound2Prompt(facet, round1Results, gaps) {
    return {
      system: facet.systemPrompt,
user: `Previous analysis found: ${round1Results}
        
        Gaps identified: ${gaps.join('\n')}
        
        Focus on these specific areas...`
    };
  }
}
```

**الميزات:**
- ✅ Domain Lock enforcement
- ✅ Few-shot examples
- ✅ Context injection

---

### **5. Analyzer** (المحلل)

**المسؤوليات:**
```javascript
class ResponseAnalyzer {
  analyze(responses) {
    return {
      patterns: this.detectPatterns(responses),
      gaps: this.findGaps(responses),
      contradictions: this.checkContradictions(responses),
      confidence: this.calculateConfidence(responses)
    };
  }
  
  detectPatterns(responses) {
    // Find common issues across models
  }
  
  findGaps(responses) {
    // Find what one model mentioned but others missed
  }
  
  checkContradictions(responses) {
    // Find conflicting statements
  }
}
```

**الخوارزميات:**
- Pattern Detection: استخراج القواسم المشتركة
- Gap Analysis: مقارنة التغطية
- Contradiction Checking: كشف التناقضات
- Confidence Scoring: حساب الثقة

---

### **6. Report Generator** (مولد التقارير الخام)

> [!IMPORTANT]
> **Layer 1 Report = Raw Measurements فقط**
> 
> لا يحتوي على:
> - ❌ Recommendations
> - ❌ Severity judgments
> - ❌ Executive decisions
> 
> يحتوي فقط على:
> - ✅ Structured measurements
> - ✅ What each model said
> - ✅ Pattern frequencies
> - ✅ Gap annotations

**المسؤوليات:**
```javascript
class ReportGenerator {
  generateRawReport(round1, round2, analysis) {
    return {
      // قياسات فقط - لا أحكام
      measurements: {
        byFacet: this.groupByFacet(round1, round2),
        patterns: analysis.patterns,      // تكرارات فقط
        gaps: analysis.gaps,              // ما فات كل نموذج
        contradictions: analysis.contradictions
      },
      
      // بيانات منظمة - لا تفسير
      raw_findings: this.extractFindings(round1, round2),
      
      // إحصائيات - لا تقييم
      stats: {
        total_findings: Number,
        pattern_frequency: Object,
        model_coverage: Object
      },
      
      markdown: this.toMarkdown()  // عرض البيانات فقط
    };
  }
}
```

**قالب التقرير الخام (Raw Report):**
```markdown
# Raw Measurement Report: Security Analysis

## Data Collection Summary
- Models Queried: 3 (OpenAI, Gemini, DeepSeek)
- Facets Analyzed: Security
- Rounds Completed: 2

## Pattern Measurements (Frequency Count)

### Security Facet
**Pattern: "SQL Injection"**
- Mentioned by: OpenAI ✓, Gemini ✓, DeepSeek ✓
- Frequency: 3/3 models
- Location mentioned: Line 45 (by all)
- **Note:** High agreement = strong pattern

**Pattern: "XSS Vulnerability"**  
- Mentioned by: Gemini ✓, DeepSeek ✓
- Frequency: 2/3 models
- Location: Line 78
- **Gap:** OpenAI did not mention this

### Performance Facet
...

## Cross-Model Measurements
- **Common Patterns:** SQL Injection (3/3), XSS (2/3)
- **Unique Findings:** 
  - OpenAI only: "Race condition on line 92"
  - Gemini only: "Memory leak potential"
- **Contradictions:** None detected

## Data Summary
- Total patterns identified: 5
- Models in full agreement: 1 pattern
- Gaps requiring Round 2: 3
```

---

## 🔄 Data Flow الكامل

### **Scenario: Code Audit**

```
1. User Input
   ↓
   User: "Audit this JavaScript code"
   Code: <paste code>
   
2. Frontend → Agent Mode
   ↓
   POST /api/agent/execute
   {
     taskType: 'js-code-audit',
     input: <code>
   }

3. Agent Orchestrator
   ↓
   - Load task: js-code-audit
   - Facets: [security, performance, quality]
   - Models: [openai, gemini, deepseek]

4. Round 1 (Parallel)
   ↓
   For each facet:
     For each model:
       - Build constrained prompt
       - Send via Kernel
       - Collect response
   
   Results:
   {
     security: {
       openai: [...],
       gemini: [...],
       deepseek: [...]
     },
     performance: {...},
     quality: {...}
   }

5. Analysis
   ↓
   - Patterns: [SQL Injection, XSS] (all 3 agree)
   - Gaps: {
       openai: [missed CSRF],
       gemini: [missed rate limiting]
     }
   - Contradictions: None

6. Round 2 (Targeted)
   ↓
   For each gap:
     - Build focused prompt
     - Ask specific model
     - Get deeper insight

7. Report Generation
   ↓
   - Combine Round 1 + Round 2
   - Apply templates
   - Calculate confidence
   
8. Response to User
   ↓
   {
     status: 'complete',
     report: <markdown>,
     findings: {...},
     confidence: 0.87
   }

9. UI Display
   ↓
   - Show in panels:
     Panel 1: OpenAI findings
     Panel 2: Gemini findings
     Panel 3: DeepSeek findings
     Panel 4: Combined report
```

---

## 🗂️ الهيكل الملفي الجديد

```
backend/
├── src/
│   ├── agent/                    ← NEW
│   │   ├── core/
│   │   │   ├── orchestrator.js
│   │   │   ├── kernel-client.js
│   │   │   └── state-manager.js
│   │   ├── tasks/
│   │   │   ├── task-registry.js
│   │   │   ├── base-task.js
│   │   │   └── implementations/
│   │   │       ├── js-code-audit.task.js
│   │   │       └── api-design-review.task.js
│   │   ├──facets/
│   │   │   ├── facet-library.js
│   │   │   └── definitions/
│   │   │       ├── security.facet.js
│   │   │       ├── performance.facet.js
│   │   │       └── quality.facet.js
│   │   ├── prompts/
│   │   │   ├── prompt-builder.js
│   │   │   └── templates/
│   │   ├── analyzer/
│   │   │   ├── response-analyzer.js
│   │   │   ├── pattern-detector.js
│   │   │   ├── gap-finder.js
│   │   │   └── contradiction-checker.js
│   │   ├── reports/
│   │   │   ├── report-generator.js
│   │   │   └── templates/
│   │   │       └── audit-report.template.md
│   │   ├── contracts/
│   │   │   ├── agent-task.contract.js
│   │   │   └── agent-response.contract.js
│   │   └── __tests__/
│   │       ├── orchestrator.test.js
│   │       └── analyzer.test.js
│   ├── api/
│   │   ├── chat.controller.js     ← EXISTING
│   │   └── agent.controller.js     ← NEW
│   └── core/                       ← EXISTING (no changes)
│       ├── contract.js
│       ├── router.js
│       └── ...
```

---

## 🔌 API الجديدة

### **Agent Endpoints:**

```javascript
// Execute Agent Task
POST /api/agent/execute
{
  taskType: 'js-code-audit',
  input: '<code>',
  options: {
    models: ['openai', 'gemini'],  // optional
    facets: ['security', 'performance'],  // optional
    rounds: 2  // optional
  }
}

Response:
{
  taskId: 'task-123',
  status: 'complete',
  report: {...},
  runtime: '45s'
}

// Get Task Status
GET /api/agent/tasks/:taskId

// List Available Tasks
GET /api/agent/tasks

// Get Task History
GET /api/agent/history
```

---

## 📊 الفرق بين الوضعين

### **Chat Mode (الحالي):**
```
Request → Kernel → Model → Response
```
- ⚡ سريع (ثوانٍ)
- 🎯 مباشر
- 💬 محادثة حرة

### **Agent Mode (الجديد):**
```
Request → Agent → Task → Facets → Models (via Kernel) 
        → Analysis → Report
```
- 🧠 ذكي (دقائق)
- 📊 تحليلي
- 📋 تقرير منظم

---

## ✅ مبادئ التصميم

### **1. Separation of Concerns**
```
Agent = Intelligence
Kernel = Infrastructure
```

### **2. Single Responsibility**
كل component له مسؤولية واحدة واضحة

### **3. Open/Closed Principle**
- Open for extension (إضافة Tasks/Facets جديدة)
- Closed for modification (لا نغير Kernel)

### **4. Dependency Inversion**
```
Agent → Interface → Kernel
(لا يعتمد Agent مباشرة على Kernel implementation)
```

---

## 🎯 الخلاصة

البنية المستهدفة تحقق:
- ✅ **Orchestration:** تنسيق ذكي
- ✅ **Domain Lock:** قيود صارمة
- ✅ **Analysis:** تحليل عميق
- ✅ **Multi-Round:** جولات متعددة
- ✅ **Reports:** تقارير قياسية
- ✅ **Extensibility:** قابلية التوسع
- ✅ **Maintainability:** سهولة الصيانة

كل هذا **بدون المساس بـ Kernel الحالي**! 🎉

---

**السابق:** [← 01-current-state.md](./01-current-state.md)  
**التالي:** [03-phase-0-preparation.md →](./03-phase-0-preparation.md)
