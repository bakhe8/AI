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
├─ frontend/agent/ # Agent Control Panel (Layer 1 UI)
├─ backend/src/agent/outputs/
│   ├─ raw-measurements/ # Layer 1: agent raw outputs (no summaries/ratings/recommendations)
│   └─ human-reports/    # Layer 2: human/management reports
├─ docs/phase-3-plan.md  # Usage Validation plan (Phase 3)
└─ README.md

---

## 4. Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
OPENAI_API_KEY=sk-xxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxx
DEEPSEEK_API_KEY=sk-xxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxx
# Required: protect /api/health in all environments
HEALTH_TOKEN=your-secret-token
# Optional: enable active (paid) health pings to providers
HEALTH_ACTIVE_CHECK=false
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

- Agent UI is separate at:

```text
http://localhost:3000/agent-ui/
```

- Consultation UI (Phase 4a Layer 2) is separate at:

```text
http://localhost:3000/consult-ui/
```

- Navigation is “link-only”: Chat ↔ Agent ↔ Consultation do not share state or CSS.

- Navigation is “link-only”: Chat UI has a button “Switch to Agent Mode”; Agent UI has “Back to Chat”. No shared state or CSS.

### Real-time updates (WebSocket)
- The frontend opens a WebSocket to the backend to receive live replies without polling.
- Polling is disabled while WebSocket is connected, and falls back every 10s if WS disconnects or the page is hidden.
- Ensure the browser can reach `ws://localhost:3000` (or `wss://` if using HTTPS).
- Assistant Markdown is rendered after escaping HTML to mitigate XSS from model output.

### Health endpoint auth
- `/api/health` requires `Authorization: Bearer <HEALTH_TOKEN>` in all environments.
- This token is **not a startup requirement**; the server runs without it. It only gates access to operational endpoints (health/memory-stats).
- In the browser UI, set `localStorage.setItem('health_token', '<token>')` then reload to enable status indicators.
- Without the token, the UI skips the health check to avoid 401s.
- Deep health checks (with `?deep=true` or `HEALTH_ACTIVE_CHECK=true`) are cached for 60s to avoid hitting providers repeatedly.

### Memory stats endpoint
- `/api/memory-stats` is available only in non-production environments (returns 403 in production).
- If `HEALTH_TOKEN` is set, the same bearer token is required to access this endpoint.
- Intended for local debugging only.

### Consultation (Phase 4a, Layer 2 only)
- Vision doc: `docs/ARCHITECTURAL-VISION.md`; execution plan: `docs/phase-4a-plan.md`.
- Endpoints (no code apply, no Layer 1 changes):
  - `POST /consult/start` — `{ question, snapshot, models? }` → `{ consultId, status, models }`
  - `GET /consult/status/:id` — per-model status/progress
  - `GET /consult/transcript/:id` — prompt/response per model (no secrets)
  - `GET /consult/consensus/:id` — Layer 2 summary (agreement/disagreement/gaps/warnings)
- Guardrails: Readiness stays manual; Health stays token-protected; no context sharing between models; snapshots/transcripts must be sanitized and human-approved.

### Manual readiness check (user-facing)
- Endpoint: `POST /api/check-readiness` with optional `{ "model": "openai|deepseek|gemini|copilot" }`.
- No auth, no tokens. Returns `{ status: "ready" }`, `{ status: "unavailable", reason }`, or `{ status: "busy", reason: "temporary cooldown" }`.
- A 10s cooldown prevents spamming; each chat panel has a manual “Check” button that calls this endpoint once per click. No polling or auto-refresh.
- Readiness is user convenience only and does **not** expose provider details. Operational health remains gated by `HEALTH_TOKEN`.

### Error response shape
All API errors follow:
```json
{
  "error": "message",
  "code": 400
}
```

### Agent outputs policy
- Layering: `backend/src/agent/outputs/raw-measurements` (Layer 1, agent raw data only) and `backend/src/agent/outputs/human-reports` (Layer 2, human-authored).
- Rule for raw-measurements: **no summaries, ratings, recommendations, or deployment guidance**. A policy guard test enforces absence of banned terms (`recommend`, `should`, `deploy`, `critical`, `rating`).
- User scope: The system is intended for a single user; no channel isolation or auth is applied to chat/messages or WebSocket broadcasts. Multi-user scenarios would need added isolation/auth if introduced later.
- Auth vs operational protection: there is **no user authentication or channel isolation** by design; only operational endpoints (health/memory-stats) use `HEALTH_TOKEN` gating.

### Pre-Phase 3 readiness checklist
- Set `HEALTH_TOKEN` in `backend/.env` and `localStorage.health_token` in the browser; confirm WS connectivity (polling only when WS disconnected/hidden).
- If more than one user will test, add auth/channel isolation first (current build is single-user with shared channels).
- Keep Layer 1 outputs in `backend/src/agent/outputs/raw-measurements` raw-only (policy guard enforces banned terms); Layer 2 reserved for human reports.
- Prepare 3–5 real JS projects/files for validation runs.
- Decide on deep health usage: enable provider keys and `HEALTH_ACTIVE_CHECK` if desired, or keep disabled to save quota.
- Model output display is HTML-escaped before Markdown rendering; suitable for external model responses, but strengthen sanitize if needed.

### Phase 3 Operational Workflow
- Naming: place each Layer 1 report under `backend/src/agent/outputs/raw-measurements/` as `case-0X-<short-label>.md` (e.g., `case-01-helper.md`).
- Example Layer 1 report: raw agent output only, no summaries/ratings/recommendations/deployment guidance (Policy Guard blocks banned terms: recommend, should, deploy, critical, rating).
- Layer 2 (human) notes go to `backend/src/agent/outputs/human-reports/phase-3-usage-notes.md` and decision snapshot nearby.

### Agent API (UI-only, no chat overlap)
- GET `/agent/tasks` — list predefined tasks (read-only).
- POST `/agent/execute` — start a task run `{ taskId, input: { type: "code", content } }` → `{ executionId, status: "running" }`.
- GET `/agent/status/:executionId` — status/progress.
- GET `/agent/results/:executionId` — Layer 1 results (patterns, gaps, contradictions, metrics, raw report).

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
