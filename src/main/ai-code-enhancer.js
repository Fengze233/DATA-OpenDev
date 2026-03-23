/**
 * AI Code Enhancement Service - OpenDev IDE
 * Phase 3.5: AI代码增强功能
 * 作者: 调度
 * 
 * 核心功能:
 * - 智能补全（基于上下文的AI建议）
 * - 代码解释（选中代码后AI解释）
 * - 重构建议（AI提供重构方案）
 * - 代码生成（自然语言生成代码）
 * - Bug修复（AI分析并修复）
 */

const { AIServiceManager } = require('./ai-providers');

/**
 * AI代码增强服务
 */
class AICodeEnhancer {
  constructor() {
    // 初始化AI服务管理器
    this.aiManager = new AIServiceManager();
    
    // 配置
    this.config = {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000
    };
    
    // 补全缓存
    this.completionCache = new Map();
    this.cacheTimeout = 30000; // 30秒缓存
  }

  /**
   * 配置AI服务
   */
  configure(options) {
    if (options.provider) {
      this.aiManager.setProvider(options.provider);
    }
    if (options.apiKey) {
      this.aiManager.setApiKey(options.apiKey);
    }
    if (options.model) {
      this.aiManager.setModel(options.model);
    }
    this.config = { ...this.config, ...options };
    return this;
  }

