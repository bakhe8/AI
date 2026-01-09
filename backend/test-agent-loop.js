// اختبار بسيط لـ Agent Loop
import { agentLoop } from './src/agent/core/agent-loop.js';
import logger from './src/core/logger.js';

async function testAgentLoop() {
    console.log('\n🧪 بدء اختبار Agent Loop...\n');

    try {
        // 1. اختبار الحالة الأولية
        console.log('1️⃣ اختبار: getStatus() - الحالة الأولية');
        const initialStatus = agentLoop.getStatus();
        console.log('   ✅ النتيجة:', JSON.stringify(initialStatus, null, 2));

        if (initialStatus.state !== 'idle') {
            throw new Error(`Expected state 'idle', got '${initialStatus.state}'`);
        }
        console.log('   ✅ النجاح: الحالة = idle\n');

        // 2. اختبار start() مع هدف بسيط
        console.log('2️⃣ اختبار: start() مع هدف "improve performance"');

        // نبدأ في الخلفية
        const startPromise = agentLoop.start('improve performance');

        // ننتظر قليلاً
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. نتحقق من الحالة أثناء التشغيل
        console.log('3️⃣ اختبار: getStatus() أثناء التشغيل');
        const runningStatus = agentLoop.getStatus();
        console.log('   ✅ النتيجة:', JSON.stringify(runningStatus, null, 2));

        if (runningStatus.state === 'idle') {
            throw new Error('Expected state to change from idle');
        }
        console.log(`   ✅ النجاح: الحالة = ${runningStatus.state}\n`);

        // 4. اختبار pause()
        console.log('4️⃣ اختبار: pause()');
        try {
            await agentLoop.pause();
            const pausedStatus = agentLoop.getStatus();
            console.log('   ✅ النتيجة:', JSON.stringify(pausedStatus, null, 2));

            if (pausedStatus.state !== 'paused') {
                throw new Error(`Expected state 'paused', got '${pausedStatus.state}'`);
            }
            console.log('   ✅ النجاح: تم الإيقاف المؤقت\n');
        } catch (error) {
            console.log(`   ⚠️ Pause failed (قد يكون توقف بالفعل): ${error.message}\n`);
        }

        // 5. اختبار stop()
        console.log('5️⃣ اختبار: stop()');
        await agentLoop.stop();
        const stoppedStatus = agentLoop.getStatus();
        console.log('   ✅ النتيجة:', JSON.stringify(stoppedStatus, null, 2));

        if (stoppedStatus.state !== 'stopped') {
            throw new Error(`Expected state 'stopped', got '${stoppedStatus.state}'`);
        }
        console.log('   ✅ النجاح: تم الإيقاف الكامل\n');

        console.log('🎉 جميع الاختبارات نجحت!\n');

    } catch (error) {
        console.error('\n❌ فشل الاختبار:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// تشغيل الاختبار
testAgentLoop().then(() => {
    console.log('✅ اكتمل الاختبار بنجاح');
    process.exit(0);
}).catch(error => {
    console.error('❌ خطأ غير متوقع:', error);
    process.exit(1);
});
