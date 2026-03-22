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
 * Minimax 提供商
 * 参考: https://platform.minimaxi.com/document/Guides/Model-Inference/Chat-Completions
 * 支持 CN版 和 国际版
 */
class MinimaxProvider {
  constructor(region = 'intl') {
    this.name = 'Minimax';
    // CN版: api.minimax.cn, 国际版: api.minimax.chat
    this.baseUrl = region === 'cn' ? 'api.minimax.cn' : 'api.minimax.chat';
    this.region = region;
  }

  async chat(apiKey, messages, options) {
    return new Promise((resolve, reject) => {
      // 提取系统消息
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');

      const requestBody = {
        model: options.model || 'abab6.5s-chat',
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage.content }] : []),
          ...userMessages
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 2000
      };

      // TODO: [待验证] Minimax API 认证方式
      // 官方文档: https://platform.minimaxi.com/document/Guides/Model-Inference/Chat-Completions
      // 两种方式: 1. Header Authorization: Bearer token, 2. Query参数
      const reqOptions = {
        hostname: this.baseUrl,
        path: `/v1/text/chatcompletion_v2`,
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
              reject(new Error(parsed.base_resp?.status_msg || parsed.detail || `API Error: ${res.statusCode}`));
              return;
            }
            resolve({
              content: parsed.choices[0].message.content,
              model: parsed.model,
              usage: parsed.usage,
              provider: this.name,
              region: this.region
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
 * 智谱GLM 提供商
 * 参考: https://open.bigmodel.cn/dev/api
 */
class ZhipuProvider {
  constructor() {
    this.name = 'ZhipuGLM';
    this.baseUrl = 'open.bigmodel.cn';
  }

  async chat(apiKey, messages, options) {
    return new Promise((resolve, reject) => {
      const model = options.model || 'glm-4';
      // 映射模型名称
      const modelMap = {
        'glm-4': 'glm-4',
        'glm-4-flash': 'glm-4-flash',
        'glm-4-plus': 'glm-4-plus',
        'glm-3-turbo': 'glm-3-turbo'
      };
      const mappedModel = modelMap[model] || 'glm-4';

      const requestBody = {
        model: mappedModel,
        messages: messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 2000
      };

      const reqOptions = {
        hostname: this.baseUrl,
        path: `/api/paas/v4/chat/completions`,
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
 * 阿里通义千问提供商
 * 参考: https://help.aliyun.com/zh/model-studio/developer-reference/compatibility-of-openapi-with-openai
 */
class TongyiProvider {
  constructor() {
    this.name = 'Tongyi';
    this.baseUrl = 'dashscope.aliyuncs.com';
  }

  async chat(apiKey, messages, options) {
    return new Promise((resolve, reject) => {
      const model = options.model || 'qwen-turbo';
      
      const requestBody = {
        model: model,
        input: {
          messages: messages
        },
        parameters: {
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens || 2000
        }
      };

      const reqOptions = {
        hostname: this.baseUrl,
        path: `/api/v1/services/aigc/text-generation/generation`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-DashScope-Api-Type': 'alchemy'
        }
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode !== 200) {
              reject(new Error(parsed.message || `API Error: ${res.statusCode}`));
              return;
            }
            resolve({
              content: parsed.output?.text || parsed.output?.choices?.[0]?.message?.content || '',
              model: parsed.model || model,
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
 * 讯飞星火提供商
 * 参考: https://www.xfyun.cn/doc/spark/WebSocket.html
 * 
 * TODO: [待验证] 讯飞星火仅支持WebSocket API，不支持REST API
 * 当前实现需要通过WebSocket连接，需要APPID和APIKey配合使用
 * 
 * WebSocket连接地址:
 * - ws://spark-api.xf-yun.com/v3.5/chat (3.5版本)
 * - ws://spark-api.xf-yun.com/v3.1/chat (3.1版本)  
 * - ws://spark-api.xf-yun.com/v2.1/chat (2.1版本)
 */
class SparkProvider {
  constructor() {
    this.name = 'Spark';
    // WebSocket地址
    this.wsUrls = {
      'generalv3.5': 'wss://spark-api.xf-yun.com/v3.5/chat',
      'generalv3': 'wss://spark-api.xf-yun.com/v3.1/chat',
      'generalv2': 'wss://spark-api.xf-yun.com/v2.1/chat'
    };
  }

  /**
   * 生成鉴权URL
   * @param {string} apiKey - API Key (格式: APPID|APIKey)
   */
  getAuthUrl(apiKey) {
    // TODO: 需要实现讯飞星火的鉴权逻辑
    // 参考: https://www.xfyun.cn/doc/spark/authentication.html
    throw new Error('讯飞星火仅支持WebSocket API，需要实现鉴权URL生成。请参考官方文档实现 getAuthUrl 方法。');
  }

  async chat(apiKey, messages, options) {
    const model = options.model || 'generalv3.5';
    const wsUrl = this.wsUrls[model] || this.wsUrls['generalv3.5'];
    
    // TODO: [待测试] 需要实现完整的WebSocket客户端
    // 暂时抛出错误提示
    throw new Error(
      '讯飞星火Provider暂未实现 - 仅支持WebSocket API。\n' +
      '需要实现WebSocket连接: ' + wsUrl + '\n' +
      '参考文档: https://www.xfyun.cn/doc/spark/WebSocket.html\n' +
      '提示: 需要使用ws模块建立WebSocket连接，并实现鉴权'
    );
  }
}

/**
 * 百度文心提供商
 * 参考: https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Clm7e66qp
 */
class WenxinProvider {
  constructor() {
    this.name = 'Wenxin';
    this.baseUrl = 'qianfan.baidubce.com';
  }

  async chat(apiKey, messages, options) {
    return new Promise((resolve, reject) => {
      const model = options.model || 'ernie-4.0-8k';
      
      // 映射模型名称
      const modelMap = {
        'ernie-4.0-8k': 'ernie-4.0-8k',
        'ernie-4.0-8k-preview': 'ernie-4.0-8k-preview',
        'ernie-3.5-8k': 'ernie-3.5-8k',
        'ernie-3.5-8k-preview': 'ernie-3.5-8k-preview',
        'ernie-speed-8k': 'ernie-speed-8k'
      };
      const mappedModel = modelMap[model] || 'ernie-3.5-8k';

      const requestBody = {
        model: mappedModel,
        messages: messages,
        temperature: options.temperature ?? 0.7,
        max_output_tokens: options.maxTokens || 2000
      };

      const reqOptions = {
        hostname: this.baseUrl,
        path: `/v2/chat/completions`,
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
              reject(new Error(parsed.error_msg || parsed.detail || `API Error: ${res.statusCode}`));
              return;
            }
            resolve({
              content: parsed.result || parsed.choices?.[0]?.message?.content || '',
              model: parsed.id || mappedModel,
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
      // 国外版
      openai: new OpenAIProvider(),
      anthropic: new AnthropicProvider(),
      ollama: new OllamaProvider(),
      minimax: new MinimaxProvider('intl'),
      minimax_cn: new MinimaxProvider('cn'),
      zhipu: new ZhipuProvider(),
      tongyi: new TongyiProvider(),
      tongyi_qwen: new TongyiProvider(), // 阿里Qwen系列
      spark: new SparkProvider(),
      wenxin: new WenxinProvider()
    };
    
    // 当前配置
    this.config = {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      region: 'intl' // CN或intl
    };
    
    // 可用模型列表
    this.availableModels = {
      openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
      ollama: [], // 动态获取
      // Minimax
      minimax: ['abab6.5s-chat', 'abab6.5g-chat', 'abab6-chat'], // 国际版
      minimax_cn: ['abab6.5s-chat', 'abab6.5g-chat', 'abab6-chat'], // CN版
      // 智谱 (主要国内)
      zhipu: ['glm-4', 'glm-4-plus', 'glm-4-flash', 'glm-3-turbo'],
      // 阿里通义
      tongyi: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'],
      tongyi_qwen: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
      // 讯飞星火
      spark: ['generalv3.5', 'generalv3', 'generalv2'],
      // 百度文心
      wenxin: ['ernie-4.0-8k', 'ernie-4.0-8k-preview', 'ernie-3.5-8k', 'ernie-3.5-8k-preview', 'ernie-speed-8k']
    };
  }

  /**
   * 设置提供商
   * @param {string} providerName - 提供商名称 (支持: openai, anthropic, ollama, minimax, minimax_cn, zhipu, tongyi, spark, wenxin)
   */
  setProvider(providerName) {
    if (this.providers[providerName]) {
      this.config.provider = providerName;
      // 自动设置区域
      if (providerName.endsWith('_cn')) {
        this.config.region = 'cn';
      } else if (providerName === 'minimax') {
        this.config.region = 'intl';
      }
      return { success: true };
    }
    return { success: false, error: `未知提供商: ${providerName}` };
  }

  /**
   * 设置区域 (CN/国际)
   */
  setRegion(region) {
    if (region === 'cn' && this.config.provider === 'minimax') {
      this.providers.minimax = new MinimaxProvider('cn');
      this.config.provider = 'minimax_cn';
    } else if (region === 'intl' && this.config.provider === 'minimax_cn') {
      this.providers.minimax = new MinimaxProvider('intl');
      this.config.provider = 'minimax';
    }
    this.config.region = region;
    return { success: true };
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
