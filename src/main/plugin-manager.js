/**
 * 插件管理器 - OpenDev IDE
 * 阶段 2.1: 插件加载框架
 * 作者: 桥王 (Bridge)
 */

const fs = require('fs');
const path = require('path');
const { VSCodeAPI } = require('./vscode-api');

// ==================== 2.1.1 插件目录结构定义 ====================

/**
 * 插件目录结构规范
 * 
 * 插件目录结构:
 * - plugins/
 *   - {plugin-id}/
 *     - package.json        # 插件元数据 (必需)
 *     - extension.js        # 插件入口文件 (必需)
 *     - src/                # 源代码目录
 *     - assets/             # 静态资源
 *     - locales/           # 国际化文件
 *     - package.nls.json    # 本地化字符串
 *     - README.md          # 插件说明
 *     - LICENSE            # 许可证
 * 
 * 用户插件目录: ~/.opendev/plugins/
 * 内置插件目录: {app}/plugins/
 */

const PLUGIN_STRUCTURE = {
  REQUIRED_FILES: ['package.json', 'extension.js'],
  OPTIONAL_DIRS: ['src', 'assets', 'locales'],
  OPTIONAL_FILES: ['README.md', 'LICENSE', 'package.nls.json']
};

/**
 * 插件目录扫描器
 */
class PluginScanner {
  constructor(pluginPaths = []) {
    this.pluginPaths = pluginPaths;
  }

  /**
   * 扫描所有插件目录
   * @returns {Promise<Array<PluginInfo>>}
   */
  async scan() {
    const plugins = [];
    
    for (const pluginPath of this.pluginPaths) {
      if (!fs.existsSync(pluginPath)) {
        console.warn(`[PluginScanner] 插件目录不存在: ${pluginPath}`);
        continue;
      }

      const entries = fs.readdirSync(pluginPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const fullPath = path.join(pluginPath, entry.name);
        const pluginInfo = await this.scanPluginDir(fullPath);
        
        if (pluginInfo) {
          plugins.push(pluginInfo);
        }
      }
    }
    
    return plugins;
  }

  /**
   * 扫描单个插件目录
   * @param {string} pluginDir 
   * @returns {Promise<PluginInfo|null>}
   */
  async scanPluginDir(pluginDir) {
    const pluginId = path.basename(pluginDir);
    const packageJsonPath = path.join(pluginDir, 'package.json');
    const extensionPath = path.join(pluginDir, 'extension.js');

    // 检查必需文件
    if (!fs.existsSync(packageJsonPath) || !fs.existsSync(extensionPath)) {
      console.warn(`[PluginScanner] 插件 ${pluginId} 缺少必需文件`);
      return null;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      return {
        id: pluginId,
        path: pluginDir,
        packageJson,
        name: packageJson.name || pluginId,
        version: packageJson.version || '0.0.0',
        description: packageJson.description || '',
        author: packageJson.author || 'Unknown',
        main: packageJson.main || 'extension.js',
        engines: packageJson.engines || {},
        contributes: packageJson.contributes || {},
        activationEvents: packageJson.activationEvents || [],
        dependencies: packageJson.dependencies || {},
        optionalDependencies: packageJson.optionalDependencies || {}
      };
    } catch (error) {
      console.error(`[PluginScanner] 解析插件 ${pluginId} 失败:`, error.message);
      return null;
    }
  }
}

// ==================== 2.1.2 package.json 解析器 ====================

/**
 * Package.json 解析器
 */
class PackageJsonParser {
  /**
   * 解析插件的 package.json
   * @param {string} pluginDir 
   * @returns {PluginManifest}
   */
  static parse(pluginDir) {
    const packageJsonPath = path.join(pluginDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json 不存在: ${pluginDir}`);
    }

    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const manifest = JSON.parse(content);
      
      return this.validate(manifest, pluginDir);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`package.json 格式错误: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 验证插件清单
   * @param {object} manifest 
   * @param {string} pluginDir 
   * @returns {PluginManifest}
   */
  static validate(manifest, pluginDir) {
    // 必需字段检查
    const requiredFields = ['name', 'version', 'main'];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!manifest[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`package.json 缺少必需字段: ${missingFields.join(', ')}`);
    }

    // 验证 main 入口文件存在
    const mainPath = path.resolve(pluginDir, manifest.main);
    if (!fs.existsSync(mainPath)) {
      throw new Error(`插件入口文件不存在: ${mainPath}`);
    }

    // 返回规范化的插件清单
    return {
      id: manifest.name,
      name: manifest.displayName || manifest.name,
      version: manifest.version,
      description: manifest.description || '',
      author: this.parseAuthor(manifest.author),
      main: manifest.main,
      mainPath: mainPath,
      engines: manifest.engines || {},
      contributes: manifest.contributes || {},
      activationEvents: manifest.activationEvents || [],
      dependencies: manifest.dependencies || {},
      optionalDependencies: manifest.optionalDependencies || {},
      keywords: manifest.keywords || [],
      categories: manifest.categories || [],
      icon: manifest.icon || null,
      license: manifest.license || 'MIT',
      repository: manifest.repository || null,
      bugs: manifest.bugs || null,
      homepage: manifest.homepage || null,
      // 扩展 API 版本
      extensionApiVersion: manifest.extensionApiVersion || '1.0.0'
    };
  }

  /**
   * 解析 author 字段
   * @param {string|object} author 
   * @returns {object}
   */
  static parseAuthor(author) {
    if (!author) return { name: 'Unknown', email: '' };
    
    if (typeof author === 'string') {
      // 支持格式: "Name <email> (url)" 或 "Name"
      const match = author.match(/^([^<]+)(?:<([^>]+)>)?(?:\s*\(([^)]+)\))?/);
      if (match) {
        return {
          name: match[1].trim(),
          email: match[2] || '',
          url: match[3] || ''
        };
      }
      return { name: author, email: '', url: '' };
    }
    
    return {
      name: author.name || 'Unknown',
      email: author.email || '',
      url: author.url || ''
    };
  }
}

