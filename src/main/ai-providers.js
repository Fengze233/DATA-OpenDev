/**
 * AI Providers - 多模型支持
 * 支持 OpenAI、Claude、Ollama
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// 默认配置
const DEFAULT_CONFIG = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
};

/**
 * OpenAI 提供商
 */
class OpenAIProvider {
  constructor() {
    this.name = 'OpenAI';
    this.baseUrl = 'api.openai.com';
  }

  async chat(apiKey, messages, options) {
    return new Promise((resolve, reject) => {
      const requestBody = {
        model: options.model || 'gpt-4',
        messages: messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 2000
      };

      const reqOptions = {
        hostname: this.baseUrl,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode !== 200) {
              reject(new Error(parsed.error?.message || `API Error: ${res.statusCode}`));
              return;
            }
            resolve({
              content: parsed.choices[0].message.content,
              model: parsed.model,
              usage: parsed.usage,
              provider: this.name
            });
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => { reject(new Error(`请求失败: ${error.message}`)); });
      req.write(JSON.stringify(requestBody));
      req.end();
    });
  }
}

/**
 * Anthropic Claude 提供商
 */
class AnthropicProvider {
  constructor() {
    this.name = 'Anthropic';
    this.baseUrl = 'api.anthropic.com';
  }

  async chat(apiKey, messages, options) {
    return new Promise((resolve, reject) => {
      // 将消息格式转换为 Claude 格式
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');
      
      const requestBody = {
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 4096,
        system: systemMessage ? systemMessage.content : '',
        messages: userMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
      };

      const reqOptions = {
        hostname: this.baseUrl,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode !== 200) {
              reject(new Error(parsed.error?.message || `API Error: ${res.statusCode}`));
              return;
            }
            resolve({
              content: parsed.content[0].text,
              model: parsed.model,
              usage: parsed.usage,
              provider: this.name
            });
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => { reject(new Error(`请求失败: ${error.message}`)); });
      req.write(JSON.stringify(requestBody));
      req.end();
    });
  }
}

/**
 * Ollama 本地模型提供商
 */
class OllamaProvider {
  constructor() {
    this.name = 'Ollama';
    this.baseUrl = 'localhost';
    this.port = 11434;
  }

  async chat(apiKey, messages, options) {
    // apiKey 在这里用作 host:port 配置
    let host = this.baseUrl;
    let port = this.port;
    
    if (apiKey && apiKey.includes(':')) {
      const [h, p] = apiKey.split(':');
      host = h || this.baseUrl;
      port = parseInt(p) || this.port;
    }

    const model = options.model || 'llama2';

    const requestBody = {
      model: model,
      messages: messages,
      stream: false
    };

    return new Promise((resolve, reject) => {
      const reqOptions = {
        hostname: host,
        port: port,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode !== 200) {
              reject(new Error(parsed.error?.message || `API Error: ${res.statusCode}`));
              return;
            }
            resolve({
              content: parsed.message?.content || '',
              model: parsed.model || model,
              provider: this.name
            });
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => { reject(new Error(`请求失败: ${error.message}`)); });
      req.write(JSON.stringify(requestBody));
      req.end();
    });
  }

  /**
   * 获取可用模型列表
   */
  async listModels(apiKey) {
    let host = this.baseUrl;
    let port = this.port;
    
    if (apiKey && apiKey.includes(':')) {
      const [h, p] = apiKey.split(':');
      host = h || this.baseUrl;
      port = parseInt(p) || this.port;
    }

    return new Promise((resolve, reject) => {
      const reqOptions = {
        hostname: host,
        port: port,
        path: '/api/tags',
        method: 'GET'
      };

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.models || []);
          } catch (error) {
            reject(new Error(`获取模型列表失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => { reject(new Error(`请求失败: ${error.message}`)); });
      req.end();
    });
  }
}

/**
 * AI 服务管理器 - 多模型支持
 */
class AIServiceManager {
  constructor() {
    this.providers = {
      openai: new OpenAIProvider(),
      anthropic: new AnthropicProvider(),
      ollama: new OllamaProvider()
    };
    
    // 当前配置
    this.config = {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000
    };
    
    // 可用模型列表
    this.availableModels = {
      openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
      ollama: [] // 动态获取
    };
  }

  /**
   * 设置提供商
   */
  setProvider(providerName) {
    if (this.providers[providerName]) {
      this.config.provider = providerName;
      return { success: true };
    }
    return { success: false, error: `未知提供商: ${providerName}` };
  }

  /**
   * 设置 API Key
   */
  setApiKey(apiKey) {
    this.config.apiKey = apiKey;
    return { success: true };
  }

  /**
   * 设置模型
   */
  setModel(model) {
    this.config.model = model;
    return { success: true };
  }

  /**
   * 配置参数
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
    return { success: true };
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 获取可用提供商
   */
  getProviders() {
    return Object.keys(this.providers);
  }

  /**
   * 获取可用模型
   */
  getModels(providerName) {
    if (providerName && this.availableModels[providerName]) {
      return this.availableModels[providerName];
    }
    return this.availableModels[this.config.provider] || [];
  }

  /**
   * 获取所有提供商的模型
   */
  getAllModels() {
    return { ...this.availableModels };
  }

  /**
   * 发送对话请求
   */
  async chat(messages, options = {}) {
    const provider = this.providers[this.config.provider];
    if (!provider) {
      throw new Error(`未配置 AI 提供商`);
    }

    if (!this.config.apiKey) {
      throw new Error('请先配置 API Key');
    }

    const requestOptions = {
      model: options.model || this.config.model,
      temperature: options.temperature ?? this.config.temperature,
      maxTokens: options.maxTokens || this.config.maxTokens
    };

    return provider.chat(this.config.apiKey, messages, requestOptions);
  }

  /**
   * 简单对话
   */
  async chatWithSystem(systemMessage, userMessage, options = {}) {
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];
    return this.chat(messages, options);
  }

  /**
   * 获取 Ollama 本地模型列表
   */
  async fetchOllamaModels() {
    try {
      const models = await this.providers.ollama.listModels(this.config.apiKey);
      this.availableModels.ollama = models.map(m => m.name);
      return models;
    } catch (error) {
      console.error('获取 Ollama 模型失败:', error);
      return [];
    }
  }
}

module.exports = { AIServiceManager };
