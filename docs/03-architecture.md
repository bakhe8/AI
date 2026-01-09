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
