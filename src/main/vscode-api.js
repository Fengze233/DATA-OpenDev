/**
 * VSCode API 兼容层 - OpenDev IDE
 * 阶段 2.2: VSCode API 兼容层
 * 作者: 调度
 * 
 * 实现核心 VSCode API 子集，支持插件运行
 */

const fs = require('fs');
const path = require('path');

// 导入子模块
const workspace = require('./vscode-workspace');
const window = require('./vscode-window');
const commands = require('./vscode-commands');
const languages = require('./vscode-languages');

/**
 * VSCode API 主命名空间
 */
class VSCodeAPI {
  constructor() {
    this._extensionPath = '';
    this._extensionContext = null;
    
    // 初始化子模块
    this._initModules();
  }

  /**
   * 初始化子模块
   */
  _initModules() {
    // workspace
    this.workspace = workspace.create(this);
    
    // window
    this.window = window.create(this);
    
    // commands
    this.commands = commands.create(this);
    
    // languages
    this.languages = languages.create(this);
  }

  /**
   * 初始化扩展上下文
   * @param {object} context - 插件上下文
   */
  _initContext(context) {
    this._extensionContext = context;
    this._extensionPath = context.extensionPath || '';
    
    // 初始化各模块的上下文
    this.workspace._initContext(context);
    this.window._initContext(context);
    this.commands._initContext(context);
    this.languages._initContext(context);
  }

  /**
   * 获取扩展路径
   * @returns {string}
   */
  getExtensionPath() {
    return this._extensionPath;
  }

  /**
   * 环境信息
   */
  get env() {
    return {
      // 环境变量
      process: {
        env: process.env
      },
      // 语言
      language: 'zh-CN',
      // 平台
      platform: process.platform,
      // 版本
      version: '1.0.0'
    };
  }

  /**
   * 事件处理
   */
  get events() {
    return {
      _events: new Map(),
      
      on(event, handler) {
        if (!this._events.has(event)) {
          this._events.set(event, []);
        }
        this._events.get(event).push(handler);
        
        // 返回 disposable
        return {
          dispose: () => {
            const handlers = this._events.get(event);
            if (handlers) {
              const idx = handlers.indexOf(handler);
              if (idx >= 0) handlers.splice(idx, 1);
            }
          }
        };
      },
      
      emit(event, ...args) {
        const handlers = this._events.get(event) || [];
        handlers.forEach(h => {
          try {
            h(...args);
          } catch (e) {
            console.error(`[VSCode Events] Error in handler for ${event}:`, e);
          }
        });
      }
    };
  }
}

/**
 * Disposable 接口
 */
class Disposable {
  constructor(disposeFn) {
    this._disposeFn = disposeFn;
  }
  
  dispose() {
    if (this._disposeFn) {
      this._disposeFn();
      this._disposeFn = null;
    }
  }
}

/**
 * CancellationToken 取消令牌
 */
class CancellationToken {
  constructor() {
    this._isCancelled = false;
  }
  
  get isCancellationRequested() {
    return this._isCancelled;
  }
  
  cancel() {
    this._isCancelled = true;
  }
}

/**
 * 创建 vscode 实例
 * @param {object} context - 插件上下文
 * @returns {VSCodeAPI}
 */
function createVSCodeAPI(context) {
  const api = new VSCodeAPI();
  api._initContext(context);
  return api;
}

// 导出
module.exports = {
  VSCodeAPI,
  Disposable,
  CancellationToken,
  createVSCodeAPI,
  version: '1.0.0'
};
