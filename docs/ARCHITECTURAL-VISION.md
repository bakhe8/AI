# Cognitive Agent — Human-Directed Self-Review & Controlled Evolution

**الحالة:** Post Phase 0–3 Stabilization (Freeze Active 🔒)  
**التصنيف:** Phase 4+ Vision Document  
**الغرض:** توثيق الرؤية المستقبلية للتطور الموجّه بشريًا

---

## ⚠️ CRITICAL: هذا ليس Implementation Plan

**هذه وثيقة رؤية استراتيجية فقط.**
- ❌ لا تنفيذ الآن
- ❌ لا code changes
- ✅ للمرجعية المستقبلية
- ✅ عند طلبها صراحة فقط

---

## 1️⃣ السياق العام (Context)

### ما تم إنجازه:
* ✅ Phase 0: Foundation (13 files, 20 tests)
* ✅ Phase 1: Core Agent (11 files, 32 tests)
* ✅ Phase 2: Analysis & Reports (4 files, 14 tests)
* ✅ Phase 3: UI Integration (11 files + docs)
* ✅ 98/98 tests passing
* ✅ Stabilization Freeze active

### الهدف التالي (عندما يُطلب):
**إعادة تموضع الاستخدام** نحو:
- Human-Directed Self-Review
- Controlled Evolution
- Closed Decision Loop

> **مبدأ أساسي:** لا تطوير ذاتي تلقائي. كل تطور = قرار بشري صريح.

---

## 2️⃣ التعريفات الأساسية

### العميل (Client/Agent)
- **ليس** كيانًا واعيًا ❌
- **ليس** صاحب قرار ❌
- **هو** مدير حوار + جامع آراء + منفّذ أوامر بشرية ✅

### النماذج (Models)
- مستشارون مستقلون
- لا يعرفون بعضهم
- لا يعلمون أنهم يراجعون «النظام نفسه»
- يقدمون **آراء** لا **قرارات**

### المستخدم (Human Authority)
- **سلطة القرار الوحيدة** 👑
- يوافق / يرفض / يعيد التوجيه
- يحدد ما الذي يُغيَّر ومتى
- العميل **يتوقف دائمًا** عند بوابة القرار

---

## 3️⃣ الفصل الحاسم: Health vs Readiness

### Health (تشغيلي - للمشغّل)
```
Purpose: Internal monitoring
Auth: Token required (HEALTH_TOKEN)
Data: Detailed metrics
Access: Operator only
Endpoint: /api/health
```

**يحتوي على:**
- Memory usage
- Adapter status
- Error rates
- Performance metrics

---

### Readiness (للمستخدم النهائي)
```
Purpose: User-facing availability check
Auth: None
Trigger: Manual button ONLY
Frequency: On-demand (10s cooldown)
Output: Simple status + reason
Endpoint: /api/check-readiness
```

**يعرض:**
- `ready` - Model configured and available
- `busy` - Cooldown active
- `unavailable` - Not configured

**القواعد الصارمة:**
- ❌ No auto-polling
- ❌ No background checks
- ✅ User-initiated ONLY
- ✅ One button in UI header

> **السبب:** منع الإغراق + وضوح التجربة + أمان بيانات

---

## 4️⃣ نموذج الاستخدام الحالي (Measurement Mode)

### متى أستخدم الأداة؟
- ✅ سؤال محدد حول كود/منطق/قرار
- ❌ ليس للتجربة أو الفضول

### الخطوات الثابتة:
```
1. فتح /agent-ui/
2. اختيار المهمة: "JavaScript Code Audit"
3. إدخال Artifact (كود/ملف)
4. تشغيل التحليل
5. انتظار الاكتمال (status → complete)
6. قراءة النتائج بالترتيب:
   - Contradictions (تناقضات)
   - Gaps (فجوات)
   - Patterns (أنماط)
   - Metrics (مقاييس)
   - Raw Report (تقرير خام)
```

