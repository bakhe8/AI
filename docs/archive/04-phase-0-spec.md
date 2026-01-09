# Phase 0 – Raw Communication Kernel

Status: Execution Authorized

---

## 1. Objective

Implement the **minimal working kernel**
that enables message transport between UI panels and AI models
using the unified contract—nothing more.

---

## 2. Scope

### Included
- Single-page UI
- Exactly four fixed panels
- One backend endpoint (`POST /api/chat`)
- In-memory conversation state per panel
- One or more adapters

---

### Explicitly Excluded
- Authentication (user-level)
- Persistence / databases
- Streaming
- Kernel-level “intelligence” (the kernel must remain neutral)
- Prompt modification
- Model-to-model communication
*Agent Layer 1 orchestration is allowed as an external layer on top of the kernel.*

---

## 3. Definition of Done

Phase 0 is complete when:
- A message can be sent from any panel
- The correct model responds
- The response is displayed in the originating panel
- The contract remains unbroken end-to-end

---

## 4. Phase Lock

No feature outside this document is permitted in Phase 0.

---

## 5. Additional Operational Rules
- Health endpoint requires bearer token (`HEALTH_TOKEN`) even in development; optional active checks may call providers.
- Errors are returned in the shape `{ "error": "...", "code": <number> }` for all endpoints.
- WebSocket push for replies is allowed as a transport optimization; HTTP polling remains a fallback and is disabled while WS is connected.
- Deep health checks are cached for 60 seconds to reduce provider calls.
- Assistant content is HTML-escaped before rendering Markdown to mitigate XSS from model output.
- Phase 0–2 are frozen APIs: **kernel contracts/behavior** only get bug fixes; Agent Layer/Tasks/Facets may evolve without breaking kernel contract.
- Raw output policy: files under `backend/src/agent/outputs/raw-measurements` must not contain summaries/ratings/recommendations/deployment guidance (guard test enforces banned terms).
- Deployment scope: single-user; no auth/isolation on chat/messages/WS. Multi-user support would require additional isolation/auth.
- Pre-Phase 3 readiness: set HEALTH_TOKEN + browser token, confirm WS connectivity; add auth/isolation if multi-user; keep Layer 1 raw-only; prepare 3–5 real JS projects for validation; decide on deep health usage vs quota.
