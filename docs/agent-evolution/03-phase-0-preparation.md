# 🏁 المرحلة 0: التحضير

**المدة المتوقعة:** 1-2 يوم  
**الهدف:** تحديد دقيق للـ Contracts واتفاقيات العمل بين الطبقات

---

## 🎯 الأهداف

1. ✅ تحديد **واجهات التواصل** (Interfaces) بين Agent و Kernel
2. ✅ كتابة **Contracts واضحة** لكل طبقة
3. ✅ إعداد **البنية الأساسية** للمجلدات
4. ✅ كتابة **أول Test** كـ PoC

---

## 📋 المهام التفصيلية

### **Task 1: إنشاء هيكل المجلدات**

```bash
# إنشاء البنية الأساسية
mkdir -p backend/src/agent/{core,tasks,facets,prompts,analyzer,reports,contracts,__tests__}
mkdir -p backend/src/agent/tasks/implementations
mkdir -p backend/src/agent/facets/definitions
mkdir -p backend/src/agent/prompts/templates
mkdir -p backend/src/agent/reports/templates
```

**الناتج المتوقع:**
```
backend/src/agent/
├── core/
├── tasks/
│   └── implementations/
├── facets/
│   └── definitions/
├── prompts/
│   └── templates/
├── analyzer/
├── reports/
│   └── templates/
├── contracts/
└── __tests__/
```

---

### **Task 2: كتابة Agent Contracts**

#### **2.1: Agent Task Contract**

```javascript
// backend/src/agent/contracts/agent-task.contract.js

/**
 * Contract لتعريف Agent Task
 */
export const AgentTaskContract = {
  // معرف المهمة
  id: String,           // مثال: 'js-code-audit'
  
  // اسم ووصف
  name: String,         // مثال: 'JavaScript Security Audit'
  description: String,  // وصف تفصيلي
  
  // الإعدادات
  facets: Array,        // ['security', 'performance', 'quality']
  models: Array,        // ['openai', 'gemini', 'deepseek']
  rounds: Number,       // 1 or 2
  
  // الدوال
  buildRound1Prompt: Function,  // (facet, input) => prompt
  buildRound2Prompt: Function,  // (facet, round1, gaps) => prompt
  analyzeResponse: Function,    // (responses) => analysis
  
  // الإخراج
  outputFormat: String  // 'markdown-report' | 'json' | 'structured'
};

/**
 * Validator للتأكد من صحة Task
 */
export function validateAgentTask(task) {
  if (!task.id || typeof task.id !== 'string') {
    throw new Error('Task must have a valid id');
  }
  
  if (!Array.isArray(task.facets) || task.facets.length === 0) {
    throw new Error('Task must have at least one facet');
  }
  
  if (!Array.isArray(task.models) || task.models.length === 0) {
    throw new Error('Task must have at least one model');
  }
  
  if (typeof task.buildRound1Prompt !== 'function') {
    throw new Error('Task must have buildRound1Prompt function');
  }
  
  return true;
}
```

#### **2.2: Kernel Request Contract**

```javascript
// backend/src/agent/contracts/kernel-request.contract.js

/**
 * Contract للتواصل مع Kernel
 * Agent → Kernel
 */
export const KernelRequestContract = {
  // Channel ID (مولد تلقائياً من Agent)
  channel_id: String,   // 'agent-{taskId}-{facet}-{model}-{round}'
  
  // النموذج المطلوب
  model: String,        // 'openai' | 'gemini' | 'deepseek' | 'copilot'
  
  // الرسائل (Kernel format)
  messages: [
    {
      role: String,     // 'system' | 'user' | 'assistant'
      content: String   // نص الرسالة
    }
  ],
  
  // Metadata (اختياري - لا يُرسل للـ Kernel)
  _agentMetadata: {
    taskId: String,
    facet: String,
    round: Number
  }
};

/**
 * تحويل من Agent Prompt إلى Kernel Request
 */
export function toKernelRequest(agentPrompt, metadata) {
  return {
    channel_id: `agent-${metadata.taskId}-${metadata.facet}-${metadata.model}-r${metadata.round}`,
    model: metadata.model,
    messages: [
      {
        role: 'system',
        content: agentPrompt.system
      },
      {
        role: 'user',
        content: agentPrompt.user
      }
    ]
  };
}
```

#### **2.3: Agent Response Contract**

