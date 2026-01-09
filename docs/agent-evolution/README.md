# 📚 دليل التنفيذ الكامل - Agent Evolution

> [!CAUTION]
> **⚠️ تحذير حاسم: Layer 1 = Measurement ONLY**
> 
> هذا المشروع يبني **Layer 1** فقط (قياسات وبيانات خام).
> 
> **ممنوع على Layer 1:**
> - ❌ التوصيات (Recommendations)
> - ❌ أحكام Severity
> - ❌ الترجيح بين النماذج
> - ❌ القرارات التفسيرية
> 
> **Layer 2 (المستقبل)** سيفعل التفسير.
> 
> **المرجع الأعلى:** [`SYSTEM_CONTRACT.md`](../SYSTEM_CONTRACT.md)

---

## 🗺️ خارطة الطريق

```
المرحلة 0: التحضير (1-2 يوم)
    ├── Contracts
    ├── Kernel Client  
    └── Tests أساسية

المرحلة 1: Core Agent (3-5 أيام)
    ├── Task System
    ├── Facet System
    ├── Prompt Builder
    └── Agent Orchestrator

المرحلة 2: Analysis & Reports (3-4 أيام)
    ├── Response Analyzer
    ├── Pattern Detector
    ├── Gap Finder
    └── Report Generator

المرحلة 3: UI Integration (2-3 أيام)
    ├── Agent Mode في الواجهة
    ├── Task Selector
    └── Results Display
```

---

## 🎯 Quick Start Guide

### **1. قراءة الوثائق بالترتيب:**
1. [00-overview.md](./00-overview.md) - الصورة الكاملة
2. [01-current-state.md](./01-current-state.md) - أين نحن الآن
3. [02-target-architecture.md](./02-target-architecture.md) - إلى أين نذهب
4. [03-phase-0-preparation.md](./03-phase-0-preparation.md) - البدء

### **2. التنفيذ التدريجي:**
- ✅ **لا تبدأ كل شيء مرة واحدة!**
- ✅ نفذ Phase 0 كاملة قبل Phase 1
- ✅ اختبر كل phase قبل الانتقال للتالية

### **3. المبدأ الذهبي:**
> **Kernel يبقى كما هو - لا تلمسه!**

---

## 📋 Checklist لكل مرحلة

### **المرحلة 0: ✅ التحضير**
- [ ] إنشاء مجلد `backend/src/agent/`
- [ ] كتابة Contracts (3 ملفات)
- [ ] بناء Kernel Client
- [ ] كتابة Tests أساسية
- [ ] التأكد أن Kernel يعمل

### **المرحلة 1: ✅ Core Agent**
- [ ] Task Registry  
- [ ] Base Task Class
- [ ] أول Task (js-code-audit)
- [ ] Facet Library (3 facets على الأقل)
- [ ] Prompt Builder
- [ ] Agent Orchestrator (Round 1 فقط)
- [ ] Integration Tests

### **المرحلة 2: ✅ Analysis & Reports**
- [ ] Response Analyzer
- [ ] Pattern Detector
- [ ] Gap Finder
- [ ] Report Generator
- [ ] Report Templates
- [ ] Round 2 Logic
- [ ] End-to-end Test

### **المرحلة 3: ✅ UI Integration**
- [ ] Agent Mode Toggle
- [ ] Task Selector UI
- [ ] Progress Indicator
- [ ] Results Display (panels)
- [ ] Report View
- [ ] User Testing

---

## 🏗️ المكونات الأساسية (بالترتيب)

### **1. Contracts** (المرحلة 0)
```javascript
// تعريفات واضحة
agent-task.contract.js
kernel-request.contract.js
agent-response.contract.js
```

### **2. Kernel Client** (المرحلة 0)
```javascript
// الجسر بين Agent و Kernel
class KernelClient {
  async send(model, prompt, metadata) {}
  async sendParallel(models, prompt, metadata) {}
}
```

### **3. Task System** (المرحلة 1)
```javascript
// تعريف المهام
class BaseTask {
  buildRound1Prompt(facet, input) {}
  buildRound2Prompt(facet, round1, gaps) {}
}

class JSCodeAuditTask extends BaseTask {}
```

### **4. Facet System** (المرحلة 1)
```javascript
// الأوجه القابلة لإعادة الاستخدام
{
  id: 'security',
  systemPrompt: '...',
  constraints: [...],
  examples: [...]
}
```

### **5. Prompt Builder** (المرحلة 1)  
```javascript
// بناء Prompts مع Domain Lock
class PromptBuilder {
  build(facet, input, context) {
    return {
      system: facet.systemPrompt,
      user: `${constraints}\n\n${input}`
    };
  }
}
```

### **6. Agent Orchestrator** (المرحلة 1 & 2)
```javascript
// القائد
class AgentOrchestrator {
  async executeTask(taskConfig, input) {
    // 1. Round 1
    // 2. Analysis
    // 3. Round 2
    // 4. Report
  }
}
```

