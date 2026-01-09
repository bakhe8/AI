# Phase 4a — Consultation & Consensus Mode (Layer 2 Only)

**Status:** Approved to start (no freeze break)  
**Scope:** Add a Layer 2 consultation workflow (multi-model, snapshot-based) with transcripts and consensus display. No changes to Layer 1 / Kernel behavior. No code execution or auto-apply.

---

## 1) Principles (Re-affirm)
- Human Authority only; no auto-execution or code generation.
- Layer 1 remains raw-only and frozen; Layer 2 handles viewing/analysis/decision.
- Readiness is manual (button + cooldown); Health stays token-protected and separate.
- No context sharing between models; each model gets the same prompt+snapshot independently.
- Snapshots/transcripts must not contain secrets or operational tokens.
- Re-ask requires new guidance; refuse empty/ambiguous re-asks.

---

## 2) Artifacts & Storage
- `backend/src/consultation/` — logic, store, controller, consensus.
- `backend/src/agent/outputs/consultation/` — persisted artifacts (optional): `consult-<id>-transcript.json`, `consult-<id>-consensus.json`, `snapshot-<id>.md`. Keep sanitized; omit secrets/headers/tokens.
- `docs/phase-4a-plan.md` — this plan (source of truth for 4a scope).

---

## 3) API (Layer 2, no code apply)
- `POST /consult/start`
  - Body: `{ question: string, snapshot: string, models?: string[] }`
  - Returns: `{ consultId, status: "running" }`
  - Validates models (openai|gemini|deepseek|copilot|mock); filters unconfigured unless `mock`.
- `GET /consult/status/:id`
  - Returns progress per model: `{ status, models: [{ model, status, error? }], createdAt, completedAt? }`
- `GET /consult/transcript/:id`
  - Returns prompts/responses per model with timestamps and metadata (tokens if available).
- `GET /consult/consensus/:id`
  - Returns Layer 2 summary: `{ agreement: [...], disagreements: [...], gaps: [...], warnings: [...] }`
  - Based on simple heuristic diff of responses (no model weighting).

Guardrails:
- No endpoint to apply/commit changes.
- No retry/polling loops server-side; client may poll modestly or manual refresh.
- Snapshots/transcripts stored without secrets.

---

## 4) UI (to be built next)
- Separate from Chat/Agent UI (link-only navigation).
- Panels:
  - Question + snapshot selector (approved snapshot text).
  - Model status list (manual refresh).
  - Transcript viewer (prompt → response).
  - Consensus panel (Agreement/Disagreement/Gaps/Warnings).
  - Decision Gate (Layer 2 only): ✅ Approve (analysis/plan only), 🔄 Re-ask (requires guidance), ⛔ Stop.
- No prompts/editing in-model; single run per request; no auto-apply.

---

## 5) Execution Steps (this iteration)
1) Add consultation module (store + service + consensus heuristic) — backend only.
2) Expose APIs above and document them in README + ARCHITECTURAL-VISION.
3) Add tests using `mock` model adapters to avoid external calls.
4) (Next iteration) Add UI after backend is stable.

---

## 6) Consensus Heuristic (initial, simple)
- Agreement: same normalized sentence appears in ≥2 model responses.
- Disagreement: responses contain opposing cues (e.g., “safe” vs “vulnerable”).
- Gaps: topic appears in one response but not others (keyword extraction).
- Warnings: any model error or missing model recorded as warning.

Heuristic is Layer 2 only; does not affect Layer 1.

---

## 7) Out-of-Scope (explicit)
- No code generation or auto-apply.
- No modifications to Layer 1 / Kernel contracts.
- No new tasks/facets or registry changes.
- No UI chat features; consultation UI will be standalone later.

---

## 8) Acceptance (for this iteration)
- APIs return usable data for consultation runs with mock/default models.
- Consensus output present (even if simple) and separated from raw transcripts.
- Guardrails enforced (model validation, snapshot required, no auto-apply).
