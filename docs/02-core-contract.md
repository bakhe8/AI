# Core Communication Contract

Version: v0.2  
Stability: **IMMUTABLE (Additive Only)**

---

## 1. Request Contract

```json
{
  "channel_id": "panel-1",
  "model": "openai",
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ]
}
```

### Field Semantics

| Field | Meaning |
|-----|--------|
| channel_id | Logical identifier of the originating UI panel |
| model | Target model adapter identifier |
| messages | Ordered, raw conversation messages |

---

## 2. Response Contract

```json
{
  "channel_id": "panel-1",
  "model": "openai",
  "reply": {
    "role": "assistant",
    "content": "Hello!"
  }
}
```

---

## 3. Contract Rules (Non-Negotiable)

1. `messages` MUST NOT be altered
2. No additional metadata may be injected
3. `channel_id` MUST round-trip unchanged
4. Adapters MUST return responses in unified format
5. The kernel MUST NOT infer or validate semantic correctness

---

## 4. Evolution Policy

This contract may ONLY be:
- Extended via new optional fields
- Never modified or broken

Any breaking change requires a **new major contract version**.