# Changelog - AI Kernel

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

**Project Type**: Personal productivity tool (single-user) 👤  
**No authentication or multi-user support needed.**

---

## [0.5.0] - 2026-01-09

### 🎉 Added
- **Claude Support**: Full integration of Anthropic Claude API as 6th model
  - New adapter: `claude.adapter.js`
  - Support for system messages (Claude requirement)
  - Environment variables: `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`
  - Updated all related systems (registry, contract, health, consultation)

- **Rate Limiting System**: Comprehensive API protection
  - New module: `rate-limiter.js`
  - Different limits per endpoint type (general: 60/min, chat: 30/min, agent: 10/min)
  - Response headers: `X-RateLimit-*`
  - IP-based tracking with custom identifier support
  - Auto-cleanup of old data

- **Round 2 Agent Analysis**: Conditional deep-dive analysis
  - New functions in orchestrator: `shouldRunRound2()`, `executeRound2()`, `identifyRound2Targets()`
  - Gap-focused targeted prompts
  - Implemented in `js-code-audit.task.js`
  - Automatically triggered when gaps/contradictions detected or coverage < 70%

- **Export Reports Feature**: Download consultation results
  - Export as JSON with all data (status, transcripts, consensus)
  - Auto-naming: `consultation-{id}-{timestamp}.json`
  - Button in consultation UI

### ✨ Enhanced
- **Consultation UI**:
  - Side-by-side comparison view for model responses
  - Visual statistics dashboard (Agreement, Disagreements, Gaps, Warnings)
  - Copy button for each model response
  - Toggle between List View and Compare View
  - Improved CSS styling and layout

- **WebSocket Handling**:
  - Exponential backoff reconnection (1s → 2s → 4s → ... → max 30s)
  - Connection attempt tracking
  - Better error messages in console
  - Auto-reconnect on disconnect

### 🔧 Changed
- Updated `js-code-audit.task.js`: `rounds: 1` → `rounds: 2`
- Updated `package.json`: Added `@anthropic-ai/sdk` dependency
- Updated `README.md`: New features documentation
- Updated `contract.js`: Added "claude" to ALLOWED_MODELS

### 📚 Documentation
- Added `docs/DEVELOPMENT-UPDATE-2026-01-09.md`: Detailed update log
- Added `docs/NEXT-STEPS-PLAN.md`: Future development roadmap
- Added `docs/IMPLEMENTATION-SUMMARY.md`: Summary of all changes
- Added `QUICK-START.md`: Quick start guide
- Updated `README.md`: Comprehensive update with new features

### 🐛 Fixed
- WebSocket reconnection infinite loop issue
- Missing error handling in consultation service
- Rate limit bypass for health endpoints

---

## [0.4.0] - 2025-12-XX (Phase 4)

### Added
- Consultation & Consensus mode (Layer 2)
- Multi-model independent analysis
- Consensus building (agreement, disagreements, gaps)
- Consultation UI at `/consult-ui/`
- Decision gate (approve/re-ask/stop)

### Changed
- Layer separation enforced
- No recommendations in Layer 1 outputs

---

## [0.3.0] - 2025-11-XX (Phase 3)

### Added
- Agent usage validation
- Real-world testing with 5 code samples
- Phase 3 usage notes and reports

### Enhanced
- Response analyzer improvements
- Report generator refinements

---

## [0.2.0] - 2025-10-XX (Phase 2)

### Added
- Response Analyzer (patterns, gaps, contradictions)
- Report Generator (raw measurements)
- Enhanced state management
- Progress tracking

---

## [0.1.0] - 2025-09-XX (Phase 1)

### Added
- Agent Orchestrator system
- Task Registry and base tasks
- Facet Library (security, performance, quality)
- Kernel Client bridge
- JS Code Audit task
- Agent UI at `/agent-ui/`

---

## [0.0.1] - 2025-08-XX (Phase 0)

### Added
- Initial release: AI Kernel (neutral message transport)
- 4 model adapters: OpenAI, Gemini, DeepSeek, Copilot
- Mock adapter for testing
- Contract validation
- Health check system
- WebSocket support
- Memory management (in-memory, TTL-based)
- Frontend with 4 panels
- Core error handling
- Logging system (Winston)

---

## 📋 Types of Changes
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
- `Enhanced` for improvements to existing features

---

## 🔮 Coming Soon (Planned)

### [0.6.0] - Q1 2026
- Database persistence (PostgreSQL/MongoDB)
- Authentication & authorization system
- User management
- JWT tokens

### [0.7.0] - Q1 2026
- Monitoring dashboard
- Metrics collection
- Cost tracking
- Analytics

### [0.8.0] - Q2 2026
- Advanced NLP analyzer
- Multi-language code support (Python, TypeScript, etc.)
- Plugin system architecture

---

**For detailed information about any release, see the corresponding documentation in `docs/`.**
