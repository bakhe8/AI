# AI Kernel – Copilot Instructions

## System Orientation
- Phase-0 kernel ferries messages between four browser panels and AI model adapters; authoritative rules live in [docs/01-concept.md](docs/01-concept.md) through [docs/04-phase-0-spec.md](docs/04-phase-0-spec.md) and must remain unchanged.
- The unified JSON contract is enforced end-to-end; mirror the shapes in [docs/02-core-contract.md](docs/02-core-contract.md) whenever adding handlers or adapters.

## Runtime Workflow
- Backend runs with Node 18+ ESM: `cd backend && npm install && node src/server.js`; static frontend is served from `frontend/` by Express.
- Configure API keys in backend/.env (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`); leave unset to fall back on the mock adapter.
- Frontend can be opened directly or via `cd frontend && npx serve .` to avoid CORS when the backend is remote.

## Backend Patterns
- [backend/src/server.js](backend/src/server.js) mounts a single `POST /api/chat`; keep new routes aligned with Express JSON body parsing and static asset serving.
- [backend/src/api/chat.controller.js](backend/src/api/chat.controller.js) validates via `validateContract` and always echoes `channel_id`; preserve this flow to avoid cross-panel leakage.
- [backend/src/core/contract.js](backend/src/core/contract.js) only checks top-level shape; if deeper validation is needed, extend without mutating payload content.
- [backend/src/core/router.js](backend/src/core/router.js) resolves adapters; whenever you add a model, update [backend/src/adapters/registry.js](backend/src/adapters/registry.js) and keep the default pointing at the mock adapter for safety.

## Adapter Guidelines
- Each adapter in [backend/src/adapters](backend/src/adapters) must translate the unified `messages` array into provider format and return `{ role, content }` only; do not inject system prompts.
- When integrating external SDKs (see [backend/src/adapters/openai.adapter.js](backend/src/adapters/openai.adapter.js) and [backend/src/adapters/deepseek.adapter.js](backend/src/adapters/deepseek.adapter.js)), cache the client and surface human-readable error strings so the UI can display them.
- Pure REST adapters (see [backend/src/adapters/gemini.adapter.js](backend/src/adapters/gemini.adapter.js)) should extract the final assistant text and guard against structural changes from the vendor.

## Frontend Notes
- Panels in [frontend/index.html](frontend/index.html) map to models via `data-model`; new panels require matching registry entries.
- [frontend/app.js](frontend/app.js) sends a single-message array with `channel_id = panel-*`; keep reply payloads compliant so `addMessage` can render without branching.

## Phase 0 Guardrails
- Never persist conversation state or modify message content; the kernel must remain neutral transport.
- Respect the trust boundary spelled out in [docs/03-architecture.md](docs/03-architecture.md); API keys and adapters stay server-side.
- Prefer consulting docs/ before code for behavior questions; the docs are considered the source of truth.
