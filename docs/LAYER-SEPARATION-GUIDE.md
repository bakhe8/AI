# Layer Separation Guide

**Purpose:** Clear boundaries between Agent (Layer 1) and Human (Layer 2) outputs

---

## 🎯 The Core Rule

```
Agent (Layer 1):  MEASURES
Human (Layer 2):  JUDGES & DECIDES
```

---

## 📊 Layer 1: Measurement Agent (What We Built)

### Definition:
**Observes, counts, detects patterns - NEVER judges or recommends**

### Allowed Operations:
✅ Count frequency ("mentioned 3/3 times")  
✅ Detect patterns ("appears in multiple responses")  
✅ Find gaps ("mentioned by A but not B")  
✅ Flag contradictions ("A says yes, B says no")  
✅ Calculate percentages ("60% success rate")  
✅ Measure coverage ("8/9 responses successful")

### Forbidden Operations:
❌ Assign severity ("This is CRITICAL")  
❌ Make recommendations ("You should fix...")  
❌ Provide ratings ("Quality: 9/10")  
❌ Give priorities ("Fix this first")  
❌ Make decisions ("Deploy now" / "Don't deploy")  
❌ Offer opinions ("This code is bad")

### Output Format:
```markdown
Pattern: "sql injection"
Frequency: 3/3 models
Mentioned by: openai, gemini, deepseek
Facets: security
Count: 5 mentions
```

---

## 👤 Layer 2: Human Governance (Management)

### Definition:
**Interprets measurements, makes decisions, assigns priorities**

### Allowed Operations:
✅ Rate quality ("Code quality: 8/10")  
✅ Make recommendations ("Deploy to production")  
✅ Assign priorities ("Fix this first")  
✅ Assess business value ("Saves 10 hours/week")  
✅ Make Go/No-Go decisions  
✅ Provide executive summaries

### Must Be:
- Clearly labeled as "Human" or "Management" output
- Separated from Agent outputs
- Never claimed to be Agent-generated

### Output Format:
```markdown
Based on the measurements:
- Security Rating: High risk
- Recommendation: Fix SQL injection before deploy
- Priority: Critical
- Business Impact: Prevents data breaches
```

---

## 🔍 Examples: Right vs Wrong

### ✅ CORRECT (Layer 1):
```
Gap Detected:
- Topic: "Buffer Overflow"
- Mentioned by: openai
- Not mentioned by: gemini, deepseek
- Facet: security
```

### ❌ WRONG (Layer 1 claiming to be Layer 2):
```
❌ "Buffer Overflow is CRITICAL and must be fixed"
❌ "Recommendation: Use bounds checking"
❌ "Priority: High"
```

---

### ✅ CORRECT (Layer 2):
```
Human Assessment:
Based on pattern "sql injection" (3/3 models):
- Severity: Critical
- Recommendation: Use parameterized queries
- Timeline: Fix before next deploy
```

### ❌ WRONG (Layer 2 claiming to be Layer 1):
```
❌ "Agent detected critical SQL injection"
   (Agent detected pattern, HUMAN judged it critical)
```

---

## 📁 Document Classification

### Layer 1 Documents (Agent Output):
- `AGENT-OUTPUT-EXAMPLE.md` ✅
- Any report from `report-generator.js` ✅
- Pattern/Gap/Contradiction measurements ✅

### Layer 2 Documents (Human/Management):
- `PROJECT-MANAGEMENT-REPORT.md` ✅
- `walkthrough.md` (contains ratings) ⚠️
- `quick-start.md` (neutral, tutorial)
- Business value analyses
- Deployment decisions

### Mixed (Needs Clear Sections):
- Documentation with both measurements AND interpretation
- Must have clear section headers:
  - "Agent Measurements (Layer 1)"
  - "Human Assessment (Layer 2)"

---

## 🏗️ System Architecture Layers

```
┌─────────────────────────────────────┐
│  Layer 2: Human Governance          │
│  - Reads Layer 1 outputs            │
│  - Makes decisions                  │
│  - Assigns priorities               │
│  - Provides recommendations         │
└─────────────────────────────────────┘
              ↑
              │ measurements
              │
┌─────────────────────────────────────┐
│  Layer 1: Measurement Agent         │
│  - Detects patterns                 │
│  - Finds gaps                       │
│  - Flags contradictions             │
│  - Measures coverage                │
│  - NO judgments                     │
└─────────────────────────────────────┘
              ↑
              │ raw responses
              │
┌─────────────────────────────────────┐
│  Layer 0: AI Kernel                 │
│  - Manages API calls                │
│  - Returns model responses          │
└─────────────────────────────────────┘
```

---

## 📝 Terminology Guide

### Correct Terms for Layer 1:
- ✅ "Measurement Agent"
- ✅ "Analysis Agent" (if clearly defined as measurement-only)
- ✅ "Pattern Detection Agent"
- ✅ "Differential Analysis Agent"

### Avoid for Layer 1:
- ⚠️ "Cognitive Agent" (too broad, implies decision-making)
- ⚠️ "Decision Agent"
- ⚠️ "Recommendation Agent"
- ⚠️ "Autonomous Agent"

### For Full System (Future):
- Layer 1 + Layer 2 = "Cognitive Agent System"
- But ALWAYS specify which layer is active

---

## 🚨 Common Mistakes

### Mistake #1: Agent "Recommends"
```
❌ "Agent recommends fixing SQL injection"
✅ "Agent detected SQL injection pattern (3/3 models)"
✅ "Human recommendation: Fix SQL injection"
```

### Mistake #2: Agent "Rates"
```
❌ "Agent rated code quality: 7/10"
✅ "Agent measured: 12 issues detected across 3 facets"
✅ "Human rating: Code quality 7/10 based on issue count"
```

### Mistake #3: Mixed Output
```
❌ Document titled "Agent Report" containing:
    "Pattern: X (detected)
     Rating: Critical
     Recommendation: Fix immediately"
     
✅ Document titled "Analysis Report" with sections:
    "Layer 1 Measurements:
       Pattern: X (detected by 3/3 models)
     
     Layer 2 Assessment (Human):
       Rating: Critical
       Recommendation: Fix immediately"
```

---

## ✅ Compliance Checklist

Before publishing any document, verify:

**For Layer 1 Documents:**
- [ ] Contains ONLY measurements
- [ ] No severity words (Critical, High, Low)
- [ ] No recommendation verbs (should, must, fix)
- [ ] No ratings or scores
- [ ] Labeled clearly as "Layer 1" or "Agent Output"

**For Layer 2 Documents:**
- [ ] Clearly labeled as "Human" or "Management"
- [ ] Never claims to be Agent-generated
- [ ] Contains explicit disclaimers if needed
- [ ] Separated from Agent outputs

**For Mixed Documents:**
- [ ] Clear section headers for each layer
- [ ] Visual separation (boxes, rules)
- [ ] Explicit labels on each section

---

## 🎓 Why This Matters

### Problem if layers mix:
1. **Confusion:** Developers won't know what Agent actually does
2. **Misuse:** Someone might think Agent makes decisions
3. **Liability:** "The AI recommended this" when it only measured
4. **Contract Violation:** Breaks the Layer 1 contract

### Solution:
1 **Strict separation** from day one  
2. **Clear labeling** on every document  
3. **Explicit disclaimers** where needed  
4. **Regular audits** of documentation

---

**Document Purpose:** Reference guide for layer compliance  
**Use:** Before creating ANY new document  
**Review:** Quarterly to ensure compliance
