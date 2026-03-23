/**
 * AI Code Completion Provider - Monaco Editor集成
 * Phase 3.5: AI代码增强功能
 * 作者: 调度
 * 
 * 利用Monaco Editor的registerCompletionItemProvider实现AI智能补全
 */

const { createAICodeEnhancer } = require('./ai-code-enhancer');

/**
 * AI补全提供者 - Monaco Editor集成
 */
class AICompletionProvider {
  constructor(options = {}) {
    // 初始化AI增强器
    this.enhancer = createAICodeEnhancer({
      provider: options.provider || 'openai',
      model: options.model || 'gpt-4',
      apiKey: options.apiKey || ''
    });
    
    // 配置
    this.config = {
      enabled: options.enabled !== false,
      triggerChars: options.triggerChars || [],
      debounceMs: options.debounceMs || 300,
      maxSuggestions: options.maxSuggestions || 5,
      language: options.language || 'javascript'
    };
    
    // 状态
    this.isLoading = false;
    this.lastRequestTime = 0;
    this.pendingRequest = null;
  }

  /**
   * 提供补全项 (Monaco CompletionItemProvider接口)
   * @param {object} model - Monaco editor model
   * @param {object} position - 光标位置
   * @returns {Promise<Array>} 补全项列表
   */
  async provideCompletionItems(model, position) {
    if (!this.config.enabled) {
      return { suggestions: [] };
    }

    // 获取当前代码上下文
    const code = model.getValue();
    const language = model.getLanguageId();
    
    // 限制请求频率
    const now = Date.now();
    if (now - this.lastRequestTime < this.config.debounceMs) {
      return { suggestions: [] };
    }

    // 取消之前的请求
    if (this.pendingRequest) {
      clearTimeout(this.pendingRequest);
    }

    return new Promise((resolve) => {
      this.pendingRequest = setTimeout(async () => {
        this.lastRequestTime = Date.now();
        
        try {
          // 获取AI补全建议
          const result = await this.enhancer.getCompletion(code, language, position);
          
          if (result.success && result.content) {
            // 转换为Monaco补全项格式
            const suggestions = this.convertToMonacoSuggestions(
              result.content,
              language,
              position
            );
            
            resolve({ suggestions });
          } else {
            resolve({ suggestions: [] });
          }
        } catch (error) {
          console.error('[AICompletion] Error:', error);
          resolve({ suggestions: [] });
        }
      }, this.config.debounceMs);
    });
  }

  /**
   * 将AI响应转换为Monaco补全项格式
   */
  convertToMonacoSuggestions(aiContent, language, position) {
    const suggestions = [];
    
    // 解析AI返回的代码片段
    const lines = aiContent.split('\n');
    let currentSnippet = '';
    let label = '';
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('```')) {
        currentSnippet += line + '\n';
      }
      
      // 当遇到空行或结束标记时创建一个补全项
      if ((line.trim() === '' || lines.indexOf(line) === lines.length - 1) && currentSnippet.trim()) {
        // 生成标签（前50字符）
        label = currentSnippet.trim().split('\n')[0].substring(0, 50);
        
        suggestions.push({
          label: `✨ AI: ${label}`,
          kind: 14, // monaco.languages.CompletionItemKind.Snippet
          insertText: currentSnippet.trim(),
          insertTextRules: 4, // monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          detail: `AI补全建议 (${this.enhancer.config.provider})`,
          documentation: currentSnippet.trim(),
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          }
        });
        
        // 限制数量
        if (suggestions.length >= this.config.maxSuggestions) {
          break;
        }
        
        currentSnippet = '';
      }
    }
    
    return suggestions;
  }

  /**
   * 解释选中代码
   */
  async explainSelection(code, language) {
    return await this.enhancer.explainCode(code, language);
  }

  /**
   * 代码重构建议
   */
  async suggestRefactoring(code, language, goal) {
    return await this.enhancer.suggestRefactoring(code, language, goal);
  }

  /**
   * 代码生成
   */
  async generateCode(description, language, context) {
    return await this.enhancer.generateCode(description, language, context);
  }

  /**
   * Bug修复
   */
  async fixBug(code, language, errorMessage) {
    return await this.enhancer.fixBug(code, language, errorMessage);
  }

  /**
   * 代码优化
   */
  async optimizeCode(code, language) {
    return await this.enhancer.optimizeCode(code, language);
  }

  /**
   * 生成测试
   */
  async generateTests(code, language, framework) {
    return await this.enhancer.generateTests(code, language, framework);
  }

  /**
   * 代码翻译
   */
  async translateCode(code, fromLang, toLang) {
    return await this.enhancer.translateCode(code, fromLang, toLang);
  }

  /**
   * 配置
   */
  configure(options) {
    if (options.apiKey) {
      this.enhancer.configure({ apiKey: options.apiKey });
    }
    if (options.provider) {
      this.enhancer.configure({ provider: options.provider });
    }
    if (options.model) {
      this.enhancer.configure({ model: options.model });
    }
    if (options.enabled !== undefined) {
      this.config.enabled = options.enabled;
    }
    return this;
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    return this;
  }

  /**
   * 销毁
   */
  dispose() {
    if (this.pendingRequest) {
      clearTimeout(this.pendingRequest);
    }
  }
}

/**
 * 创建AI补全提供者
 */
function createAICompletionProvider(options) {
  return new AICompletionProvider(options);
}

/**
 * Monaco命令注册器
 * 用于注册VSCode命令到AI增强器
 */
class AICommandsRegistry {
  constructor(enhancer) {
    this.enhancer = enhancer;
    this.commands = new Map();
  }

  /**
   * 注册AI命令
   */
  registerCommand(commandId, handler) {
    this.commands.set(commandId, handler);
    return {
      dispose: () => {
        this.commands.delete(commandId);
      }
    };
  }

  /**
   * 执行AI命令
   */
  async executeCommand(commandId, args) {
    const handler = this.commands.get(commandId);
    if (handler) {
      return await handler(...args);
    }
    throw new Error(`命令未注册: ${commandId}`);
  }

  /**
   * 获取已注册命令列表
   */
  getCommands() {
    return Array.from(this.commands.keys());
  }
}

module.exports = {
  AICompletionProvider,
  createAICompletionProvider,
  AICommandsRegistry
};
