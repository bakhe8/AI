# API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:3000`  
**Purpose:** REST API for Agent System

---

## Overview

The Agent API provides programmatic access to the Agent analysis system.

**Key Endpoints:**
- `/agent/tasks` - List available tasks
- `/agent/execute` - Start analysis
- `/agent/status/:id` - Poll execution status
- `/agent/results/:id` - Get analysis results
- `/api/check-readiness` - Check model availability

---

## Authentication

**Current:** None (internal use)  
**Production:** Add authentication if deploying externally

---

## Endpoints

### 1. List Tasks

**GET** `/agent/tasks`

Returns list of available analysis tasks.

**Response:** `200 OK`
```json
[
  {
    "id": "js-code-audit",
    "name": "JavaScript Code Audit",
    "description": "Multi-facet code analysis",
    "inputType": "code"
  }
]
```

---

### 2. Execute Task

**POST** `/agent/execute`

Starts asynchronous analysis task.

**Request:**
```json
{
  "taskId": "js-code-audit",
  "input": {
    "type": "code",
    "content": "function login(user, pass) { ... }"
  }
}
```

**Response:** `202 Accepted`
```json
{
  "executionId": "agent-js-code-audit-1736421234567",
  "status": "running"
}
```

**Errors:**
- `400` - Invalid taskId or input
- `500` - Server error

---

### 3. Get Status

**GET** `/agent/status/:executionId`

Polls current execution status.

**Response:** `200 OK`
```json
{
  "executionId": "agent-js-code-audit-1736421234567",
  "status": "running",
  "progress": {
    "current": 5,
    "total": 9
  },
  "stats": {
    "startTime": "2026-01-09T11:00:00.000Z",
    "apiCalls": 5
  }
}
```

**Status Values:**
- `running` - In progress
- `complete` - Finished successfully
- `error` - Failed

**Errors:**
- `404` - Execution not found
- `500` - Server error

---

### 4. Get Results

**GET** `/agent/results/:executionId`

Retrieves analysis results (when complete).

**Response:** `200 OK`
```json
{
  "executionId": "agent-js-code-audit-1736421234567",
  "status": "complete",
  "patterns": [
    {
      "text": "sql injection",
      "models": ["openai", "gemini", "deepseek"],
      "frequency": "3/3",
      "facets": ["security"],
      "count": 5
    }
  ],
  "gaps": [
    {
      "facet": "security",
      "topic": "xss",
      "mentionedBy": ["gemini"],
      "missedBy": ["openai", "deepseek"]
    }
  ],
  "contradictions": [
    {
      "facet": "security",
      "type": "no-issues-vs-issues",
      "modelsA": ["openai"],
      "modelsB": ["gemini", "deepseek"]
    }
  ],
  "metrics": {
    "security": {
      "total": 3,
      "successful": 3,
      "failed": 0,
      "percentage": 100
    }
  },
  "rawReport": "# Raw Measurement Report: ..."
}
```

**Errors:**
- `404` - Execution not found
- `500` - Server error

---

### 5. Check Readiness

**POST** `/api/check-readiness`

Checks if a model is ready/available.

**Request:**
```json
{
  "model": "openai"
}
```

**Response:** `200 OK`
```json
{
  "status": "ready"
}
```

**Status Values:**
- `ready` - Model configured and available
- `busy` - Cooldown active (10s)
- `unavailable` - Not configured

**Optional `reason`:**
```json
{
  "status": "unavailable",
  "reason": "model not configured"
}
```

**Models:**
- `openai`
- `gemini`
- `deepseek`
- `copilot`

---

## Usage Example

### Node.js:

```javascript
const baseURL = 'http://localhost:3000';

// 1. List tasks
const tasks = await fetch(`${baseURL}/agent/tasks`).then(r => r.json());
console.log(tasks);

// 2. Execute
const code = `function test() { eval(userInput); }`;
const exec = await fetch(`${baseURL}/agent/execute`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    taskId: 'js-code-audit',
    input: { type: 'code', content: code }
  })
}).then(r => r.json());

const executionId = exec.executionId;

// 3. Poll status
while (true) {
  const status = await fetch(`${baseURL}/agent/status/${executionId}`)
    .then(r => r.json());
  
  console.log(status.status, status.progress);
  
  if (status.status === 'complete' || status.status === 'error') {
    break;
  }
  
  await new Promise(r => setTimeout(r, 1000)); // 1s
}

// 4. Get results
const results = await fetch(`${baseURL}/agent/results/${executionId}`)
  .then(r => r.json());

console.log('Patterns:', results.patterns);
console.log('Gaps:', results.gaps);
console.log('Report:', results.rawReport);
```

---

## Layer 1 Compliance

**CRITICAL:** All Agent outputs are Layer 1 (measurements only).

### What Results Contain:
- ✅ Pattern frequency counts
- ✅ Gap detection (what was missed)
- ✅ Contradiction flags
- ✅ Coverage percentages

### What Results DO NOT Contain:
- ❌ Severity ratings ("Critical", "High")
- ❌ Recommendations ("You should fix...")
- ❌ Priority rankings
- ❌ Judgments

**See:** [LAYER-SEPARATION-GUIDE.md](./LAYER-SEPARATION-GUIDE.md)

---

## Rate Limiting

**Current:** None  
**Recommendation:** Add if exposing externally

---

## Timeouts

- **Execution:** ~10-30s (3 models × 3 facets)
- **Status polling:** Poll every 1s
- **Results:** Available immediately after completion

---

## Error Handling

All errors follow this format:
```json
{
  "error": "Error message",
  "code": 400
}
```

**HTTP Status Codes:**
- `200` - Success
- `202` - Accepted (async started)
- `400` - Bad request
- `404` - Not found
- `500` - Server error

---

**For UI usage:** See Agent UI at `/agent-ui/`  
**For setup:** See [quick-start.md](./quick-start.md)