  /**
   * 智能补全 - 基于上下文提供代码建议
   * @param {string} code - 当前代码上下文
   * @param {string} language - 编程语言
   * @param {number} cursorPosition - 光标位置
   */
  async getCompletion(code, language, cursorPosition) {
    const prompt = `你是一个代码补全助手。根据以下代码上下文，预测用户可能想要输入的代码片段。

当前语言: ${language}
代码上下文:
\`\`\`${language}
${code}
\`\`\`

请只返回最可能的补全代码，不需要解释。如果不需要补全，返回空。`;

    try {
      const result = await this.aiManager.chatWithSystem(
        '你是一个专业的代码补全助手。',
        prompt,
        { temperature: 0.3, maxTokens: 500 }
      );
      
      return {
        success: true,
        content: result.content,
        provider: result.provider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 代码解释 - 解释选中代码的功能
   * @param {string} code - 要解释的代码
   * @param {string} language - 编程语言
   */
  async explainCode(code, language) {
    const prompt = `你是一个代码解释器。请用简洁清晰的语言解释以下${language}代码的功能和工作原理。

\`\`\`${language}
${code}
\`\`\`

要求:
- 用通俗易懂的语言解释
- 说明代码的主要功能和逻辑流程
- 如果有复杂算法，简要说明其思路`;

    try {
      const result = await this.aiManager.chatWithSystem(
        '你是一个专业的代码解释器，擅长用通俗易懂的语言解释复杂代码。',
        prompt,
        { temperature: 0.7, maxTokens: 1000 }
      );
      
      return {
        success: true,
        explanation: result.content,
        provider: result.provider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 重构建议 - 提供代码改进方案
   * @param {string} code - 要重构的代码
   * @param {string} language - 编程语言
   * @param {string} goal - 重构目标 (可选: performance, readability, maintainability)
   */
  async suggestRefactoring(code, language, goal = 'readability') {
    const goalDescriptions = {
      performance: '性能优化',
      readability: '提高可读性',
      maintainability: '提高可维护性',
      modularization: '模块化'
    };

    const prompt = `你是一个代码重构专家。请分析以下${language}代码，并提供${goalDescriptions[goal] || '可读性'}方面的重构建议。

原始代码:
\`\`\`${language}
${code}
\`\`\`

请按以下格式返回:
1. 问题分析: 简要说明当前代码存在的问题
2. 重构方案: 提供改进后的代码
3. 改进说明: 解释主要改进点`;

    try {
      const result = await this.aiManager.chatWithSystem(
        '你是一个专业的代码重构专家，擅长优化代码结构和设计模式。',
        prompt,
        { temperature: 0.7, maxTokens: 1500 }
      );
      
      return {
        success: true,
        suggestion: result.content,
        provider: result.provider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 代码生成 - 自然语言生成代码
   * @param {string} description - 代码描述
   * @param {string} language - 目标语言
   * @param {string} context - 上下文代码（可选）
   */
  async generateCode(description, language, context = '') {
    const contextSection = context 
      ? `\n\n现有代码上下文:\n\`\`\`${language}\n${context}\n\`\`\`` 
      : '';

    const prompt = `你是一个代码生成助手。根据以下描述生成${language}代码。

需求描述: ${description}${contextSection}

要求:
- 生成完整、可运行的代码
- 遵循最佳实践
- 添加必要的注释
- 代码风格要规范`;

    try {
      const result = await this.aiManager.chatWithSystem(
        '你是一个专业的代码生成助手，擅长根据需求生成高质量代码。',
        prompt,
        { temperature: 0.7, maxTokens: 2000 }
      );
      
      return {
        success: true,
        code: result.content,
        provider: result.provider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bug修复 - 分析并修复代码问题
   * @param {string} code - 有问题的代码
   * @param {string} language - 编程语言
   * @param {string} errorMessage - 错误信息（可选）
   */
  async fixBug(code, language, errorMessage = '') {
    const errorSection = errorMessage 
      ? `\n错误信息: ${errorMessage}` 
      : '';

    const prompt = `你是一个Bug修复专家。请分析以下${language}代码中的问题，并提供修复方案。

有问题的代码:
\`\`\`${language}
${code}
\`\`\`${errorSection}

请按以下格式返回:
1. 问题分析: 找出代码中的bug或潜在问题
2. 修复方案: 提供修复后的代码
3. 修复说明: 解释修复的原理`;

    try {
      const result = await this.aiManager.chatWithSystem(
        '你是一个专业的Bug修复专家，擅长找出并修复代码中的问题。',
        prompt,
        { temperature: 0.5, maxTokens: 1500 }
      );
      
      return {
        success: true,
        fix: result.content,
        provider: result.provider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 代码优化 - 提供性能优化建议
   * @param {string} code - 要优化的代码
   * @param {string} language - 编程语言
   */
  async optimizeCode(code, language) {
    const prompt = `你是一个性能优化专家。请分析以下${language}代码的性能问题，并提供优化建议。

原始代码:
\`\`\`${language}
${code}
\`\`\`

请按以下格式返回:
1. 性能分析: 识别性能瓶颈
2. 优化方案: 提供优化后的代码
3. 性能对比: 说明优化前后的性能差异（时间复杂度/空间复杂度）`;

    try {
      const result = await this.aiManager.chatWithSystem(
        '你是一个专业的性能优化专家，擅长优化代码执行效率。',
        prompt,
        { temperature: 0.5, maxTokens: 1500 }
      );
      
      return {
        success: true,
        optimization: result.content,
        provider: result.provider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成单元测试
   * @param {string} code - 要测试的代码
   * @param {string} language - 编程语言
   * @param {string} testFramework - 测试框架 (可选)
   */
  async generateTests(code, language, testFramework = '') {
    const frameworkSection = testFramework 
      ? `\n请使用 ${testFramework} 框架编写测试。` 
      : '';

    const prompt = `你是一个测试工程专家。请为以下${language}代码生成单元测试。

原始代码:
\`\`\`${language}
${code}
\`\`\`${frameworkSection}

请:
1. 生成完整的测试用例
2. 覆盖主要功能路径
3. 包含边界条件测试
4. 测试代码要可运行`;

    try {
      const result = await this.aiManager.chatWithSystem(
        '你是一个专业的测试工程专家，擅长编写全面的单元测试。',
        prompt,
        { temperature: 0.7, maxTokens: 2000 }
      );
      
      return {
        success: true,
        tests: result.content,
        provider: result.provider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 代码翻译 - 将代码从一种语言翻译到另一种
   * @param {string} code - 源代码
   * @param {string} fromLang - 源语言
   * @param {string} toLang - 目标语言
   */
  async translateCode(code, fromLang, toLang) {
    const prompt = `请将以下${fromLang}代码翻译成${toLang}。

原始代码 (${fromLang}):
\`\`\`${fromLang}
${code}
\`\`\`

要求:
- 翻译后的代码要保持相同的功能
- 遵循${toLang}的最佳实践
- 添加必要的类型转换
- 代码要可运行`;

    try {
      const result = await this.aiManager.chatWithSystem(
        '你是一个多语言编程专家，擅长在不同编程语言之间翻译代码。',
        prompt,
        { temperature: 0.7, maxTokens: 2000 }
      );
      
      return {
        success: true,
        translatedCode: result.content,
        provider: result.provider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * 创建AI代码增强器实例
 */
function createAICodeEnhancer(options) {
  const enhancer = new AICodeEnhancer();
  if (options) {
    enhancer.configure(options);
  }
  return enhancer;
}

module.exports = {
  AICodeEnhancer,
  createAICodeEnhancer
};
