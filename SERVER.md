# AI Kernel - Server Management

## تشغيل السيرفر (3 طرق)

### الطريقة 1: استخدام Batch File (الأسهل)
```bash
# من مجلد backend
.\start.bat
```
سيقوم السكربت بإيقاف نسخة السيرفر الخاصة بهذا المشروع فقط (إن كانت تعمل)،
ويمنع التشغيل إذا كان المنفذ 3000 مشغولاً من مشروع آخر.

### الطريقة 2: استخدام npm
```bash
cd backend
npm start
```

### الطريقة 3: Node مباشرة
```bash
cd backend
node src/server.js
```

## إيقاف السيرفر

### الطريقة 1: Batch File
```bash
# من مجلد backend
.\stop.bat
```
يعتمد على ملف PID خاص بالمشروع ويتأكد من المسار قبل الإيقاف.

### الطريقة 2: Ctrl+C في Terminal
اضغط `Ctrl+C` في نفس الـ terminal الذي يعمل فيه السيرفر

### الطريقة 3: PowerShell
```powershell
Stop-Process -Name node -Force
```

## فتح المشروع

بعد تشغيل السيرفر، افتح:
```
http://localhost:3000
```

## Health endpoint (محمية دائماً)
- `/api/health` تتطلب هيدر `Authorization: Bearer <HEALTH_TOKEN>` في جميع البيئات.
- أضف `HEALTH_TOKEN` إلى ملف `backend/.env`.
- لتفعيل مؤشرات الحالة في المتصفح: نفّذ في الـ Console `localStorage.setItem('health_token','<token>')` ثم أعد التحميل.
- الفحص العميق (`?deep=true` أو `HEALTH_ACTIVE_CHECK=true`) يُخزَّن في كاش لمدة 60 ثانية لتقليل استهلاك المزودات.

## إحصاءات الذاكرة
- `/api/memory-stats` محجوبة في وضع الإنتاج (403).
- للاستخدام المحلي فقط أثناء التطوير.
- إذا كان `HEALTH_TOKEN` مضبوطاً، فالنقطة تتطلب نفس التوكن.

## استكشاف الأخطاء

### السيرفر لا يعمل؟
1. تأكد أنك في مجلد backend
2. تحقق من وجود ملف .env
3. تأكد أن port 3000 غير مستخدم
4. راجع ملفات السجل:
   - backend\server.log
   - backend\server.error.log

### التحقق من أن السيرفر يعمل:
```powershell
Test-NetConnection localhost -Port 3000
```

### رؤية أخطاء السيرفر:
شغل السيرفر مباشرة لرؤية الأخطاء:
```bash
cd backend
node src/server.js
```
