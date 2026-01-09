# 🚀 دليل البدء السريع - Quick Start Guide

**ملاحظة**: هذا برنامج للاستخدام الشخصي - لا يوجد نظام مستخدمين أو authentication.

## ⚡ التشغيل السريع (5 دقائق)

### 1. تثبيت Dependencies

```bash
# Backend
cd backend
npm install

# تثبيت Anthropic SDK (جديد)
npm install @anthropic-ai/sdk
```

### 2. إعداد Environment Variables

أنشئ ملف `backend/.env`:

```env
# مطلوب: على الأقل واحد من المفاتيح التالية
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIzaSy...
DEEPSEEK_API_KEY=sk-...
GITHUB_TOKEN=ghp_...
ANTHROPIC_API_KEY=sk-ant-...

# مطلوب: لحماية endpoints
HEALTH_TOKEN=your-secret-token-here

# اختياري
NODE_ENV=development
HEALTH_ACTIVE_CHECK=false
```

### 3. تشغيل Server

```bash
cd backend
node src/server.js
```

انتظر رسالة:
```
AI Kernel running on http://localhost:3000
```

### 4. فتح الواجهات

افتح في المتصفح:
- **Chat Mode**: http://localhost:3000/
- **Agent Mode**: http://localhost:3000/agent-ui/
- **Consultation Mode**: http://localhost:3000/consult-ui/

---

## 🎯 الميزات الرئيسية

### 1. Chat Mode (4 Panels)
**الاستخدام**:
- كل panel متصل بموديل مختلف
- اكتب رسالة في أي panel
- شاهد الردود من جميع الموديلات
- WebSocket real-time updates

**الموديلات المدعومة**:
- Panel 1: OpenAI (gpt-3.5-turbo)
- Panel 2: Gemini (gemini-2.0-flash)
- Panel 3: DeepSeek (deepseek-chat)
- Panel 4: Copilot (gpt-4o)
- ✨ **جديد**: Claude (claude-3-5-sonnet)

### 2. Agent Mode (Code Analysis)
**الاستخدام**:
```
1. افتح http://localhost:3000/agent-ui/
2. الصق كود JavaScript
3. اختر Task: "JavaScript Code Audit"
4. اضغط "Run Analysis"
5. انتظر النتائج (Round 1 + Round 2 إذا لزم الأمر)
```

**التحليل يشمل**:
- Security audit
- Performance analysis
- Code quality checks
- Pattern detection
- Gap identification
- ✨ **جديد**: Round 2 للتحليل الأعمق

**الموديلات المستخدمة**:
- OpenAI + Gemini + DeepSeek
- تحليل مستقل من كل موديل
- مقارنة النتائج تلقائياً

### 3. Consultation Mode (Multi-Model Consensus)
**الاستخدام**:
```
1. افتح http://localhost:3000/consult-ui/
2. أدخل سؤال (مثال: "هل هذا الكود آمن؟")
3. الصق snapshot/code
4. اختر الموديلات (يمكن اختيار الكل)
5. ابدأ Consultation
6. شاهد Status → Transcripts → Consensus
7. ✨ **جديد**: استخدم Side-by-Side Compare
8. ✨ **جديد**: صدّر التقرير كـ JSON
```

**الميزات الجديدة**:
- مقارنة جنب لجنب
- إحصائيات مرئية
- نسخ الردود
- تصدير JSON

---

## 🔒 Rate Limiting

### الحدود الافتراضية:
- **API عام**: 60 طلب/دقيقة
- **Chat**: 30 طلب/دقيقة
- **Agent**: 10 تنفيذ/دقيقة
- **Consultation**: 60 طلب/دقيقة

### التحقق من الحدود:
```bash
# Headers في كل response:
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 30
```

### عند تجاوز الحد:
```json
{
  "error": "Too many requests",
  "code": 429,
  "message": "Rate limit exceeded. Try again in 30 seconds.",
  "retryAfter": 30
}
```

---

## 🧪 اختبار الميزات

### اختبار Claude:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "test-claude",
    "model": "claude",
    "messages": [{"role": "user", "content": "مرحبا"}]
  }'