**Output:** Layer 1 measurements ONLY (no recommendations)

---

## 5️⃣ مفهوم «المرآة» (Self via Snapshot)

### المبدأ:
- ❌ لا وصول مباشر للنظام الحي
- ✅ Snapshot ثابت ومصرّح به يمثل النظام

### محتوى الـ Snapshot (أمثلة):
```markdown
System Snapshot v1.0 (2026-01-09)

Architecture:
- Frontend: Chat + Agent UI
- Backend: Express + Agent System
- Models: 4 (OpenAI, Gemini, DeepSeek, Copilot)

Current Constraints:
- Internal use only
- No authentication
- Layer 1 output only

Files:
- backend/src/agent/core/orchestrator.js
- backend/src/agent/analyzer/response-analyzer.js
[... selected code snippets ...]

Current Objective:
- Stabilization freeze
- Documentation complete
```

> هذا يسمح للنماذج بالفحص الموضوعي دون مخاطر

---

## 6️⃣ حلقة القرار المغلقة (Closed Decision Loop)

### Flow Diagram:
```
┌─────────────────────────────────────┐
│ 1. Human: طرح السؤال               │
│    "هل البنية قابلة للتوسع؟"       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. Client: يرسل Snapshot + سؤال    │
│    إلى كل Model بشكل مستقل          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. Models: تجيب (بدون معرفة بعضها) │
│    - OpenAI: "نعم، لكن..."         │
│    - Gemini: "محدودة في..."        │
│    - DeepSeek: "نعم، مع..."        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. Client: يعرض الحوار كاملاً       │
│    (النص الكامل، لا اختصار)         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 5. Client: يجمّع (بدون ترجيح)      │
│    - Patterns: اتفاق 3/3 على...    │
│    - Contradictions: OpenAI vs...   │
│    - Gaps: Gemini ذكر X، الباقي لا │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 6. 🚪 DECISION GATE (بوابة القرار) │
│                                     │
│    ✅ أوافق → نفّذ                 │
│    🔄 أعد السؤال (توجيه جديد)      │
│    ⛔ أوقف → لا تغيير              │
│                                     │
│    ⏱️ Client STOPS HERE            │
└─────────────────────────────────────┘
              ↓
         (Human decides)
```

### القواعد:
1. **عرض شفاف:** كل حوار يُعرض كاملاً
2. **لا ترجيح:** جميع الآراء متساوية
3. **توقف إجباري:** Client لا يتخطى Decision Gate
4. **قرار بشري:** User فقط يحدد التالي

---

## 7️⃣ ماذا يعني «تطوير العميل» فعليًا؟

### ما لا يتغير أبدًا:
- ❌ الكود الحي (live code)
- ❌ منطق القرار (decision logic)
- ❌ آلية التشغيل (execution engine)

### ما الذي يمكن تحديثه بأمر المستخدم:
- ✅ **Self Snapshot** - وصف النظام
- ✅ **Evaluation Rules** - قواعد التقييم
- ✅ **Constraints** - القيود المعلنة
- ✅ **Prompt Templates** - قوالب الأسئلة
- ✅ **Decision Policies** - سياسات القرار

**مثال:**
```
Before: "Snapshot describes system as internal-only"
Human Decision: "Update snapshot to reflect external deployment plan"
Action: Update docs/system-snapshot.md (NOT code)
```

> **التطوير = تحديث توصيف/قواعد، لا إعادة برمجة ذاتية**

---

## 8️⃣ إعادة السؤال (Re-Ask) — بشروط صارمة

### القاعدة:
❌ لا إعادة تلقائية  
✅ كل إعادة تتطلب **توجيهًا جديدًا صريحًا**

### أمثلة توجيهات صحيحة:
```
✅ "افحص من زاوية الأمن فقط"
✅ "افترض استخدامًا داخليًا 3 سنوات"
✅ "تجاهل الأداء وركّز على الاستقرار"
✅ "قيّم من منظور تكلفة الصيانة"
```

