/**
 * 插件生态系统 - OpenDev IDE
 * 阶段 4.2: 插件生态完善
 */

const fs = require('fs');
const path = require('path');

/**
 * 插件生态系统管理器
 */
class PluginEcosystem {
  constructor(userDataPath) {
    this.userDataPath = userDataPath;
    this.ratingsFile = path.join(userDataPath, 'plugin-ratings.json');
    this.versionsFile = path.join(userDataPath, 'plugin-versions.json');
    this.docsPath = path.join(userDataPath, 'plugin-docs');
    
    this._ensureDir();
    this.ratings = this._loadRatings();
    this.versions = this._loadVersions();
  }

  /**
   * 确保目录存在
   */
  _ensureDir() {
    if (!fs.existsSync(this.userDataPath)) {
      fs.mkdirSync(this.userDataPath, { recursive: true });
    }
    if (!fs.existsSync(this.docsPath)) {
      fs.mkdirSync(this.docsPath, { recursive: true });
    }
  }

  /**
   * 加载评分数据
   */
  _loadRatings() {
    try {
      if (fs.existsSync(this.ratingsFile)) {
        return JSON.parse(fs.readFileSync(this.ratingsFile, 'utf-8'));
      }
    } catch (e) {}
    return {};
  }

  /**
   * 加载版本数据
   */
  _loadVersions() {
    try {
      if (fs.existsSync(this.versionsFile)) {
        return JSON.parse(fs.readFileSync(this.versionsFile, 'utf-8'));
      }
    } catch (e) {}
    return {};
  }

  /**
   * 保存评分
   */
  _saveRatings() {
    fs.writeFileSync(this.ratingsFile, JSON.stringify(this.ratings, null, 2), 'utf-8');
  }

  /**
   * 保存版本数据
   */
  _saveVersions() {
    fs.writeFileSync(this.versionsFile, JSON.stringify(this.versions, null, 2), 'utf-8');
  }

  // ==================== 4.2.1 插件推荐 ====================

