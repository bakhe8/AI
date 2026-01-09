# Agent UI Contract

Purpose: Execute predefined Agent tasks and display Layer 1 measurement outputs only.

Explicit prohibitions:
- No chat or free-text questioning.
- No prompt editing or tuning.
- No model/facet selection changes.
- No recommendations, summaries, ratings, or deployment guidance.
- No “smart” buttons or reinterpretation actions.

Interaction rules:
- All executions are task-driven with predefined tasks only.
- Inputs are artifacts only (code/file upload or paste).
- Each run is isolated; one run = one result.
- Outputs are read-only (patterns, gaps, contradictions, metrics, raw report).

Governance:
- Any UI change that adds conversational interaction, interpretation, or Layer 2 behavior requires explicit approval and must be documented as Layer 2+.
