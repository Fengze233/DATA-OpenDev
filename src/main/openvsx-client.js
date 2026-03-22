/**
 * OpenVSX 插件市场 API 客户端
 * 阶段 2.3.1: OpenVSX API 对接
 * 作者: 桥王 (Bridge)
 */

const https = require('https');
const http = require('http');
const net = require('net');
const { URL } = require('url');

// ==================== OpenVSX API 配置 ====================

const OPENVSX_API_BASE = 'https://open-vsx.org';
const API_VERSION = 'v1';

/**
 * OpenVSX API 端点
 */
const Endpoints = {
  // 查询插件
  QUERY: '/vsexchange/extensions/query',
  
  // 获取插件详情
  GET_EXTENSION: (namespace, extensionName) => 
    `/vsexchange/extensions/${namespace}/${extensionName}`,
  
  // 获取插件版本
  GET_VERSION: (namespace, extensionName, version) => 
    `/vsexchange/extensions/${namespace}/${extensionName}/${version}`,
  
  // 获取插件文件下载
  DOWNLOAD: (namespace, extensionName, version) => 
    `/vsexchange/extensions/${namespace}/${extensionName}/file/${version}`,
  
  // 获取用户收藏
  FAVORITES: '/user/favorites',
  
  // 搜索建议
  SEARCH_SUGGEST: '/search/suggest'
};

/**
 * HTTP 请求工具
 */
class HttpClient {
  constructor(baseUrl = OPENVSX_API_BASE, proxyUrl = null) {
    this.baseUrl = baseUrl;
    this.proxyUrl = proxyUrl || process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    this.defaultHeaders = {
      'Accept': 'application/json',
      'User-Agent': 'OpenDev-IDE/1.0.0'
    };
    
    // 解析代理 URL
    if (this.proxyUrl) {
      try {
        const p = new URL(this.proxyUrl);
        this.proxyHost = p.hostname;
        this.proxyPort = p.port || (p.protocol === 'https:' ? 443 : 80);
        this.proxyAuth = p.username ? `${p.username}:${p.password}` : null;
      } catch (e) {
        console.warn('[HttpClient] 代理URL解析失败:', e.message);
        this.proxyUrl = null;
      }
    }
  }

  /**
   * 发起 GET 请求
   * @param {string} path 
   * @param {object} params 
   * @returns {Promise<object>}
   */
  async get(path, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const targetUrl = `${this.baseUrl}${path}${queryString ? '?' + queryString : ''}`;
    const targetObj = new URL(targetUrl);
    const isHttps = targetObj.protocol === 'https:';
    
    return this._request(targetObj.hostname, targetObj.port || (isHttps ? 443 : 80), targetObj.pathname + (queryString ? '?' + queryString : ''), 'GET', isHttps);
  }

  /**
   * 发起 POST 请求
   * @param {string} path 
   * @param {object} data 
   * @returns {Promise<object>}
   */
  async post(path, data = {}) {
    const targetUrl = `${this.baseUrl}${path}`;
    const targetObj = new URL(targetUrl);
    const isHttps = targetObj.protocol === 'https:';
    const postData = JSON.stringify(data);
    
    return this._request(targetObj.hostname, targetObj.port || (isHttps ? 443 : 80), targetObj.pathname, 'POST', isHttps, postData);
  }

  /**
   * 核心请求方法 - 支持 HTTP CONNECT 代理
   */
  _request(host, port, path, method, isHttps, body = null) {
    return new Promise((resolve, reject) => {
      // 如果有代理，使用 CONNECT 隧道
      if (this.proxyUrl && this.proxyHost) {
        console.log(`[HttpClient] 代理 CONNECT: ${this.proxyHost}:${this.proxyPort} -> ${host}:${port}`);
        
        // 创建到代理的连接
        const proxySocket = net.connect(this.proxyPort, this.proxyHost, () => {
          // 发送 CONNECT 请求
          const connectRequest = `CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\nProxy-Connection: Keep-Alive\r\n\r\n`;
          proxySocket.write(connectRequest);
        });

        let responseData = '';
        
        proxySocket.on('data', (chunk) => {
          responseData += chunk.toString();
          // 检查是否收到 CONNECT 响应
          if (responseData.includes('\r\n\r\n') && !proxySocket.tlsConnected) {
            const headers = responseData.split('\r\n\r\n')[0];
            if (headers.includes('HTTP/1.1 200') || headers.includes('HTTP/1.0 200')) {
              // CONNECT 成功，升级到 TLS
              const tls = require('tls');
              const tlsOptions = {
                socket: proxySocket,
                host: host,
                port: port,
                servername: host,
                rejectUnauthorized: false
              };
              
              const tlsSocket = tls.connect(tlsOptions, () => {
                this._sendHttpRequest(tlsSocket, path, method, body, resolve, reject);
              });
              
              tlsSocket.on('error', reject);
              tlsSocket.setTimeout(15000, () => {
                tlsSocket.destroy();
                reject(new Error('TLS timeout'));
              });
            } else {
              reject(new Error(`CONNECT failed: ${headers}`));
            }
          }
        });
        
        proxySocket.on('error', reject);
        proxySocket.setTimeout(10000, () => {
          proxySocket.destroy();
          reject(new Error('Proxy connection timeout'));
        });
      } else {
        // 无代理直接连接
        this._directRequest(host, port, path, method, body, resolve, reject);
      }
    });
  }