// ==================== 2.1.3 插件注册机制 ====================

/**
 * 插件状态枚举
 */
const PluginState = {
  UNINSTALLED: 'uninstalled',
  INSTALLED: 'installed',
  LOADING: 'loading',
  ACTIVATED: 'activated',
  DEACTIVATED: 'deactivated',
  ERROR: 'error'
};

/**
 * 插件注册表
 */
class PluginRegistry {
  constructor() {
    this.plugins = new Map();        // pluginId -> PluginInstance
    this.activationOrder = [];      // 激活顺序
    this.pluginContexts = new Map(); // 插件上下文
  }

  /**
   * 注册插件
   * @param {PluginInfo} pluginInfo 
   * @returns {PluginInstance}
   */
  register(pluginInfo) {
    if (this.plugins.has(pluginInfo.id)) {
      console.warn(`[PluginRegistry] 插件 ${pluginInfo.id} 已注册，跳过`);
      return this.plugins.get(pluginInfo.id);
    }

    const instance = {
      id: pluginInfo.id,
      name: pluginInfo.name,
      version: pluginInfo.version,
      path: pluginInfo.path,
      manifest: pluginInfo.packageJson,
      state: PluginState.INSTALLED,
      exports: null,
      activations: 0,
      errors: []
    };

    this.plugins.set(pluginInfo.id, instance);
    this.activationOrder.push(pluginInfo.id);
    
    console.log(`[PluginRegistry] 注册插件: ${pluginInfo.id} v${pluginInfo.version}`);
    
    return instance;
  }

  /**
   * 获取插件实例
   * @param {string} pluginId 
   * @returns {PluginInstance|null}
   */
  get(pluginId) {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * 获取所有已注册插件
   * @returns {Array<PluginInstance>}
   */
  getAll() {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件状态
   * @param {string} pluginId 
   * @returns {string}
   */
  getState(pluginId) {
    const plugin = this.plugins.get(pluginId);
    return plugin ? plugin.state : PluginState.UNINSTALLED;
  }

  /**
   * 批量注册插件
   * @param {Array<PluginInfo>} plugins 
   */
  registerBatch(plugins) {
    for (const plugin of plugins) {
      this.register(plugin);
    }
  }

  /**
   * 卸载插件
   * @param {string} pluginId 
   */
  unregister(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`[PluginRegistry] 插件 ${pluginId} 未注册`);
      return;
    }

    // 如果插件处于激活状态，先停用
    if (plugin.state === PluginState.ACTIVATED) {
      this.deactivate(pluginId);
    }

    this.plugins.delete(pluginId);
    this.activationOrder = this.activationOrder.filter(id => id !== pluginId);
    this.pluginContexts.delete(pluginId);
    
    console.log(`[PluginRegistry] 卸载插件: ${pluginId}`);
  }

