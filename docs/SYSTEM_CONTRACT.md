Multi-Model Differential Programming Agent

0. PURPOSE (الغرض)

هذا المستند هو العقد الوحيد والنهائي الذي يحدد:

ما هو النظام

ما الذي يجب تنفيذه

ما الذي يُمنع تنفيذه

كيف يُعتبر التنفيذ صحيحًا أو خاطئًا

❗ أي كود، منطق، أو قرار لا يمكن ربطه مباشرةً بهذا المستند يُعتبر انتهاكًا.

1. SYSTEM DEFINITION

النظام هو AI Agent وظيفته الأساسية:

إدارة، تنسيق، وقياس مخرجات عدة نماذج ذكاء اصطناعي عند تنفيذ مهام برمجية،
مع استخراج الفروقات والفجوات بدون اتخاذ قرارات أو تفسير النتائج في الطبقة الأساسية.

النظام لا يحل محل الإنسان في القرار،
بل يحل محله في التنسيق، المقارنة، وإدارة الحوار بين النماذج.

2. CORE PRINCIPLES (مبادئ غير قابلة للنقاش)

Measurement before Interpretation
القياس دائمًا يسبق التفسير، ولا يختلط به.

Constraint-Driven Comparison
لا مقارنة بدون قيود متطابقة (Domain Lock).

Models are Black Boxes
لا افتراض عن “ذكاء” نموذج أو نواياه.

Differences are Data
الاختلاف ليس خطأ ولا أفضلية، بل إشارة قياسية.

No Implicit Intelligence
أي “ذكاء” غير منصوص عليه صراحة ممنوع.

3. LAYERED ARCHITECTURE (بنية طبقية إلزامية)
3.1 Layer 1 — Measurement Layer (الطبقة الأساسية)
الوظيفة

تشغيل نفس المهمة على عدة نماذج

جمع المخرجات الخام

استخراج:

أنماط التقارب والاختلاف

الفجوات المشتركة

سلوك النماذج تحت القيود

المسموح

Parsing

Normalization

Counting

Clustering

Classification

Gap Detection

Cross-Examination بأسئلة مقيدة

الممنوع ❌

التفسير

التقييم

الترجيح

اختيار “أفضل حل”

دمج الحلول

اقتراح قرار نهائي

Layer 1 صامتة عمدًا.

3.2 Layer 2 — Interpretation Layer (اختيارية / لاحقة)

يمكن تفعيلها لاحقًا

قد تكون:

نموذج لغوي

إنسان

قواعد عمل

لا يحق لها تعديل بيانات Layer 1

3.3 Layer 3 — Execution Layer (اختيارية جدًا)

تنفيذ كود

تطبيق refactors

تشغيل اختبارات

❗ خارج نطاق هذا العقد حاليًا.

4. SUPPORTED DOMAIN (النطاق الحالي)
اللغة

JavaScript

نوع المهمة الأولى

JavaScript Code Audit

فحص كود موجود واقتراح تطويره دون تعديل مباشر

5. DOMAIN LOCK (قيود إلزامية)
{
  "language": "JavaScript",
  "runtime": "Node.js",
  "scope": "existing_code_audit",
  "modification_policy": "no_direct_changes",
  "allowed_actions": [
    "analysis",
    "issue_detection",
    "refactoring_proposals",
    "architecture_suggestions"
  ],
  "forbidden_actions": [
    "rewriting_code",
    "introducing_frameworks",
    "changing_public_api",
    "guessing_missing_context"
  ]
}


❗ هذه القيود تُرسل حرفيًا لكل نموذج.

6. OUTPUT CONTRACT (إخراج إلزامي للنماذج)

كل نموذج يجب أن يلتزم بهذا الهيكل فقط:

## 1. Understanding of Codebase
## 2. Detected Issues
### 2.1 Logic Issues
### 2.2 Structural Issues
### 2.3 Maintainability Issues
## 3. Risk Assessment
## 4. Improvement Proposals (No Code Changes)
## 5. Assumptions Made


❌ لا كود
❌ لا حلول جاهزة
❌ لا نصائح عامة غير مرتبطة بالكود

7. MULTI-MODEL EXECUTION

النماذج الحالية:

ChatGPT

DeepSeek

Gemini

التنفيذ:

متوازي

بدون مشاركة مخرجات بين النماذج

8. NORMALIZATION & MEASUREMENT

Layer 1 يجب أن تستخرج بيانات قياسية فقط مثل:

عدد المشاكل

أنواعها

أماكنها

الافتراضات

تغطية Facets

9. JS FACETS (Checklist إلزامي)
[
  "async_flow",
  "error_handling",
  "state_management",
  "side_effects",
  "input_validation",
  "resource_cleanup",
  "dependency_coupling",
  "testability"
]


❗ أي facet لم يذكره أي نموذج = Gap مؤكد.

10. PATTERN CLASSIFICATION (بدون تفسير)

الاختلافات تُصنف فقط كأحد الآتي:

Implementation Variant

Paradigm Shift

Scope Expansion

Constraint Violation

❌ لا “أفضل”
❌ لا “أسوأ”

11. CROSS-EXAMINATION ROUND (جولة ثانية)

مسموح فقط بأسئلة:

عن الافتراضات

عن فجوات محددة

عن سبب تجاهل facet معين

❌ ممنوع إعادة التحليل من الصفر

12. FAILURE CONDITIONS (شروط الفشل)

يُعتبر التنفيذ فاشلًا إذا:

تم دمج Layer 1 مع Layer 2

تم اتخاذ قرار داخل Layer 1

تم توليد كود

تم “تحسين” الفكرة

تم تجاهل أي قيد

تم افتراض شيء غير منصوص عليه

13. SUCCESS CONDITIONS (شروط النجاح)

يُعتبر التنفيذ ناجحًا إذا:

كل خطوة يمكن ربطها ببند في هذا العقد

Layer 1 تنتج:

Raw Outputs

Patterns

Gaps

Cross-Exam Results

بدون أي تفسير أو قرار

14. IMPLEMENTATION ORDER (ترتيب إلزامي)

Layer 1 فقط

بدون أي Layer أخرى

بدون أي ذكاء إضافي

15. FINAL RULE (قاعدة قاطعة)

إذا شككت: توقف.
إذا افترضت: فشلت.
إذا فسّرت: خرقت العقد.

END OF CONTRACT