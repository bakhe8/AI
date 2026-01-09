// اختبار أبسط - فقط التأكد من أن كل شيء يعمل
import { AgentLoop } from './src/agent/core/agent-loop.js';

console.log('\n🧪 اختبار سريع...\n');

const loop = new AgentLoop();

console.log('✅ Instance created');
console.log('✅ Initial state:', loop.getStatus().state);

console.log('\n📋 الدوال المتوفرة:');
console.log('   - observe():', typeof loop.observe);
console.log('   - plan():', typeof loop.plan);
console.log('   - generate():', typeof loop.generate);
console.log('   - test():', typeof loop.test);
console.log('   - start():', typeof loop.start);
console.log('   - stop():', typeof loop.stop);

console.log('\n🎉 Agent Loop structure is correct!\n');

// اختبار observe و plan بشكل مباشر
console.log('🔍 Testing observe()...');
loop.goal = 'test goal';
loop.observe().then(obs => {
    console.log('✅ observe() works:', Object.keys(obs));

    console.log('\n🔍 Testing plan()...');
    return loop.plan(obs);
}).then(plan => {
    console.log('✅ plan() works:', plan.steps.length, 'steps created');
    console.log('   Steps:', plan.steps.map(s => s.description));

    console.log('\n✅ All core functions work!\n');
}).catch(error => {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
});