  /**
   * 激活插件
   * @param {string} pluginId 
   * @param {object} context 
   * @returns {Promise<any>}
   */
  async activate(pluginId, context = {}) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件未注册: ${pluginId}`);
    }

    if (plugin.state === PluginState.ACTIVATED) {
      console.log(`[PluginRegistry] 插件 ${pluginId} 已激活`);
      return plugin.exports;
    }

    plugin.state = PluginState.LOADING;
    
    try {
      // 加载插件入口文件
      const extensionPath = path.resolve(plugin.path, plugin.manifest.main);
      delete require.cache[require.resolve(extensionPath)];
      
      const extension = require(extensionPath);
      
      // 调用激活函数
      if (typeof extension.activate === 'function') {
        const api = this._createPluginAPI(pluginId);
        plugin.exports = await extension.activate(context, api);
      } else {
        plugin.exports = extension;
      }

      plugin.state = PluginState.ACTIVATED;
      plugin.activations++;
      
      console.log(`[PluginRegistry] 激活插件: ${pluginId}`);
      
      return plugin.exports;
    } catch (error) {
      plugin.state = PluginState.ERROR;
      plugin.errors.push(error.message);
      console.error(`[PluginRegistry] 激活插件失败: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * 停用插件
   * @param {string} pluginId 
   */
  async deactivate(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`[PluginRegistry] 插件未注册: ${pluginId}`);
      return;
    }

    if (plugin.state !== PluginState.ACTIVATED) {
      return;
    }

    try {
      // 调用停用函数
      if (plugin.exports && typeof plugin.exports.deactivate === 'function') {
        plugin.exports.deactivate();
      }

      // 清理 require 缓存
      const extensionPath = path.resolve(plugin.path, plugin.manifest.main);
      delete require.cache[require.resolve(extensionPath)];
      
      plugin.state = PluginState.DEACTIVATED;
      plugin.exports = null;
      
      console.log(`[PluginRegistry] 停用插件: ${pluginId}`);
    } catch (error) {
      plugin.errors.push(error.message);
      console.error(`[PluginRegistry] 停用插件失败: ${pluginId}`, error);
    }
  }

  /**
   * 创建插件 API
   * @param {string} pluginId 
   * @returns {object}
   */
  _createPluginAPI(pluginId) {
    // 使用完整的 VSCode API
    const vscodeApi = new VSCodeAPI();
    vscodeApi._extensionPath = this._getPluginPath(pluginId);
    
    return {
      // 展开完整 VSCode API
      ...vscodeApi,
      
      // 插件自身 API
      id: pluginId,
      
      // 扩展插件 API
      plugins: {
        getPluginPath: (id) => this._getPluginPath(id)
      }
    };
  }

  /**
   * 获取插件路径
   */
  _getPluginPath(pluginId) {
    const plugin = this.plugins.get(pluginId);
    return plugin ? plugin.path : null;
  }

  /**
   * 获取工作区文件夹
   */
  _getWorkspaceFolders() {
    return this.context?.workspaceFolders || [];
  }

  /**
   * 获取事件
   */
  _getEvents() {
    return this._events || {};
  }

  /**
   * 获取窗口
   */
  _getWindow() {
    return this.context?.window || {};
  }
        const handlers = this.events.get(event) || [];
        handlers.forEach(h => h(...args));
      }
    };
  }
}

// ==================== 插件管理器主类 ====================

/**
 * 插件管理器
 */
class PluginManager {
  constructor(options = {}) {
    this.scanner = new PluginScanner(options.pluginPaths || []);
    this.registry = new PluginRegistry();
    this.context = options.context || {};
    this.autoActivate = options.autoActivate !== false;
  }

  /**
   * 初始化并加载所有插件
   * @returns {Promise<Array<PluginInstance>>}
   */
  async initialize() {
    console.log('[PluginManager] 初始化插件系统...');
    
    // 扫描插件
    const plugins = await this.scanner.scan();
    console.log(`[PluginManager] 扫描到 ${plugins.length} 个插件`);
    
    // 注册插件
    this.registry.registerBatch(plugins);
    
    // 自动激活
    if (this.autoActivate) {
      await this.activateAll();
    }
    
    return this.registry.getAll();
  }

  /**
   * 激活所有插件
   */
  async activateAll() {
    const plugins = this.registry.getAll();
    
    for (const plugin of plugins) {
      if (plugin.state === PluginState.INSTALLED) {
        try {
          await this.registry.activate(plugin.id, this.context);
        } catch (error) {
          console.error(`[PluginManager] 激活插件失败: ${plugin.id}`, error.message);
        }
      }
    }
  }

  /**
   * 获取插件列表
   * @returns {Array<PluginInstance>}
   */
  getPlugins() {
    return this.registry.getAll();
  }

  /**
   * 获取单个插件
   * @param {string} pluginId 
   * @returns {PluginInstance|null}
   */
  getPlugin(pluginId) {
    return this.registry.get(pluginId);
  }

  /**
   * 激活指定插件
   * @param {string} pluginId 
   */
  async activatePlugin(pluginId) {
    return await this.registry.activate(pluginId, this.context);
  }

  /**
   * 停用指定插件
   * @param {string} pluginId 
   */
  async deactivatePlugin(pluginId) {
    await this.registry.deactivate(pluginId);
  }

  /**
   * 获取插件状态
   * @param {string} pluginId 
   * @returns {string}
   */
  getPluginState(pluginId) {
    return this.registry.getState(pluginId);
  }
}

// 导出
module.exports = {
  PluginManager,
  PluginScanner,
  PackageJsonParser,
  PluginRegistry,
  PluginState,
  PLUGIN_STRUCTURE
};
