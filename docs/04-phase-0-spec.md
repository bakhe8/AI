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
- Authentication
- Persistence / databases
- Streaming
- Agents or tools
- Prompt modification
- Model-to-model communication

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
- WebSocket push for replies is allowed as a transport optimization; HTTP polling remains a fallback.
