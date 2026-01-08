# AI Model Communication Kernel

Phase 0 — Raw Communication Kernel  
Local Development Setup

---

## 1. Overview

This project implements a **minimal, neutral communication kernel**
that enables message exchange between UI panels and AI models via APIs.

The system is intentionally non-intelligent.
It only transports messages according to a strict unified contract.

All architectural rules are defined in `/docs`.

---

## 2. Requirements

To run locally, you need:

- Node.js v18 or higher
- npm
- Internet connection (for external AI APIs)
- A modern web browser

No database, Docker, or cloud services are required.

---

## 3. Project Structure

ai-kernel/
├─ docs/ # Architecture & contracts (Source of Truth)
├─ backend/ # API Gateway + Adapters
├─ frontend/ # Single-page UI (4 panels)
└─ README.md

---

## 4. Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
OPENAI_API_KEY=sk-xxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxx
DEEPSEEK_API_KEY=sk-xxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxx
```

⚠️ Never expose API keys in frontend code.

## 5. Running the Backend

```bash
cd backend
npm install
node src/server.js
```

Expected output:

```text
AI Kernel running on :3000
```

The backend will be available at:

```text
http://localhost:3000
```

## 6. Running the Frontend

The frontend is served by the backend. Open:

```text
http://localhost:3000
```

## 7. Phase 0 Rules (Important)
During Phase 0, the system MUST NOT:

Modify prompts

Inject system instructions

Store data persistently

Implement agents or orchestration

Allow model-to-model communication

All behavior must comply with:

docs/01-concept.md

docs/02-core-contract.md

docs/03-architecture.md

docs/04-phase-0-spec.md

## 8. Troubleshooting
Refer to the troubleshooting section below or contact the project owner.

# 🧯 قائمة الأعطال الشائعة + حلولها

## ❌ 1) السيرفر لا يعمل

**الخطأ:**
node: command not found

**الحل:**
- تأكد أن Node.js مثبت
- شغّل:
```bash
node -v
يجب أن يكون v18+
```

❌ 2) السيرفر يعمل لكن لا يوجد رد

الأسباب المحتملة:

API Key غير موجود

API Key خاطئ

الرصيد منتهي

الحل:

تحقق من .env

أعد تشغيل السيرفر بعد أي تعديل

اختبر المفتاح من لوحة التحكم الخاصة بالمزود

❌ 3) Error 401 / 403 من النموذج

السبب:

مفتاح API غير صالح

النموذج غير مفعّل للحساب

الحل:

أنشئ مفتاح جديد

تأكد من اسم النموذج الصحيح داخل Adapter

❌ 4) CORS Error في المتصفح

السبب:

فتح index.html مباشرة

المتصفح يمنع الاتصال بـ localhost API

الحل (مفضل):

شغّل السيرفر وافتح:
http://localhost:3000

❌ 5) الرد يظهر في Panel خاطئ

السبب:

عدم الالتزام بـ channel_id

كسر Round-trip contract

الحل:

تحقق أن channel_id يُعاد كما أُرسل

لا تُنشئه من جديد في الرد

❌ 6) النظام يتصرف وكأنه “يفهم” أو “يعدل”

🚨 هذا خطأ معماري

السبب:

Adapter يضيف تعليمات

Core يغير الرسائل

الحل:

راجع:

docs/01-concept.md

docs/02-core-contract.md

أي تعديل على الرسائل ممنوع في Phase 0

❌ 7) لا يعمل بدون إنترنت

هذا طبيعي ✔️

Phase 0 يعتمد على نماذج سحابية.
للاختبار بدون إنترنت:

استخدم mock.adapter.js

🧠 قاعدة ذهبية

إذا واجهت سلوكًا غريبًا
ارجع إلى docs/
وليس إلى الكود أولًا.
