# Local Client Read Pipeline (Modules & Context Strategy)

**هدف:** تمكين العميل المحلي من قراءة الكود بذكاء، واختيار ما يرسله للنموذج دون إغراقه.

---

## 1) هيكل Modules (backend/src/client/)
- `read-pipeline.js`
  - `runReadPipeline(root, { question, ignore, exts })` → يكتشف الملفات، يرشّحها، يقرأها، ويبني سياق نصي.
  - `splitFile(path, { chunkSize })` → تقسيم ملف كبير إلى chunks.
  - `buildContextFromFiles(question, files, { chunkSize })` → يكوّن سياقًا نصيًا من ملفات محددة مع تقسيم إن لزم.
- `__tests__/read-pipeline.test.js` → تغطية لوظائف الاختيار، التجزئة، وبناء السياق.

> لا يوجد “سحر AI”: القراءة تتم عبر fs المحلي؛ النموذج يرى نصًا فقط.

---

## 2) Read Pipeline كخطوات كود (Node.js)
```js
import { runReadPipeline } from "./client/read-pipeline.js";

const { files, context } = runReadPipeline(projectRoot, {
  question: "ما الهدف؟",
  ignore: new Set(["node_modules", ".git", "dist"]),
  exts: new Set([".js", ".ts", ".md"])
});

// files: [{ file, content }]
// context: نص جاهز للإرسال للنموذج
```

### تحت الغطاء (مرحلـة مرحلـة)
1) **Walk**: `walk(root, ignore)`  
   - يستكشف الشجرة، يتجاهل node_modules/.git/...  
2) **Filter**: `filterFiles(files, { exts, maxFiles, maxSize })`  
   - يحافظ على الامتدادات المهمة، يستبعد الملفات الكبيرة، يحد العدد.  
3) **Read**: `readFiles(selected, { maxBytesPerFile })`  
   - يقرأ محتوى النص فقط، يقطع إذا تجاوز الحد.  
4) **Chunk (اختياري)**: `splitFile(path, { chunkSize })`  
   - تقسيم ملفات طويلة لتقليل “إغراق” النموذج.  
5) **Context**: `buildContext({ question, files })`  
   - يبني نصًا موحدًا: سؤال + ملفات محددة + فواصل `---`.

---

## 3) بناء Context ذكي بدون إغراق
- **فلترة صارمة**: افتراضياً .js/.ts/.md/.json/.yml؛ تجاهل node_modules/.git/dist/coverage/…  
- **حدود حجم**: افتراضي 80KB للملف و60KB قراءة فعلية.  
- **تقسيم**: chunkSize افتراضي 4KB؛ استخدمه مع الملفات الكبيرة فقط.  
- **تحديد الهدف**: أرسل `question` أو `goal` في بداية السياق ليعرف النموذج السياق.  
- **ترتيب**: الملفات الأكبر أولاً (أرجح أن تكون ملفات تنفيذية/هامة).  
- **تجنب الأسرار**: أضف ignore لقوائم secrets/.env وما شابه.

مثال بناء سياق مع chunking:
```js
import { buildContextFromFiles, splitFile } from "./client/read-pipeline.js";

const chunks = splitFile("src/app.js", { chunkSize: 3000 });
const context = buildContextFromFiles(
  "راجع الأداء في app.js فقط",
  [{ file: "src/app.js", content: chunks.join("\n") }],
  { chunkSize: 3000 }
);
```

---

## 4) حدود وإرشادات
- لا يُرسَل أي شيء تلقائيًا؛ يجب أن تختار الجذر/السؤال.  
- النموذج لا يرى الـ filesystem؛ فقط النص الذي تبنيه.  
- يمكن ضبط ignore/exts بحسب المجال (Security/Performance/Quality).  
- اختبارات read-pipeline تمر ضمن `npm test`.

---

## 5) ما يجب فعله لاحقًا (اختياري)
- إضافة weighting للملفات حسب الهدف (مثلاً performance → src/server، security → input handlers).  
- دعم قراءات AST عند الحاجة بدلاً من النص الخام.  
- واجهة UI تسمح بتأكيد/تعديل قائمة الملفات قبل إرسال السياق.  