  /**
   * 通过 TLS Socket 发送 HTTP 请求
   */
  _sendHttpRequest(socket, path, method, body, resolve, reject) {
    const headers = {
      'Host': 'open-vsx.org',
      'User-Agent': 'OpenDev-IDE/1.0.0',
      'Accept': 'application/json'
    };
    
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }
    
    let headerStr = `${method} ${path} HTTP/1.1\r\n`;
    for (const [k, v] of Object.entries(headers)) {
      headerStr += `${k}: ${v}\r\n`;
    }
    headerStr += '\r\n';
    
    socket.write(headerStr);
    if (body) socket.write(body);
    
    let data = '';
    socket.on('data', chunk => data += chunk);
    socket.on('end', () => {
      const parts = data.split('\r\n\r\n');
      if (parts.length < 2) {
        reject(new Error('Invalid response'));
        return;
      }
      const responseBody = parts.slice(1).join('\r\n\r\n');
      
      const statusLine = parts[0];
      const statusMatch = statusLine.match(/HTTP\/[\d.]+ (\d+)/);
      const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500;
      
      if (statusCode >= 200 && statusCode < 300) {
        try {
          resolve(JSON.parse(responseBody));
        } catch (e) {
          resolve(responseBody);
        }
      } else {
        reject(new Error(`HTTP ${statusCode}: ${responseBody.substring(0, 200)}`));
      }
    });
  }

  /**
   * 直接请求（无代理）
   */
  _directRequest(host, port, path, method, body, resolve, reject) {
    const client = isHttps ? https : http;
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: this.defaultHeaders
    };
    
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (body) req.write(body);
    req.end();
  }
}

// ==================== OpenVSX API 客户端 ====================

/**
 * OpenVSX 插件市场客户端
 */