```javascript
// backend/src/agent/contracts/agent-response.contract.js

/**
 * Contract لرد Agent للـ User
 */
export const AgentResponseContract = {
  // حالة المهمة
  status: String,       // 'running' | 'analyzing' | 'complete' | 'error'
  
  // معرف المهمة
  taskId: String,
  
  // التقدم
  progress: {
    current: Number,    // 3
    total: Number,      // 5
    phase: String       // 'round1' | 'analysis' | 'round2' | 'reporting'
  },
  
  // النتائج (عند الاكتمال)
  results: {
    // الردود الأولية
    round1: Array,
    
    // التحليل
    analysis: {
      patterns: Array,
      gaps: Array,
      contradictions: Array,
      confidence: Number  // 0-1
    },
    
    // الجولة الثانية (إن وجدت)
    round2: Array,
    
    // التقرير النهائي
    report: {
      summary: String,
      markdown: String,
      findings: Object,
      recommendations: Array
    }
  },
  
  // الأخطاء (إن وجدت)
  error: {
    message: String,
    phase: String,
    details: Object
  },
  
  // إحصائيات
  stats: {
    duration: Number,     // بالثواني
    apiCalls: Number,
    tokensUsed: Number
  }
};
```

---

### **Task 3: إنشاء Kernel Client (Bridge)**

```javascript
// backend/src/agent/core/kernel-client.js

import { toKernelRequest } from '../contracts/kernel-request.contract.js';

/**
 * Bridge بين Agent و Kernel
 * يحول من Agent format إلى Kernel format
 */
export class KernelClient {
  constructor(kernelBaseUrl = 'http://localhost:3000') {
    this.baseUrl = kernelBaseUrl;
  }
  
  /**
   * إرسال طلب للـ Kernel
   */
  async send(model, agentPrompt, metadata) {
    // تحويل للصيغة المطلوبة
    const kernelRequest = toKernelRequest(agentPrompt, {
      ...metadata,
      model
    });
    
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(kernelRequest)
      });
      
      if (!response.ok) {
        throw new Error(`Kernel returned ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        model,
        content: data.reply.content,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        model,
        error: error.message,
        metadata
      };
    }
  }
  
  /**
   * إرسال متوازي لعدة نماذج
   */
  async sendParallel(models, agentPrompt, metadata) {
    const promises = models.map(model => 
      this.send(model, agentPrompt, metadata)
    );
    
    return Promise.all(promises);
  }
}
```

---

### **Task 4: كتابة أول Test (PoC)**

```javascript
// backend/src/agent/__tests__/kernel-client.test.js

import { KernelClient } from '../core/kernel-client.js';

describe('KernelClient', () => {
  let client;
  
  beforeEach(() => {
    client = new KernelClient('http://localhost:3000');
  });
  
  test('should send request to kernel', async () => {
    const agentPrompt = {
      system: 'You are a security auditor.',
      user: 'Find security issues in this code: ...'
    };
    
    const metadata = {
      taskId: 'test-task-1',
      facet: 'security',
      round: 1
    };
    
    const response = await client.send('openai', agentPrompt, metadata);
    
    expect(response).toHaveProperty('model', 'openai');
    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('metadata');
  });
  
  test('should handle kernel errors gracefully', async () => {
    const agentPrompt = {
      system: 'Test',
      user: 'Test'
    };
    
    const response = await client.send('invalid-model', agentPrompt, {
      taskId: 'test',
      facet: 'test',
      round: 1
    });
    
    expect(response).toHaveProperty('error');
  });
});
```

---

## ✅ معايير الإنجاز

### **نهاية المرحلة 0:**

- [x] هيكل المجلدات جاهز
- [x] Contracts مكتوبة ومُختبرة
- [x] Kernel Client يعمل
- [x] أول Test ينجح
- [x] التوثيق محدّث

---

## 📊 Output المتوقع

### **الملفات الجديدة:**
```
✅ backend/src/agent/contracts/agent-task.contract.js
✅ backend/src/agent/contracts/kernel-request.contract.js
✅ backend/src/agent/contracts/agent-response.contract.js
✅ backend/src/agent/core/kernel-client.js
✅ backend/src/agent/__tests__/kernel-client.test.js
```

### **الاختبارات:**
```bash
npm test kernel-client.test.js

✅ KernelClient
  ✅ should send request to kernel
  ✅ should handle kernel errors gracefully
  
2/2 tests passed
```

---

## 🚨 التحديات المتوقعة

### **1. Async Handling**
**المشكلة:** طلبات متعددة للـ Kernel  
**الحل:** استخدام `Promise.all()` مع error handling

### **2. Error Propagation**
**المشكلة:** أخطاء Kernel يجب أن تُعالج في Agent  
**الحل:** try/catch شامل + structured errors

### **3. Testing بدون Kernel حقيقي**
**المشكلة:** Kernel قد لا يكون متاحاً أثناء التطوير  
**الحل:** Mock Kernel Client للـ tests

---

## 🎯 الخطوة التالية

بعد إتمام المرحلة 0:
- ✅ Contracts واضحة ومُتفق عليها
- ✅ Kernel Client جاهز
- ✅ نستطيع البدء ببناء Agent Orchestrator

**التالي:** المرحلة 1 - بناء Core Agent

---

**السابق:** [← 02-target-architecture.md](./02-target-architecture.md)  
**التالي:** [04-phase-1-core-agent.md →](./04-phase-1-core-agent.md)