### **7. Analyzer** (المرحلة 2)
```javascript
// التحليل
class ResponseAnalyzer {
  detectPatterns(responses) {}
  findGaps(responses) {}
  checkContradictions(responses) {}
}
```

### **8. Report Generator** (المرحلة 2)
```javascript
// إنتاج التقارير
class ReportGenerator {
  generate(round1, round2, analysis) {
    return markdown;
  }
}
```

---

## 🧪 استراتيجية الاختبار

### **Unit Tests:**
```javascript
// كل component له tests
kernel-client.test.js
task-system.test.js
prompt-builder.test.js
analyzer.test.js
report-generator.test.js
```

### **Integration Tests:**
```javascript
// Agent + Kernel معاً
orchestrator.integration.test.js
```

### **E2E Tests:**
```javascript
// النظام كاملاً
agent-workflow.e2e.test.js
```

---

## 🎨 مثال عملي كامل

### **Scenario: Code Audit**

```javascript
// 1. User Request
POST /api/agent/execute
{
  taskType: 'js-code-audit',
  input: `
    function login(username, password) {
      db.query("SELECT * FROM users WHERE user='" + username + "'");
    }
  `
}

// 2. Agent Orchestrator
const task = TaskRegistry.get('js-code-audit');
const facets = ['security', 'performance', 'quality'];
const models = ['openai', 'gemini', 'deepseek'];

// 3. Round 1 (Parallel)
for (facet of facets) {
  const prompt = PromptBuilder.build(facet, input);
  const responses = await KernelClient.sendParallel(models, prompt);
  // جمع الردود
}

// 4. Analysis
const analysis = Analyzer.analyze(allResponses);
/*
{
  patterns: ['SQL Injection (all 3 agree)'],
  gaps: {
    openai: ['Missing XSS check'],
    gemini: ['No input sanitization mentioned']
  },
  confidence: 0.95
}
*/

// 5. Round 2 (Targeted)
for (gap of analysis.gaps) {
  const focusedPrompt = PromptBuilder.buildRound2(gap);
  const response = await KernelClient.send(gap.model, focusedPrompt);
}

// 6. Report
const report = ReportGenerator.generate(round1, round2, analysis);

// 7. Response
{
  status: 'complete',
  report: {
    summary: 'Critical SQL Injection vulnerability found',
    findings: [...],
    recommendations: [...]
  },
  confidence: 0.95
}
```

---

## ⚠️ نصائح مهمة

### **✅ افعل:**
- ✅ اتبع المراحل بالترتيب
- ✅ اختبر كل component بشكل منفصل
- ✅ استخدم Contracts كمرجع
- ✅ اكتب Tests قبل الكود (TDD)
- ✅ وثّق أي تغييرات

### **❌ لا تفعل:**
- ❌ تعديل Kernel الحالي
- ❌ القفز بين المراحل
- ❌ كتابة كود بدون tests
- ❌ تجاهل Contracts
- ❌ إضافة features غير مخططة

---

## 📊 Metrics للنجاح

### **Code Quality:**
- Test Coverage > 80%
- No linting errors
- Documentation complete

### **Performance:**
- Round 1: < 30s
- Analysis: < 5s
- Round 2: < 20s
- Report Gen: < 2s
- **Total: < 1 minute**

### **Reliability:**
- Error handling شامل
- Graceful degradation
- Logging كافٍ

---

## 🚀 الإطلاق

### **v0.1 (PoC):**
- ✅ Agent يشغّل task واحد
- ✅ Round 1 فقط
- ✅ تقرير بسيط

### **v0.2 (MVP):**
- ✅ 3 tasks
- ✅ Round 1 + Round 2
- ✅ Pattern detection
- ✅ تقارير markdown

### **v1.0 (Production):**
- ✅ UI integration كاملة
- ✅ 5+ tasks
- ✅ تحليل متقدم
- ✅ Caching
- ✅ Error recovery

---

## 📞 الدعم

**الوثائق:** `docs/agent-evolution/`

**الأسئلة الشائعة:**
1. **هل أحتاج إعادة بناء Kernel؟**  
   ❌ لا! Kernel يبقى كما هو

2. **هل يمكن استخدام Chat Mode و Agent Mode معاً؟**  
   ✅ نعم! كلاهما يعملان جنباً إلى جنب

3. **كم تكلفة API calls في Agent Mode؟**  
   ⚠️ أعلى من Chat Mode (3 models × facets)
   
4. **هل Agent يعمل offline؟**  
   ❌ لا، يحتاج API keys للنماذج

---

## ✅ الخلاصة

هذا الدليل يوفر:
- 📋 خطة واضحة step-by-step
- 🏗️ بنية معمارية سليمة
- 🧪 استراتيجية testing شاملة
- ⚠️ تحذيرات من الأخطاء الشائعة
- 🚀 طريق واضح للإطلاق

**ابدأ بالمرحلة 0 واتبع الخطة!** 🎯

---

**روابط سريعة:**
- [Overview](./00-overview.md)
- [Current State](./01-current-state.md)
- [Target Architecture](./02-target-architecture.md)
- [Phase 0](./03-phase-0-preparation.md)