  /**
   * 获取推荐插件
   * @param {string} category 分类
   * @param {number} limit 数量
   */
  getRecommended(category = null, limit = 10) {
    // 预置推荐列表
    const recommendations = {
      popular: [
        { id: 'ms-python.python', name: 'Python', publisher: 'Microsoft', downloads: 34810000, rating: 4.7 },
        { id: 'dbaeumer.vscode-eslint', name: 'ESLint', publisher: 'Microsoft', downloads: 15000000, rating: 4.6 },
        { id: 'esbenp.prettier-vscode', name: 'Prettier', publisher: 'Prettier', downloads: 12000000, rating: 4.5 },
        { id: 'ms-vscode.remote-containers', name: 'Dev Containers', publisher: 'Microsoft', downloads: 8000000, rating: 4.4 },
        { id: 'vuejs.volar', name: 'Vue - Official', publisher: 'Vue', downloads: 6000000, rating: 4.7 },
        { id: 'rust-lang.rust-analyzer', name: 'rust-analyzer', publisher: 'rust-lang', downloads: 5000000, rating: 4.8 },
        { id: 'redhat.java', name: 'Language Support for Java', publisher: 'Red Hat', downloads: 4000000, rating: 4.5 },
        { id: 'eamodio.gitlens', name: 'GitLens', publisher: 'eamodio', downloads: 2800000, rating: 4.7 },
        { id: 'ms-vscode.vscode-typescript-next', name: 'TypeScript Nightly', publisher: 'Microsoft', downloads: 2500000, rating: 4.3 },
        { id: 'golang.go', name: 'Go', publisher: 'Go', downloads: 2200000, rating: 4.6 }
      ],
      frontend: [
        { id: 'vuejs.volar', name: 'Vue - Official', publisher: 'Vue', downloads: 6000000, rating: 4.7 },
        { id: 'dbaeumer.vscode-eslint', name: 'ESLint', publisher: 'Microsoft', downloads: 15000000, rating: 4.6 },
        { id: 'esbenp.prettier-vscode', name: 'Prettier', publisher: 'Prettier', downloads: 12000000, rating: 4.5 },
        { id: 'bradlc.vscode-tailwindcss', name: 'Tailwind CSS IntelliSense', publisher: 'Brad Garland', downloads: 1800000, rating: 4.8 },
        { id: 'formulahendry.auto-rename-tag', name: 'Auto Rename Tag', publisher: 'Jun Han', downloads: 1500000, rating: 4.5 }
      ],
      backend: [
        { id: 'ms-python.python', name: 'Python', publisher: 'Microsoft', downloads: 34810000, rating: 4.7 },
        { id: 'rust-lang.rust-analyzer', name: 'rust-analyzer', publisher: 'rust-lang', downloads: 5000000, rating: 4.8 },
        { id: 'golang.go', name: 'Go', publisher: 'Go', downloads: 2200000, rating: 4.6 },
        { id: 'redhat.java', name: 'Language Support for Java', publisher: 'Red Hat', downloads: 4000000, rating: 4.5 },
        { id: 'vscjava.vscode-java-debug', name: 'Debugger for Java', publisher: 'Microsoft', downloads: 1500000, rating: 4.4 }
      ],
      ai: [
        { id: 'anthropic.claude-code', name: 'Claude Code', publisher: 'Anthropic', downloads: 3000000, rating: 4.6 },
        { id: 'github.copilot', name: 'GitHub Copilot', publisher: 'GitHub', downloads: 5000000, rating: 4.5 },
        { id: 'tabnine.tabnine-vscode', name: 'Tabnine AI Autocomplete', publisher: 'Tabnine', downloads: 2800000, rating: 4.3 },
        { id: 'amazonwebservices.amazon-q-vscode', name: 'Amazon Q', publisher: 'Amazon', downloads: 800000, rating: 4.2 }
      ],
      tools: [
        { id: 'eamodio.gitlens', name: 'GitLens', publisher: 'eamodio', downloads: 2800000, rating: 4.7 },
        { id: 'ms-vscode.remote-containers', name: 'Dev Containers', publisher: 'Microsoft', downloads: 8000000, rating: 4.4 },
        { id: 'ms-vscode.live-server', name: 'Live Server', publisher: 'Ritwick Dey', downloads: 2500000, rating: 4.5 },
        { id: 'editorconfig.editorconfig', name: 'EditorConfig', publisher: 'EditorConfig', downloads: 1800000, rating: 4.3 }
      ]
    };

    if (category && recommendations[category]) {
      return recommendations[category].slice(0, limit);
    }
    
    return recommendations.popular.slice(0, limit);
  }

  /**
   * 按分类获取插件
   */
  getByCategory(category) {
    return this.getRecommended(category, 20);
  }

  /**
   * 获取所有分类
   */
  getCategories() {
    return [
      { id: 'popular', name: '热门插件', icon: '🔥' },
      { id: 'frontend', name: '前端开发', icon: '🎨' },
      { id: 'backend', name: '后端开发', icon: '⚙️' },
      { id: 'ai', name: 'AI 辅助', icon: '🤖' },
      { id: 'tools', name: '开发工具', icon: '🔧' }
    ];
  }

  // ==================== 4.2.2 插件评分系统 ====================

  /**
   * 获取插件评分
   */
  getRating(pluginId) {
    const pluginRatings = this.ratings[pluginId];
    if (!pluginRatings) {
      return { average: 0, count: 0, userRating: null };
    }
    
    const ratings = Object.values(pluginRatings.ratings || {});
    const avg = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;
    
    return {
      average: Math.round(avg * 10) / 10,
      count: ratings.length,
      userRating: pluginRatings.userRating || null
    };
  }

  /**
   * 设置用户评分
   */
  setRating(pluginId, rating) {
    if (!this.ratings[pluginId]) {
      this.ratings[pluginId] = { ratings: {} };
    }
    
    this.ratings[pluginId].ratings['local'] = rating;
    this.ratings[pluginId].userRating = rating;
    this._saveRatings();
    
    return this.getRating(pluginId);
  }

  /**
   * 获取所有评分
   */
  getAllRatings() {
    return this.ratings;
  }

  // ==================== 4.2.3 插件版本管理 ====================

