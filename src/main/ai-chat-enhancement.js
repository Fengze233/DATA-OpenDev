/**
 * AI Chat Enhancement - AI对话体验优化
 * Phase 4.3: AI体验优化
 * 作者: 调度
 * 
 * 功能:
 * - Markdown渲染
 * - 代码高亮
 * - 流式输出
 * - 加载动画
 * - 对话历史记忆
 * - 提示词模板
 */

const { AIServiceManager } = require('./ai-providers');

/**
 * AI聊天增强器
 */
class AIChatEnhancer {
  constructor(options = {}) {
    this.aiManager = new AIServiceManager();
    this.config = {
      provider: options.provider || 'openai',
      model: options.model || 'gpt-4',
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 2000,
      stream: options.stream !== false // 默认启用流式输出
    };
    
    // 对话历史
    this.conversationHistory = [];
    this.maxHistoryLength = options.maxHistoryLength || 50;
    
    // 提示词模板
    this.promptTemplates = {
      // 代码相关
      '代码解释': '请用简洁清晰的语言解释以下代码的功能：\n\n```{language}\n{code}\n```',
      '代码重构': '请为以下代码提供重构建议：\n\n```{language}\n{code}\n```',
      '代码优化': '请优化以下代码的性能：\n\n```{language}\n{code}\n```',
      'Bug修复': '请修复以下代码中的bug：\n\n```{language}\n{code}\n```',
      '生成测试': '请为以下代码生成单元测试：\n\n```{language}\n{code}\n```',
      
      // 文档相关
      '生成文档': '请为以下代码生成文档注释：\n\n```{language}\n{code}\n```',
      '写README': '请为这个项目生成README文档：',
      
      // 一般
      '解释概念': '请解释以下概念：',
      '写代码': '请用{language}编写代码：',
      '调试': '请帮我调试以下代码，错误信息是：{error}\n\n```{language}\n{code}\n```'
    };
    
    // 历史记录存储
    this.storageKey = 'opendev-ai-history';
    this.loadHistory();
  }

  /**
   * 配置
   */
  configure(options) {
    if (options.provider) {
      this.aiManager.setProvider(options.provider);
      this.config.provider = options.provider;
    }
    if (options.apiKey) {
      this.aiManager.setApiKey(options.apiKey);
    }
    if (options.model) {
      this.aiManager.setModel(options.model);
      this.config.model = options.model;
    }
    if (options.temperature !== undefined) {
      this.config.temperature = options.temperature;
    }
    if (options.maxTokens) {
      this.config.maxTokens = options.maxTokens;
    }
    if (options.stream !== undefined) {
      this.config.stream = options.stream;
    }
    return this;
  }

  /**
   * 加载历史记录
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[AIChat] 加载历史失败:', e);
      this.conversationHistory = [];
    }
  }

  /**
   * 保存历史记录
   */
  saveHistory() {
    try {
      // 只保存最近的消息
      const historyToSave = this.conversationHistory.slice(-this.maxHistoryLength);
      localStorage.setItem(this.storageKey, JSON.stringify(historyToSave));
    } catch (e) {
      console.warn('[AIChat] 保存历史失败:', e);
    }
  }

  /**
   * 添加消息到历史
   */
  addToHistory(role, content) {
    this.conversationHistory.push({ role, content, timestamp: Date.now() });
    // 限制历史长度
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
    this.saveHistory();
  }

  /**
   * 清除历史
   */
  clearHistory() {
    this.conversationHistory = [];
    localStorage.removeItem(this.storageKey);
    return true;
  }

  /**
   * 获取历史
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * 获取对话长度
   */
  getHistoryLength() {
    return this.conversationHistory.length;
  }

  /**
   * 发送消息（非流式）
   */
  async sendMessage(message, context = null) {
    // 构建消息列表
    const messages = [];
    
    // 添加系统提示
    messages.push({
      role: 'system',
      content: context?.systemPrompt || '你是一个有帮助的AI编程助手。'
    });
    
    // 添加历史记录（可配置）
    if (context?.includeHistory !== false) {
      messages.push(...this.conversationHistory.slice(-this.maxHistoryLength));
    }
    
    // 添加当前消息
    messages.push({ role: 'user', content: message });
    
    try {
      const result = await this.aiManager.chat(messages, {
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      });
      
      // 添加到历史
      this.addToHistory('user', message);
      this.addToHistory('assistant', result.content);
      
      return {
        success: true,
        content: result.content,
        provider: result.provider,
        usage: result.usage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 流式发送消息
   */
  async sendMessageStream(message, onChunk, context = null) {
    const messages = [];
    
    messages.push({
      role: 'system',
      content: context?.systemPrompt || '你是一个有帮助的AI编程助手。'
    });
    
    if (context?.includeHistory !== false) {
      messages.push(...this.conversationHistory.slice(-this.maxHistoryLength));
    }
    
    messages.push({ role: 'user', content: message });
    
    // 用于累积完整响应
    let fullContent = '';
    
    try {
      // 获取流式响应
      const stream = await this.aiManager.chatStream(messages, {
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      });
      
      // 处理每个chunk
      for await (const chunk of stream) {
        fullContent += chunk;
        onChunk(chunk, fullContent);
      }
      
      // 保存到历史
      this.addToHistory('user', message);
      this.addToHistory('assistant', fullContent);
      
      return {
        success: true,
        content: fullContent,
        provider: this.config.provider
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        partialContent: fullContent
      };
    }
  }

  /**
   * 使用提示词模板发送消息
   */
  async sendWithTemplate(templateName, params) {
    const template = this.promptTemplates[templateName];
    if (!template) {
      return { success: false, error: `未知模板: ${templateName}` };
    }
    
    // 替换模板参数
    let prompt = template;
    for (const [key, value] of Object.entries(params)) {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    
    return this.sendMessage(prompt);
  }

  /**
   * 获取可用模板列表
   */
  getTemplates() {
    return Object.keys(this.promptTemplates);
  }

  /**
   * 添加自定义模板
   */
  addTemplate(name, template) {
    this.promptTemplates[name] = template;
    return true;
  }

  /**
   * 删除模板
   */
  deleteTemplate(name) {
    if (this.promptTemplates[name]) {
      delete this.promptTemplates[name];
      return true;
    }
    return false;
  }

  /**
   * 导出模板
   */
  exportTemplates() {
    return JSON.stringify(this.promptTemplates, null, 2);
  }

  /**
   * 导入模板
   */
  importTemplates(jsonString) {
    try {
      const templates = JSON.parse(jsonString);
      this.promptTemplates = { ...this.promptTemplates, ...templates };
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Markdown解析器（简化版）
 * 用于前端渲染
 */
class MarkdownParser {
  /**
   * 解析Markdown为HTML
   */
  static parse(markdown) {
    let html = markdown;
    
    // 转义HTML
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // 代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });
    
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 粗体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 斜体
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // 删除线
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    // 标题
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // 图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    
    // 列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 数字列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // 分割线
    html = html.replace(/^---$/gm, '<hr>');
    
    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // 清理空段落
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*<pre>/g, '<pre>');
    html = html.replace(/<\/pre>\s*<\/p>/g, '</pre>');
    
    return html;
  }
}

/**
 * 创建AI聊天增强器
 */
function createAIChatEnhancer(options) {
  return new AIChatEnhancer(options);
}

module.exports = {
  AIChatEnhancer,
  MarkdownParser,
  createAIChatEnhancer
};
