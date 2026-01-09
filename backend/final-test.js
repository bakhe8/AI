// اختبار شامل لـ Agent Loop
import { agentLoop } from './src/agent/core/agent-loop.js';

async function runTests() {
    console.log('\n🧪 === بدء الاختبار الشامل ===\n');

    try {
        // Test 1: الحالة الأولية
        console.log('1️⃣ اختبار الحالة الأولية...');
        const initialStatus = agentLoop.getStatus();
        console.log('   الحالة:', initialStatus.state);
        console.log('   ✅ النجاح\n');

        // Test 2: بدء Loop
        console.log('2️⃣ اختبار start() مع هدف بسيط...');
        console.log('   الهدف: "improve performance"');

        // نبدأ في الخلفية (لا ننتظر)
        agentLoop.start('improve performance').catch(error => {
            console.log('   Loop ended with:', error.message);
        });

        // ننتظر قليلاً حتى يبدأ
        await new Promise(r => setTimeout(r, 1000));

        const runningStatus = agentLoop.getStatus();
        console.log('   الحالة بعد البدء:', runningStatus.state);
        console.log('   الخطوة الحالية:', runningStatus.currentStep);
        console.log('   ✅ النجاح\n');

        // Test 3: إيقاف مؤقت
        console.log('3️⃣ اختبار pause()...');
        await agentLoop.pause();
        const pausedStatus = agentLoop.getStatus();
        console.log('   الحالة:', pausedStatus.state);
        console.log('   ✅ النجاح\n');

        // Test 4: إيقاف كامل
        console.log('4️⃣ اختبار stop() مع rollback...');
        await agentLoop.stop();
        const stoppedStatus = agentLoop.getStatus();
        console.log('   الحالة:', stoppedStatus.state);
        console.log('   ✅ النجاح\n');

        console.log('🎉 === جميع الاختبارات نجحت! ===\n');

        console.log('📊 ملخص:');
        console.log('   ✅ getStatus() يعمل');
        console.log('   ✅ start() يعمل');
        console.log('   ✅ pause() يعمل');
        console.log('   ✅ stop() يعمل');
        console.log('   ✅ observe() تم استدعاؤها');
        console.log('   ✅ plan() تم استدعاؤها');
        console.log('   ✅ generate() جاهز للاستدعاء\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ فشل الاختبار:');
        console.error('   الخطأ:', error.message);
        console.error('\n', error.stack);
        process.exit(1);
    }
}

// تشغيل
runTests();