### أمثلة ممنوعة:
```
❌ "أعد" (بدون توجيه)
❌ "راجع مرة أخرى" (غامض)
❌ "حسّن الإجابة" (غير محدد)
```

**لماذا؟**
- منع حلقات لا نهائية
- ضمان توجيه واضح
- الحفاظ على control بشري

---

## 9️⃣ لماذا هذا التصميم آمن وناضج؟

### الأمان (Safety):
1. ✅ يمنع حلقات لا نهائية
2. ✅ يمنع hallucination القرار
3. ✅ يبقي الإنسان في مركز التحكم
4. ✅ لا side effects غير مرئية

### النضج (Maturity):
1. ✅ يحافظ على بساطة النظام
2. ✅ يتماشى مع كونه بدأ كـ Chat
3. ✅ قابل للتدقيق (auditable)
4. ✅ شفاف بالكامل

### الفلسفة:
> هذا **Human-Directed Iterative Refinement**  
> وليس **Self-Improving AI**

---

## 🔟 ثوابت لا تُكسر (Rules of Engagement)

```
1. لا قرار بدون موافقة بشرية صريحة
2. لا تنفيذ تلقائي (no auto-execution)
3. Readiness يدوي فقط (manual button)
4. Health تشغيلي ومحمي (token-protected)
5. لا Auth ولا Billing في هذه المرحلة
6. أي كسر لهذه القواعد = دخول Phase 4 (غير مسموح الآن)
```

**Consequence of breaking:**
- System becomes **unsafe**
- Vision compromised
- Need full re-evaluation

---

## 1️⃣1️⃣ الوضع الحالي والخطوة القادمة

### ✅ الوضع الحالي (Current State):
```
Status: Stabilization Freeze 🔒
Completed:
- Phase 0: Foundation
- Phase 1: Core Agent
- Phase 2: Analysis & Reports
- Phase 3: UI Integration
- Documentation complete
- Manual test PASSED

Ready for:
- Internal use
- Code audits
- Measurement-only analysis
```

### 🔮 الخطوة القادمة (Next - When Requested ONLY):

**Phase 4: Human-Directed Evolution**

**Prerequisites:**
1. User explicitly requests Phase 4
2. Stabilization period complete (weeks/months)
3. Current system proven stable in production

**Components to add:**
```
1. Chat Transcript Display
   - Show full Model ↔ Client conversations
   - Timestamped, unedited

2. Decision Gate UI
   - Clear ✅/🔄/⛔ options
   - Reason input for re-ask
   - Audit trail

3. Snapshot Generator
   - Auto-generate system snapshots
   - Version control
   - Approval workflow

4. Evolution Log
   - Track what changed, why, when
   - Human decisions recorded
   - Rollback capability
```

**Timeline:** TBD (user decides)

---

## الخلاصة النهائية

> **هذا النظام لم يعد مجرد أداة تحليل،**  
> **بل مستشار جماعي شفاف،**  
> **يتطوّر فقط بقرارك،**  
> **ويُبقيك دائمًا في مقعد القيادة.**

### Key Principles:
1. **Transparency** - كل شيء مرئي
2. **Human Authority** - القرار للإنسان فقط
3. **Controlled Evolution** - تطور مُوجّه لا ذاتي
4. **Safety First** - الأمان قبل الميزات

### Current Mandate:
🔒 **STABILIZATION FREEZE**
- No new features
- No code changes
- Documentation only
- Manual testing complete

### Future Vision (Phase 4+):
When requested by user:
- Enable Human-Directed Self-Review
- Implement Closed Decision Loop
- Add Evolution tracking
- Maintain all safety guarantees

---

**Document Type:** Strategic Vision (Phase 4+)  
**Status:** Reference Only - No Implementation  
**Version:** 1.0  
**Date:** 2026-01-09

---

**CRITICAL REMINDER:**  
This is a **vision document**, not an action plan.  
Implementation requires explicit user approval and is NOT part of current freeze.