  /**
   * 记录已安装版本
   */
  recordVersion(pluginId, version) {
    if (!this.versions[pluginId]) {
      this.versions[pluginId] = { current: version, history: [] };
    }
    
    // 添加到历史
    this.versions[pluginId].history.push({
      version,
      date: Date.now()
    });
    
    this.versions[pluginId].current = version;
    this._saveVersions();
  }

  /**
   * 获取已安装版本
   */
  getVersion(pluginId) {
    return this.versions[pluginId]?.current || null;
  }

  /**
   * 获取版本历史
   */
  getVersionHistory(pluginId) {
    return this.versions[pluginId]?.history || [];
  }

  /**
   * 获取所有已安装插件版本
   */
  getAllVersions() {
    return this.versions;
  }

  /**
   * 版本冲突检测
   */
  checkConflicts(plugins) {
    const conflicts = [];
    
    for (const plugin of plugins) {
      // 检查依赖版本冲突
      if (plugin.dependencies) {
        for (const [depName, depVersion] of Object.entries(plugin.dependencies)) {
          const installed = this.versions[depName];
          if (installed && !this._isVersionCompatible(installed.current, depVersion)) {
            conflicts.push({
              plugin: plugin.id,
              dependency: depName,
              required: depVersion,
              installed: installed.current,
              severity: 'error'
            });
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 版本兼容性检查
   */
  _isVersionCompatible(current, required) {
    if (required.startsWith('^')) {
      const requiredMajor = required.slice(1).split('.')[0];
      const currentMajor = current.split('.')[0];
      return currentMajor === requiredMajor;
    }
    if (required.startsWith('~')) {
      const requiredParts = required.slice(1).split('.');
      const currentParts = current.split('.');
      return currentParts[0] === requiredParts[0] && currentParts[1] === requiredParts[1];
    }
    return current === required;
  }

  // ==================== 4.2.4 插件开发文档 ====================

  /**
   * 生成插件开发指南
   */
  generateDevGuide() {
    const guide = {
      title: 'OpenDev IDE 插件开发指南',
      version: '1.0.0',
      sections: [
        {
          title: '快速开始',
          content: `创建一个 OpenDev IDE 插件非常简单，只需要以下文件：
1. package.json - 插件配置
2. extension.js - 插件入口`
        },
        {
          title: 'package.json 必需字段',
          fields: [
            { name: 'name', type: 'string', required: true, description: '插件唯一标识' },
            { name: 'version', type: 'string', required: true, description: '版本号' },
            { name: 'main', type: 'string', required: true, description: '入口文件' },
            { name: 'engines', type: 'object', required: true, description: '兼容的 IDE 版本' }
          ]
        },
        {
          title: 'extension.js 格式',
          code: `function activate(context, api) {
  // 插件激活时调用
  console.log('插件已激活');
  
  // 注册命令
  api.registerCommand('my-plugin.hello', () => {
    api.showInformationMessage('Hello from my plugin!');
  });
  
  return {
    name: 'my-plugin',
    version: '1.0.0'
  };
}

function deactivate() {
  // 插件停用时调用
}

module.exports = { activate, deactivate };`
        },
        {
          title: 'API 参考',
          sections: [
            'api.registerCommand(command, handler)',
            'api.showInformationMessage(message)',
            'api.showWarningMessage(message)',
            'api.showErrorMessage(message)',
            'api.workspace.getConfiguration()',
            'api.window.createTerminal()',
            'api.window.createWebviewPanel()'
          ]
        }
      ]
    };
    
    // 保存到文件
    const guidePath = path.join(this.docsPath, 'development-guide.json');
    fs.writeFileSync(guidePath, JSON.stringify(guide, null, 2), 'utf-8');
    
    return guide;
  }

  /**
   * 生成 API 文档
   */
  generateAPIDoc() {
    const api = {
      title: 'OpenDev Plugin API',
      version: '1.0.0',
      description: '完整的插件 API 参考',
      namespaces: [
        {
          name: 'vscode',
          description: '核心 VSCode 兼容 API',
          properties: [
            { name: 'version', type: 'string', description: 'API 版本' },
            { name: 'workspace', type: 'object', description: '工作区 API' },
            { name: 'window', type: 'object', description: '窗口 API' },
            { name: 'commands', type: 'object', description: '命令 API' },
            { name: 'languages', type: 'object', description: '语言服务 API' },
            { name: 'extensions', type: 'object', description: '扩展 API' }
          ]
        },
        {
          name: 'workspace',
          description: '工作区操作',
          methods: [
            { name: 'getConfiguration', params: '[section]', returns: 'Configuration' },
            { name: 'openTextDocument', params: 'uri', returns: 'TextDocument' },
            { name: 'workspaceFolders', type: 'array', description: '工作区文件夹' }
          ]
        },
        {
          name: 'window',
          description: '窗口和 UI',
          methods: [
            { name: 'showInformationMessage', params: 'message', returns: 'void' },
            { name: 'showWarningMessage', params: 'message', returns: 'void' },
            { name: 'showErrorMessage', params: 'message', returns: 'void' },
            { name: 'createTerminal', params: '[options]', returns: 'Terminal' },
            { name: 'createWebviewPanel', params: 'viewType, title, showOptions', returns: 'WebviewPanel' }
          ]
        },
        {
          name: 'commands',
          description: '命令注册和执行',
          methods: [
            { name: 'registerCommand', params: 'command, handler', returns: 'Disposable' },
            { name: 'executeCommand', params: 'command, ...args', returns: 'any' }
          ]
        }
      ]
    };
    
    const apiPath = path.join(this.docsPath, 'api-reference.json');
    fs.writeFileSync(apiPath, JSON.stringify(api, null, 2), 'utf-8');
    
    return api;
  }

  /**
   * 生成示例插件模板
   */
  generateSampleTemplates() {
    const samples = {
      'hello-world': {
        name: 'Hello World',
        description: '最简单的插件示例',
        files: {
          'package.json': {
            name: 'hello-world',
            version: '1.0.0',
            main: 'extension.js',
            engines: { opendev: '>=1.0.0' }
          },
          'extension.js': `function activate(context, api) {
  api.showInformationMessage('Hello World 插件已激活!');
}
module.exports = { activate };`
        }
      },
      'command-sample': {
        name: '命令示例',
        description: '展示如何注册命令',
        files: {
          'package.json': {
            name: 'command-sample',
            version: '1.0.0',
            main: 'extension.js',
            engines: { opendev: '>=1.0.0' }
          },
          'extension.js': `function activate(context, api) {
  // 注册命令
  api.registerCommand('hello.sayHello', () => {
    api.showInformationMessage('Hello from command!');
  });
}
module.exports = { activate };`
        }
      },
      'webview-sample': {
        name: 'Webview 示例',
        description: '展示如何创建 Webview',
        files: {
          'package.json': {
            name: 'webview-sample',
            version: '1.0.0',
            main: 'extension.js',
            engines: { opendev: '>=1.0.0' }
          },
          'extension.js': `function activate(context, api) {
  // 创建 Webview
  const panel = api.window.createWebviewPanel(
    'myWebview',
    'My Webview',
    { viewColumn: 1 },
    { enableScripts: true }
  );
  
  panel.webview.html = \`<!DOCTYPE html>
<html><body><h1>Hello Webview!</h1></body></html>\`;
}
module.exports = { activate };`
        }
      }
    };
    
    const samplesPath = path.join(this.docsPath, 'sample-templates.json');
    fs.writeFileSync(samplesPath, JSON.stringify(samples, null, 2), 'utf-8');
    
    return samples;
  }

  /**
   * 获取所有文档
   */
  getDocs() {
    return {
      guide: path.join(this.docsPath, 'development-guide.json'),
      api: path.join(this.docsPath, 'api-reference.json'),
      samples: path.join(this.docsPath, 'sample-templates.json')
    };
  }

  /**
   * 生成所有文档
   */
  generateAllDocs() {
    this.generateDevGuide();
    this.generateAPIDoc();
    this.generateSampleTemplates();
    return this.getDocs();
  }
}

module.exports = { PluginEcosystem };