class OpenVSXClient {
  constructor(options = {}) {
    this.http = new HttpClient(options.baseUrl || OPENVSX_API_BASE, options.proxy);
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 搜索插件
   * @param {object} options 
   * @returns {Promise<ExtensionSearchResult>}
   */
  async search(options = {}) {
    const {
      query = '',
      category = '',
      sortBy = 'relevance', // relevance, newest, trending
      sortOrder = 'desc',
      pageSize = 20,
      pageOffset = 0,
      includeVersions = true,
      includeAllVersions = false
    } = options;

    const params = {
      query,
      category,
      sortBy,
      sortOrder,
      pageSize,
      pageOffset,
      includeVersions,
      includeAllVersions
    };

    // 检查缓存
    const cacheKey = `search:${JSON.stringify(params)}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.http.get(Endpoints.QUERY, params);
      this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[OpenVSXClient] 搜索失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取插件详情
   * @param {string} extensionId 格式: namespace.extensionName 或 @namespace/extensionName
   * @returns {Promise<Extension>}
   */
  async getExtension(extensionId) {
    // 解析 extensionId
    const { namespace, name } = this._parseExtensionId(extensionId);
    
    // 检查缓存
    const cacheKey = `extension:${namespace}/${name}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.http.get(Endpoints.GET_EXTENSION(namespace, name));
      this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[OpenVSXClient] 获取插件详情失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取插件特定版本
   * @param {string} extensionId 
   * @param {string} version 
   * @returns {Promise<ExtensionVersion>}
   */
  async getVersion(extensionId, version) {
    const { namespace, name } = this._parseExtensionId(extensionId);
    
    try {
      return await this.http.get(Endpoints.GET_VERSION(namespace, name, version));
    } catch (error) {
      console.error('[OpenVSXClient] 获取版本失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取插件下载 URL
   * @param {string} extensionId 
   * @param {string} version 可选，默认最新版本
   * @returns {Promise<string>} 下载 URL
   */
  async getDownloadUrl(extensionId, version = 'latest') {
    const { namespace, name } = this._parseExtensionId(extensionId);
    
    try {
      // 如果 version 是 latest，先获取最新版本号
      if (version === 'latest') {
        const ext = await this.getExtension(extensionId);
        version = ext.allVersions ? Object.keys(ext.allVersions).pop() : ext.version;
      }
      
      const result = await this.http.get(Endpoints.DOWNLOAD(namespace, name, version));
      return result.downloadLink;
    } catch (error) {
      console.error('[OpenVSXClient] 获取下载链接失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取分类列表
   * @returns {Promise<Array<Category>>}
   */
  async getCategories() {
    const cacheKey = 'categories';
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // OpenVSX 没有直接的分类 API，返回常用分类
      const categories = [
        { name: 'Programming Languages', id: 'programming-languages' },
        { name: 'Snippets', id: 'snippets' },
        { name: 'Linters', id: 'linters' },
        { name: 'Formatters', id: 'formatters' },
        { name: 'Themes', id: 'themes' },
        { name: 'Keymaps', id: 'keymaps' },
        { name: 'Extension Packs', id: 'extension-packs' },
        { name: 'Language Packs', id: 'language-packs' },
        { name: 'Data Science', id: 'data-science' },
        { name: 'Machine Learning', id: 'machine-learning' },
        { name: 'Visualization', id: 'visualization' },
        { name: 'Notebooks', id: 'notebooks' },
        { name: 'IDE Extensions', id: 'ide-extensions' },
        { name: 'Scrapbook', id: 'scrapbook' },
        { name: 'Other', id: 'other' }
      ];
      
      this._setCache(cacheKey, categories);
      return categories;
    } catch (error) {
      console.error('[OpenVSXClient] 获取分类失败:', error.message);
      return [];
    }
  }

  /**
   * 获取插件评分和下载量统计
   * @param {string} extensionId 
   * @returns {Promise<object>}
   */
  async getStats(extensionId) {
    const { namespace, name } = this._parseExtensionId(extensionId);
    
    try {
      const ext = await this.getExtension(extensionId);
      return {
        downloadCount: ext.downloadCount || 0,
        averageRating: ext.averageRating || 0,
        ratingCount: ext.ratingCount || 0,
        trendingRank: ext.trendingRank || 0
      };
    } catch (error) {
      console.error('[OpenVSXClient] 获取统计失败:', error.message);
      return { downloadCount: 0, averageRating: 0, ratingCount: 0, trendingRank: 0 };
    }
  }

  /**
   * 解析 extensionId
   * @param {string} extensionId 
   * @returns {object}
   */
  _parseExtensionId(extensionId) {
    // 支持格式: namespace.extensionName 或 @namespace/extensionName
    let namespace, name;
    
    if (extensionId.startsWith('@')) {
      // @namespace/extensionName 格式
      const parts = extensionId.slice(1).split('/');
      namespace = parts[0];
      name = parts[1] || '';
    } else {
      // namespace.extensionName 格式
      const parts = extensionId.split('.');
      namespace = parts[0];
      name = parts.slice(1).join('.');
    }
    
    return { namespace, name };
  }

  /**
   * 从缓存获取
   * @param {string} key 
   * @returns {any|null}
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 设置缓存
   * @param {string} key 
   * @param {any} data 
   */
  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

// ==================== 插件安装器 ====================

/**
 * 插件下载和安装器
 */
class PluginInstaller {
  constructor(client, options = {}) {
    this.client = client;
    this.pluginsDir = options.pluginsDir || './plugins';
    this.tempDir = options.tempDir || './temp';
    this.fs = require('fs');
    this.path = require('path');
  }

  /**
   * 安装插件
   * @param {string} extensionId 
   * @param {string} version 
   * @returns {Promise<string>} 插件路径
   */
  async install(extensionId, version = 'latest') {
    console.log(`[PluginInstaller] 开始安装: ${extensionId}@${version}`);
    
    try {
      // 1. 获取下载链接
      const downloadUrl = await this.client.getDownloadUrl(extensionId, version);
      console.log(`[PluginInstaller] 下载链接: ${downloadUrl}`);
      
      // 2. 下载插件
      const pluginPath = await this._download(downloadUrl, extensionId);
      console.log(`[PluginInstaller] 下载完成: ${pluginPath}`);
      
      // 3. 解压插件
      const extractedPath = await this._extract(pluginPath, extensionId);
      console.log(`[PluginInstaller] 解压完成: ${extractedPath}`);
      
      // 4. 清理临时文件
      this._cleanup(pluginPath);
      
      return extractedPath;
    } catch (error) {
      console.error(`[PluginInstaller] 安装失败: ${extensionId}`, error.message);
      throw error;
    }
  }

  /**
   * 卸载插件
   * @param {string} extensionId 
   */
  async uninstall(extensionId) {
    const { namespace, name } = this.client._parseExtensionId(extensionId);
    const pluginPath = this.path.join(this.pluginsDir, `${namespace}.${name}`);
    
    if (!this.fs.existsSync(pluginPath)) {
      console.warn(`[PluginInstaller] 插件不存在: ${extensionId}`);
      return;
    }

    // 递归删除
    this._rmdirRecursive(pluginPath);
    console.log(`[PluginInstaller] 已卸载: ${extensionId}`);
  }

  /**
   * 更新插件
   * @param {string} extensionId 
   * @returns {Promise<string>}
   */
  async update(extensionId) {
    await this.uninstall(extensionId);
    return await this.install(extensionId);
  }

  /**
   * 下载文件
   * @param {string} url 
   * @param {string} extensionId 
   * @returns {Promise<string>} 临时文件路径
   */
  async _download(url, extensionId) {
    const filename = `${extensionId.replace('/', '.')}.vsix`;
    const tempPath = this.path.join(this.tempDir, filename);
    
    // 确保目录存在
    if (!this.fs.existsSync(this.tempDir)) {
      this.fs.mkdirSync(this.tempDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, { headers: { 'User-Agent': 'OpenDev-IDE/1.0.0' } }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }

        const file = this.fs.createWriteStream(tempPath);
        res.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve(tempPath);
        });
      });
      
      req.on('error', reject);
      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  /**
   * 解压 VSIX 文件
   * @param {string} vsixPath 
   * @param {string} extensionId 
   * @returns {Promise<string>} 解压后的路径
   */
  async _extract(vsixPath, extensionId) {
    const { namespace, name } = this.client._parseExtensionId(extensionId);
    const extractDir = this.path.join(this.pluginsDir, `${namespace}.${name}`);
    
    // 确保目录存在
    if (!this.fs.existsSync(this.pluginsDir)) {
      this.fs.mkdirSync(this.pluginsDir, { recursive: true });
    }

    // 使用 Node.js 内置方式解压 (VSIX 本质是 ZIP)
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(vsixPath);
    zip.extractAllTo(extractDir, true);
    
    return extractDir;
  }

  /**
   * 清理临时文件
   * @param {string} filePath 
   */
  _cleanup(filePath) {
    try {
      if (this.fs.existsSync(filePath)) {
        this.fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn(`[PluginInstaller] 清理失败: ${filePath}`);
    }
  }

  /**
   * 递归删除目录
   * @param {string} dirPath 
   */
  _rmdirRecursive(dirPath) {
    if (this.fs.existsSync(dirPath)) {
      this.fs.readdirSync(dirPath).forEach((file) => {
        const curPath = this.path.join(dirPath, file);
        if (this.fs.lstatSync(curPath).isDirectory()) {
          this._rmdirRecursive(curPath);
        } else {
          this.fs.unlinkSync(curPath);
        }
      });
      this.fs.rmdirSync(dirPath);
    }
  }

  // ==================== 2.5.3 插件依赖解析 ====================

  /**
   * 解析插件依赖
   * @param {object} packageJson 插件的 package.json
   * @returns {Dependency[]}
   */
  parseDependencies(packageJson) {
    const dependencies = [];
    
    // 解析 dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          version,
          type: 'dependency',
          required: true
        });
      }
    }
    
    // 解析 optionalDependencies
    if (packageJson.optionalDependencies) {
      for (const [name, version] of Object.entries(packageJson.optionalDependencies)) {
        dependencies.push({
          name,
          version,
          type: 'optional',
          required: false
        });
      }
    }
    
    // 解析 extensionDependencies (VSCode 扩展依赖)
    if (packageJson.extensionDependencies) {
      for (const name of packageJson.extensionDependencies) {
        dependencies.push({
          name,
          version: '*',
          type: 'extension',
          required: true
        });
      }
    }
    
    return dependencies;
  }

  /**
   * 检查依赖是否满足
   * @param {Dependency[]} dependencies 依赖列表
   * @param {Array} installedPlugins 已安装的插件
   * @returns {CheckResult}
   */
  checkDependencies(dependencies, installedPlugins) {
    const satisfied = [];
    const missing = [];
    const satisfiedMap = new Map();
    
    // 构建已安装插件的 Map
    for (const plugin of installedPlugins) {
      satisfiedMap.set(plugin.id, plugin);
      // 也支持 namespace.name 格式
      const shortId = plugin.id.split('.').pop();
      satisfiedMap.set(shortId, plugin);
    }
    
    // 检查每个依赖
    for (const dep of dependencies) {
      const installed = satisfiedMap.get(dep.name);
      
      if (installed) {
        // 检查版本是否满足
        if (this._checkVersion(installed.version, dep.version)) {
          satisfied.push(dep);
        } else {
          missing.push({
            ...dep,
            reason: `版本不满足: 需要 ${dep.version}, 当前 ${installed.version}`
          });
        }
      } else {
        missing.push({
          ...dep,
          reason: '未安装'
        });
      }
    }
    
    return {
      satisfied,
      missing,
      allSatisfied: missing.length === 0
    };
  }

  /**
   * 获取缺失的依赖
   * @param {Dependency[]} dependencies 
   * @param {Array} installedPlugins 
   * @returns {string[]}
   */
  getMissingDependencies(dependencies, installedPlugins) {
    const result = this.checkDependencies(dependencies, installedPlugins);
    return result.missing.map(m => m.name);
  }

  /**
   * 检查版本是否满足
   * @param {string} current 当前版本
   * @param {string} required 所需版本
   * @returns {boolean}
   */
  _checkVersion(current, required) {
    // 简单版本比较
    if (required === '*' || required === '') {
      return true;
    }
    
    // 处理 ^1.0.0 格式
    if (required.startsWith('^')) {
      const requiredMajor = required.slice(1).split('.')[0];
      const currentMajor = current.split('.')[0];
      return currentMajor === requiredMajor;
    }
    
    // 处理 ~1.0.0 格式
    if (required.startsWith('~')) {
      const requiredParts = required.slice(1).split('.');
      const currentParts = current.split('.');
      return currentParts[0] === requiredParts[0] && 
             currentParts[1] === requiredParts[1];
    }
    
    // 精确版本
    return current === required;
  }

  // ==================== 2.5.4 插件自动更新检查 ====================

  /**
   * 检查插件更新
   * @param {Array} installedPlugins 已安装的插件
   * @returns {Promise<UpdateInfo[]>}
   */
  async checkForUpdates(installedPlugins) {
    const updates = [];
    
    for (const plugin of installedPlugins) {
      try {
        const latestVersion = await this.getLatestVersion(plugin.id);
        const comparison = this.compareVersions(plugin.version, latestVersion);
        
        if (comparison === 'update-available') {
          updates.push({
            id: plugin.id,
            currentVersion: plugin.version,
            latestVersion,
            updateType: this._getUpdateType(plugin.version, latestVersion)
          });
        }
      } catch (error) {
        console.warn(`[OpenVSXClient] 检查更新失败: ${plugin.id}`, error.message);
      }
    }
    
    return updates;
  }

  /**
   * 获取最新版本
   * @param {string} namespace 命名空间
   * @param {string} name 插件名
   * @returns {Promise<string>}
   */
  async getLatestVersion(extensionId) {
    const { namespace, name } = this._parseExtensionId(extensionId);
    
    try {
      const ext = await this.getExtension(extensionId);
      return ext.version || '0.0.0';
    } catch (error) {
      console.warn(`[OpenVSXClient] 获取最新版本失败: ${extensionId}`);
      return '0.0.0';
    }
  }

  /**
   * 比较版本
   * @param {string} current 当前版本
   * @param {string} latest 最新版本
   * @returns {'up-to-date' | 'update-available' | 'regress'}
   */
  compareVersions(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const c = currentParts[i] || 0;
      const l = latestParts[i] || 0;
      
      if (l > c) return 'update-available';
      if (c > l) return 'regress';
    }
    
    return 'up-to-date';
  }

  /**
   * 获取更新类型
   * @param {string} current 
   * @param {string} latest 
   * @returns {'major' | 'minor' | 'patch'}
   */
  _getUpdateType(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    if (latestParts[0] > currentParts[0]) return 'major';
    if (latestParts[1] > currentParts[1]) return 'minor';
    return 'patch';
  }
}

// ==================== 导出 ====================

module.exports = {
  OpenVSXClient,
  PluginInstaller,
  Endpoints,
  HttpClient
};
