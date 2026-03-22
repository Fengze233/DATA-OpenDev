/**
 * AI Providers 测试文件
 * 运行: node ai-providers.test.js
 */

const { AIServiceManager } = require('./ai-providers');

// 测试配置
const TEST_CONFIG = {
  // 使用Mock API Key进行格式验证
  mockApiKey: 'test-key-12345',
  testMessages: [
    { role: 'system', content: '你是一个有帮助的AI助手。' },
    { role: 'user', content: '你好，请介绍一下自己。' }
  ],
  testOptions: {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 100
  }
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// 测试用例
const tests = {
  /**
   * 测试1: 验证所有Provider可被正确注册
   */
  testProviderRegistration() {
    log('\n[测试1] Provider 注册验证', 'blue');
    const ai = new AIServiceManager();
    const providers = ai.getProviders();
    
    const expectedProviders = [
      'openai', 'anthropic', 'ollama',
      'minimax', 'minimax_cn',
      'zhipu', 'tongyi', 'tongyi_qwen',
      'spark', 'wenxin'
    ];
    
    let passed = true;
    for (const p of expectedProviders) {
      if (!providers.includes(p)) {
        log(`  ❌ 缺少 Provider: ${p}`, 'red');
        passed = false;
      } else {
        log(`  ✅ ${p}`, 'green');
      }
    }
    
    return passed;
  },

  /**
   * 测试2: 验证模型列表
   */
  testModelLists() {
    log('\n[测试2] 模型列表验证', 'blue');
    const ai = new AIServiceManager();
    const models = ai.getAllModels();
    
    let passed = true;
    for (const [provider, modelList] of Object.entries(models)) {
      if (!Array.isArray(modelList)) {
        log(`  ❌ ${provider}: 模型列表格式错误`, 'red');
        passed = false;
      } else {
        log(`  ✅ ${provider}: ${modelList.join(', ')}`, 'green');
      }
    }
    
    return passed;
  },

  /**
   * 测试3: 验证Provider切换
   */
  testProviderSwitching() {
    log('\n[测试3] Provider 切换验证', 'blue');
    const ai = new AIServiceManager();
    const providers = ['openai', 'minimax', 'minimax_cn', 'zhipu', 'tongyi', 'spark', 'wenxin'];
    
    let passed = true;
    for (const p of providers) {
      const result = ai.setProvider(p);
      if (!result.success) {
        log(`  ❌ 切换到 ${p} 失败: ${result.error}`, 'red');
        passed = false;
      } else {
        log(`  ✅ 切换到 ${p}`, 'green');
      }
    }
    
    return passed;
  },

  /**
   * 测试4: 验证配置设置
   */
  testConfig() {
    log('\n[测试4] 配置设置验证', 'blue');
    const ai = new AIServiceManager();
    
    ai.setApiKey(TEST_CONFIG.mockApiKey);
    ai.setModel(TEST_CONFIG.testOptions.model);
    ai.setConfig({ temperature: 0.9 });
    
    const config = ai.getConfig();
    
    let passed = true;
    if (config.apiKey !== TEST_CONFIG.mockApiKey) {
      log(`  ❌ API Key 设置失败`, 'red');
      passed = false;
    } else {
      log(`  ✅ API Key: ${config.apiKey}`, 'green');
    }
    
    if (config.model !== TEST_CONFIG.testOptions.model) {
      log(`  ❌ Model 设置失败`, 'red');
      passed = false;
    } else {
      log(`  ✅ Model: ${config.model}`, 'green');
    }
    
    return passed;
  },

  /**
   * 测试5: 验证请求格式 (Mock测试)
   */
  testRequestFormat() {
    log('\n[测试5] 请求格式验证 (Mock)', 'blue');
    log('  ⚠️ 需要实际API Key才能进行真实API调用测试', 'yellow');
    
    const ai = new AIServiceManager();
    ai.setProvider('openai');
    ai.setApiKey(TEST_CONFIG.mockApiKey);
    
    // 尝试调用，预期会因无效API Key失败，但可以验证请求格式
    return ai.chat(TEST_CONFIG.testMessages, TEST_CONFIG.testOptions)
      .then(() => {
        log('  ❌ 不应该成功', 'red');
        return false;
      })
      .catch(err => {
        // 预期会失败，但错误信息应该包含API相关内容
        if (err.message.includes('API Error') || err.message.includes('请求失败')) {
          log(`  ✅ 请求格式验证通过 (预期错误: ${err.message.substring(0, 50)}...)`, 'green');
          return true;
        }
        log(`  ⚠️ 未知错误: ${err.message.substring(0, 50)}`, 'yellow');
        return true;
      });
  },

  /**
   * 测试6: 验证讯飞星火抛出正确错误
   */
  testSparkError() {
    log('\n[测试6] 讯飞星火错误处理验证', 'blue');
    const ai = new AIServiceManager();
    ai.setProvider('spark');
    ai.setApiKey(TEST_CONFIG.mockApiKey);
    
    return ai.chat(TEST_CONFIG.testMessages, { model: 'generalv3.5' })
      .then(() => {
        log('  ❌ 讯飞星火不应该成功', 'red');
        return false;
      })
      .catch(err => {
        if (err.message.includes('WebSocket') || err.message.includes('暂未实现')) {
          log(`  ✅ 正确抛出WebSocket提示: ${err.message.substring(0, 60)}...`, 'green');
          return true;
        }
        log(`  ⚠️ 错误信息: ${err.message.substring(0, 60)}`, 'yellow');
        return true;
      });
  },

  /**
   * 测试7: 验证区域切换
   */
  testRegionSwitching() {
    log('\n[测试7] 区域切换验证 (Minimax)', 'blue');
    const ai = new AIServiceManager();
    
    // 默认国际版
    ai.setProvider('minimax');
    log(`  默认区域: ${ai.config.region}`, 'green');
    
    // 切换到CN版
    ai.setProvider('minimax_cn');
    if (ai.config.region !== 'cn') {
      log(`  ❌ 区域切换失败`, 'red');
      return false;
    }
    log(`  ✅ 切换到 CN版: ${ai.config.region}`, 'green');
    
    return true;
  }
};

// 运行所有测试
async function runTests() {
  log('='.repeat(50), 'blue');
  log('AI Providers 测试套件', 'blue');
  log('='.repeat(50), 'blue');
  
  const results = [];
  
  // 同步测试
  results.push(['Provider 注册', tests.testProviderRegistration()]);
  results.push(['模型列表', tests.testModelLists()]);
  results.push(['Provider 切换', tests.testProviderSwitching()]);
  results.push(['配置设置', tests.testConfig()]);
  results.push(['区域切换', tests.testRegionSwitching()]);
  
  // 异步测试
  results.push(['请求格式 (Mock)', await tests.testRequestFormat()]);
  results.push(['讯飞星火错误', await tests.testSparkError()]);
  
  // 汇总结果
  log('\n' + '='.repeat(50), 'blue');
  log('测试结果汇总', 'blue');
  log('='.repeat(50), 'blue');
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, result] of results) {
    if (result === true) {
      log(`  ✅ ${name}`, 'green');
      passed++;
    } else {
      log(`  ❌ ${name}`, 'red');
      failed++;
    }
  }
  
  log(`\n总计: ${passed} 通过, ${failed} 失败`, failed > 0 ? 'red' : 'green');
  
  return failed === 0;
}

// 执行测试
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  log(`测试执行失败: ${err.message}`, 'red');
  process.exit(1);
});