```

### اختبار Rate Limiting:
```bash
# أرسل 70 طلب سريعاً
for i in {1..70}; do
  curl http://localhost:3000/api/health
done
# ستحصل على 429 بعد 60 طلب
```

### اختبار Round 2:
```javascript
// في Agent UI
const code = `
function unsafeEval(userInput) {
  return eval(userInput);
}
`;
// قم بتشغيل التحليل وراقب Console
// سترى "Round 2 started" إذا وُجدت gaps
```

### اختبار WebSocket Reconnection:
```javascript
// في Console:
// 1. افتح chat
// 2. أوقف server
// 3. راقب reconnection attempts
// 4. شغّل server مجدداً
// سترى: "WebSocket reconnected successfully"
```

---

## 📊 Monitoring

### Health Check:
```bash
# Basic (بدون token)
curl http://localhost:3000/api/health

# Deep (مع token)
curl -H "Authorization: Bearer your-secret-token" \
  "http://localhost:3000/api/health?deep=true"
```

### Memory Stats:
```bash
curl -H "Authorization: Bearer your-secret-token" \
  http://localhost:3000/api/memory-stats
```

---

## 🐛 استكشاف الأخطاء

### Problem: "Model unavailable"
```bash
# تحقق من:
1. API key موجود في .env
2. API key صحيح
3. لديك رصيد في الحساب
4. الاتصال بالإنترنت يعمل
```

### Problem: "Rate limit exceeded"
```bash
# الحلول:
1. انتظر دقيقة واحدة
2. قلل معدل الطلبات
3. استخدم exponential backoff
4. في development، يمكن زيادة الحدود في rate-limiter.js
```

### Problem: "WebSocket disconnected"
```bash
# التأثير:
- النظام يعمل (fallback على polling)
- سيحاول إعادة الاتصال تلقائياً
- انتظر حتى 30 ثانية للـ reconnection

# إذا استمر:
1. تحقق من console logs
2. أعد تشغيل server
3. امسح browser cache
```

### Problem: "Round 2 not running"
```bash
# الأسباب المحتملة:
1. rounds: 1 في Task config (يجب 2)
2. لا توجد gaps في Round 1
3. buildRound2Prompt() غير مطبق
4. خطأ في analysis

# التحقق:
console.log(task.rounds); // يجب 2
console.log(analysis.gaps); // يجب ليس فارغ
```

---

## 📝 الأوامر المفيدة

### Development:
```bash
# تشغيل مع watch (nodemon)
npm install -g nodemon
nodemon src/server.js

# تشغيل tests
npm test

# test coverage
npm run test:coverage
```

### Logs:
```bash
# Windows
type backend\logs\combined.log
type backend\logs\error.log

# Linux/Mac
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

### Cleanup:
```bash
# امسح logs
rm backend/logs/*.log

# امسح node_modules
rm -rf backend/node_modules
npm install
```

---

## 🎓 الموارد

### Documentation:
- [Architecture](docs/03-architecture.md)
- [Core Contract](docs/02-core-contract.md)
- [Phase 4a Plan](docs/phase-4a-plan.md)
- [Latest Updates](docs/DEVELOPMENT-UPDATE-2026-01-09.md)
- [Next Steps](docs/NEXT-STEPS-PLAN.md)

### APIs:
- Chat: `POST /api/chat`
- Agent: `POST /agent/execute`
- Consultation: `POST /consult/start`
- Health: `GET /api/health`

### Support:
- Issues: راجع logs في `backend/logs/`
- Updates: راجع `docs/DEVELOPMENT-UPDATE-*.md`

---

## ✅ Checklist قبل الاستخدام

- [ ] Node.js 18+ مثبت
- [ ] `npm install` نجح
- [ ] `@anthropic-ai/sdk` مثبت
- [ ] `.env` file موجود
- [ ] على الأقل API key واحد مضاف
- [ ] `HEALTH_TOKEN` مضاف
- [ ] Server يعمل على port 3000
- [ ] Frontend يفتح في المتصفح
- [ ] WebSocket متصل (Console: "WebSocket connected")

---

**استمتع بالاستخدام! 🚀**

للدعم: راجع `docs/` أو console logs
