/**
 * AI Code Enhancement 测试文件
 * 运行: node ai-code-enhancer.test.js
 */

const { AICodeEnhancer, createAICodeEnhancer } = require('./ai-code-enhancer');

// 模拟AI管理器
const mockAIManager = {
  chatWithSystem: async (system, user, options) => {
    // 模拟响应
    return {
      content: `模拟AI响应: ${user.substring(0, 50)}...`,
      provider: 'mock'
    };
  }
};

console.log('='.repeat(50));
console.log('AI Code Enhancement 测试');
console.log('='.repeat(50));

// 测试1: 创建实例
console.log('\n[测试1] 创建AI代码增强器');
try {
  const enhancer = createAICodeEnhancer({
    provider: 'openai',
    model: 'gpt-4'
  });
  console.log('  ✅ 实例创建成功');
  console.log(`     Provider: ${enhancer.config.provider}`);
  console.log(`     Model: ${enhancer.config.model}`);
} catch (e) {
  console.log('  ❌ 创建失败:', e.message);
}

// 测试2: 配置
console.log('\n[测试2] 配置测试');
try {
  const enhancer = createAICodeEnhancer();
  enhancer.configure({
    provider: 'anthropic',
    model: 'claude-3',
    temperature: 0.5
  });
  console.log('  ✅ 配置成功');
  console.log(`     Provider: ${enhancer.config.provider}`);
  console.log(`     Model: ${enhancer.config.model}`);
  console.log(`     Temperature: ${enhancer.config.temperature}`);
} catch (e) {
  console.log('  ❌ 配置失败:', e.message);
}

// 测试3: 智能补全
console.log('\n[测试3] 智能补全 (Mock)');
try {
  const enhancer = createAICodeEnhancer();
  enhancer.aiManager = mockAIManager; // 使用mock
  
  enhancer.getCompletion(
    'function hello() {\n  console.log("',
    'javascript',
    20
  ).then(result => {
    console.log('  ✅ 补全请求成功');
    console.log(`     Success: ${result.success}`);
    if (result.success) {
      console.log(`     Content: ${result.content.substring(0, 60)}...`);
      console.log(`     Provider: ${result.provider}`);
    }
  });
} catch (e) {
  console.log('  ❌ 补全失败:', e.message);
}

// 测试4: 代码解释
console.log('\n[测试4] 代码解释 (Mock)');
try {
  const enhancer = createAICodeEnhancer();
  enhancer.aiManager = mockAIManager;
  
  enhancer.explainCode(
    'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}',
    'javascript'
  ).then(result => {
    console.log('  ✅ 解释请求成功');
    console.log(`     Success: ${result.success}`);
  });
} catch (e) {
  console.log('  ❌ 解释失败:', e.message);
}

// 测试5: 重构建议
console.log('\n[测试5] 重构建议 (Mock)');
try {
  const enhancer = createAICodeEnhancer();
  enhancer.aiManager = mockAIManager;
  
  enhancer.suggestRefactoring(
    'function process(data) {\n  var result = [];\n  for(var i = 0; i < data.length; i++) {\n    if(data[i].active) {\n      result.push(data[i].value * 2);\n    }\n  }\n  return result;\n}',
    'javascript',
    'readability'
  ).then(result => {
    console.log('  ✅ 重构请求成功');
    console.log(`     Success: ${result.success}`);
  });
} catch (e) {
  console.log('  ❌ 重构失败:', e.message);
}

// 测试6: 代码生成
console.log('\n[测试6] 代码生成 (Mock)');
try {
  const enhancer = createAICodeEnhancer();
  enhancer.aiManager = mockAIManager;
  
  enhancer.generateCode(
    '创建一个函数，计算数组中所有偶数的和',
    'javascript'
  ).then(result => {
    console.log('  ✅ 生成请求成功');
    console.log(`     Success: ${result.success}`);
  });
} catch (e) {
  console.log('  ❌ 生成失败:', e.message);
}

// 测试7: Bug修复
console.log('\n[测试7] Bug修复 (Mock)');
try {
  const enhancer = createAICodeEnhancer();
  enhancer.aiManager = mockAIManager;
  
  enhancer.fixBug(
    'function divide(a, b) {\n  return a / b;\n}',
    'javascript',
    'Division by zero'
  ).then(result => {
    console.log('  ✅ 修复请求成功');
    console.log(`     Success: ${result.success}`);
  });
} catch (e) {
  console.log('  ❌ 修复失败:', e.message);
}

// 测试8: 代码优化
console.log('\n[测试8] 代码优化 (Mock)');
try {
  const enhancer = createAICodeEnhancer();
  enhancer.aiManager = mockAIManager;
  
  enhancer.optimizeCode(
    'for (var i = 0; i < items.length; i++) {\n  console.log(items[i]);\n}',
    'javascript'
  ).then(result => {
    console.log('  ✅ 优化请求成功');
    console.log(`     Success: ${result.success}`);
  });
} catch (e) {
  console.log('  ❌ 优化失败:', e.message);
}

// 测试9: 生成测试
console.log('\n[测试9] 生成单元测试 (Mock)');
try {
  const enhancer = createAICodeEnhancer();
  enhancer.aiManager = mockAIManager;
  
  enhancer.generateTests(
    'function add(a, b) { return a + b; }',
    'javascript',
    'jest'
  ).then(result => {
    console.log('  ✅ 测试生成请求成功');
    console.log(`     Success: ${result.success}`);
  });
} catch (e) {
  console.log('  ❌ 测试生成失败:', e.message);
}

// 测试10: 代码翻译
console.log('\n[测试10] 代码翻译 (Mock)');
try {
  const enhancer = createAICodeEnhancer();
  enhancer.aiManager = mockAIManager;
  
  enhancer.translateCode(
    'function hello() { return "Hello"; }',
    'javascript',
    'python'
  ).then(result => {
    console.log('  ✅ 翻译请求成功');
    console.log(`     Success: ${result.success}`);
  });
} catch (e) {
  console.log('  ❌ 翻译失败:', e.message);
}

console.log('\n' + '='.repeat(50));
console.log('测试完成 (Mock模式)');
console.log('='.repeat(50));
console.log('\n注意: 需要配置真实API Key才能进行实际测试');
console.log('配置方式:');
console.log('  enhancer.configure({ provider: "openai", apiKey: "your-key" })');
console.log('  或');
console.log('  enhancer.configure({ provider: "zhipu", apiKey: "your-key" })');
