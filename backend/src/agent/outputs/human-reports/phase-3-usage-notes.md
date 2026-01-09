# Phase 3 Usage Notes (Human)

Run setup:
- HEALTH_TOKEN not set; kernel accessible but health gated.
- API keys: openai/gemini/copilot empty, deepseek key present initially; later runs forced keys empty to avoid outbound calls.
- WS not used for agent runs (direct HTTP via kernel-client); kernel base swapped to 127.0.0.1:65535 for some runs to avoid model calls.

Cases executed (js-code-audit, 1 round, same facets/models):
1) case-01-helper: backend/src/core/memory.js — 0/9 successes (all adapters failed). No patterns/gaps/contradictions (noise only).
2) case-02-vulnerable-sample: backend/src/agent/__tests__/e2e.test.js — 0/9 successes. No signal.
3) case-03-server-module: backend/src/server.js — 0/9 successes when hitting localhost:3000 with empty keys; rerun against closed port yielded “complete” report but underlying responses still empty (no patterns/gaps).
4) case-04-response-analyzer: backend/src/agent/analyzer/response-analyzer.js — “complete” report with 9/9 successes (deepseek produced content; openai/gemini returned placeholder text). Gaps flagged only from deepseek vs silent models; no patterns/contradictions.
5) case-05-audit-task: backend/src/agent/tasks/implementations/js-code-audit.task.js — 0/9 successes. No signal.

Value observed:
- With missing/disabled API keys, measurements collapse to failures or one-sided gaps; patterns never appear.
- The only “gaps” surfaced are artifacts of one model replying while others are effectively silent; low confidence, low utility.
- The current run did not exercise real multi-model diversity; results are not representative.

Noise / friction:
- Long timeouts when adapters lack keys; some requests stalled before completing (initial attempts hit localhost:3000 and waited).
- Kernel-client reports “complete” even when underlying responses are empty placeholders; leads to misleading 100% success in case-04.

What’s needed before a valid Phase 3:
- Provide valid API keys for at least two models to generate real multi-model content.
- Ensure adapter timeouts are short during batch runs to avoid blocking (currently some calls wait ~28s).
- Optionally add a mock-only mode for Phase 3 dry runs to skip remote calls explicitly.

Verdict on gaps usefulness (this run):
- No useful gaps or patterns emerged; data quality insufficient due to missing model responses.
