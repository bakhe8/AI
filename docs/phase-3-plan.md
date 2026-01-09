# Phase 3 – Usage Validation Plan

Goal: prove that Agent Layer 1 (raw measurements) delivers real incremental value in practical use, not just a “working system”.

## Core Question
Do multi-model measurements (patterns / gaps / contradictions) add knowledge that would not surface from a single model?
- Yes → proceed.
- Weak → adjust Layer 1.
- No → stop (deliberate).

## Scope & Inputs
- Exactly 5 cases (diverse, real code, not synthetic):
  1) Simple JS utility/helper
  2) Code with an obvious vulnerability
  3) Medium module/service
  4) Legacy/messy code
  5) Very clean code (reverse test)
- Prefer different sources/projects.

## Run Protocol (strict)
- Task: `js-code-audit` only.
- Same domain lock, same facets, same models across all cases.
- No prompt/feature changes between cases.

## Metrics to Observe (what matters)
- Pattern Yield: do shared patterns emerge or are models isolated?
- Gap Value: are gaps surprising/non-obvious (good) vs trivial?
- Contradiction Signal: real contradictions vs wording noise?
- Coverage Delta: which points surfaced only via multi-model?

## Not Evaluating Now (explicitly out of scope)
- Text accuracy or “best model”.
- Recommendations/solutions quality.
- Adding features/UI/extra facets/rounds.

## Outputs Required
1) **Raw Agent Outputs (Layer 1)**: 5 reports in `backend/src/agent/outputs/raw-measurements/` (no summaries/ratings/recommendations).
2) **Usage Notes (human)**: `backend/src/agent/outputs/human-reports/phase-3-usage-notes.md`
   - Where the system added value vs added noise.
   - Were gaps useful?
3) **Decision Snapshot** (one page):
   - Continue as-is / Adjust Layer 1 / Pause-Pivot.

## Success Criteria
- Phase 3 is **successful** if ≥3 of 5 cases show useful gaps or non-obvious patterns, and multi-model use “felt meaningful”.
- **Failed** if reports are similar, no added value from plurality, or only added noise (a valid outcome).

## Guardrails / Do-Nots
- Do not add facets, auto round 2, UI, or execution “intelligence”.
- Do not move to Layer 2; Layer 2 is a privilege after data shows need.
- Phase 0–2 are frozen APIs: only bug fixes permitted.

## Prep Checklist (before running)
- Set `HEALTH_TOKEN` in backend `.env` and `localStorage.health_token` in browser; confirm WS connectivity (polling fallback only when WS is down/hidden).
- Single-user scope: no channel/auth isolation; if you test with multiple users, add isolation/auth first.
- Keep Layer 1 outputs raw-only (Policy Guard enforces banned terms).
- Prepare 3–5 real JS codes/projects.
- Decide on deep health usage vs quota (enable keys + `HEALTH_ACTIVE_CHECK` or keep off).
