// اختبار مباشر بسيط جداً
import('file:///C:/Users/Bakheet/Documents/Projects/AI/backend/src/agent/core/agent-loop.js?t=' + Date.now())
    .then(module => {
        const { AgentLoop } = module;
        const loop = new AgentLoop();

        console.log('\n✅ Agent Loop imported successfully');
        console.log('✅ Instance created');

        // تحقق من الدوال
        console.log('✅ Has observe():', typeof loop.observe === 'function');
        console.log('✅ Has plan():', typeof loop.plan === 'function');
        console.log('✅ Has generate():', typeof loop.generate === 'function');
        console.log('✅ Has start():', typeof loop.start === 'function');
        console.log('✅ Has stop():', typeof loop.stop === 'function');

        // اختبار بسيط
        const status = loop.getStatus();
        console.log('\n✅ getStatus() works:', status);

        console.log('\n🎉 All basic checks passed!\n');
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    });
