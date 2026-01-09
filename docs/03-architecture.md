# System Architecture

---

## 1. High-Level Architecture

```
[ Browser UI ]
      |  \
      |   \ WebSocket (live replies)
      |    \
      | Unified Contract (JSON)
      v
[ Core API Gateway ]
      |
      | Route by model identifier
      v
[ Model Adapters ]
      |
      v
[ External AI APIs ]
```

---

## 2. Layer Responsibilities

### UI Layer
- Capture user input
- Display conversation history
- Send and receive unified contract payloads
- Use WebSocket for live replies (polling is fallback; disabled while WS connected)
- Escape HTML before rendering Markdown from models to mitigate XSS

Must NOT:
- Call AI APIs directly
- Store API keys
- Contain model-specific logic

---

### Core API Gateway
- Validate contract shape
- Route requests to correct adapter
- Enforce neutrality and invariants
- Push replies over WebSocket to subscribed clients
- Require bearer token for health endpoint
- Cache deep health checks to avoid hammering providers
- Expose manual readiness check `/api/check-readiness` (no auth, 10s cooldown) to report if a model key is configured without revealing provider details; distinct from operational health.

Must NOT:
- Modify content
- Interpret meaning
- Perform orchestration

---

### Adapter Layer
- Translate unified contract → native API format
- Call external AI model
- Translate response → unified reply

Must NOT:
- Add instructions
- Apply heuristics
- Perform retries with altered prompts

---

## 3. Trust Boundary

```
[ Untrusted Browser ]
        |
        |  HARD TRUST BOUNDARY
        v
[ Trusted Backend ]
```

All credentials, adapters, and model access live strictly behind this boundary.

---

## 4. Output Layers

- Layer 1 (raw): `backend/src/agent/outputs/raw-measurements` — agent raw data only (no summaries/ratings/recommendations); enforced by policy guard test.
- Layer 2 (human): `backend/src/agent/outputs/human-reports` — human/management reports.
- User scope: single-user deployment; chat/messages and WS broadcasts are not isolated. If multi-user support is added, isolation/auth must be introduced.
- Auth vs operational protection: no user authentication/channel isolation by design; operational endpoints (health/memory-stats) are token-gated only.
- UI separation: Chat UI (`/`) and Agent UI (`/agent-ui/`) are independent. Navigation is link-only; no shared state, CSS, or endpoints.
