/**
 * AI Service - OpenAI API 调用封装
 * 提供对话补全功能
 */

const https = require('https');

// 默认配置
const DEFAULT_CONFIG = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
};

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'api.openai.com';
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * 设置 API Key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * 配置模型参数
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 发送对话请求
   */
  async chat(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key not configured. Please set OPENAI_API_KEY');
    }

    const requestBody = {
      model: options.model || this.config.model,
      messages: messages,
      temperature: options.temperature ?? this.config.temperature,
      max_tokens: options.maxTokens || this.config.maxTokens
    };

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

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
              id: parsed.id
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(JSON.stringify(requestBody));
      req.end();
    });
  }

  /**
   * 简单对话接口
   */
  async chatWithSystem(systemMessage, userMessage, options = {}) {
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];
    return this.chat(messages, options);
  }

  /**
   * 流式对话（可选）
   */
  async *chatStream(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const requestBody = {
      model: options.model || this.config.model,
      messages: messages,
      temperature: options.temperature ?? this.config.temperature,
      max_tokens: options.maxTokens || this.config.maxTokens,
      stream: true
    };

    const response = await fetch(`https://${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API Error');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        if (trimmed === 'data: [DONE]') return;
        
        try {
          const data = JSON.parse(trimmed.slice(6));
          const content = data.choices[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

module.exports = { AIService };
