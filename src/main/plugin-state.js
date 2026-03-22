/**
 * 插件状态管理器 - OpenDev IDE
 * 阶段 2.5.1: 插件状态持久化
 * 
 * 存储位置: {userData}/plugin-states.json
 */

const fs = require('fs');
const path = require('path');

/**
 * 插件状态管理器
 */
class PluginStateManager {
  /**
   * @param {string} userDataPath 用户数据目录
   */
  constructor(userDataPath) {
    this.userDataPath = userDataPath;
    this.statesFile = path.join(userDataPath, 'plugin-states.json');
    this.states = new Map();
  }

  /**
   * 加载状态
   * @returns {Promise<Map<string, PluginState>>}
   */
  load() {
    return new Promise((resolve, reject) => {
      try {
        // 确保目录存在
        if (!fs.existsSync(this.userDataPath)) {
          fs.mkdirSync(this.userDataPath, { recursive: true });
        }

        // 读取状态文件
        if (!fs.existsSync(this.statesFile)) {
          console.log('[PluginStateManager] 状态文件不存在，使用空状态');
          resolve(new Map());
          return;
        }

        const data = fs.readFileSync(this.statesFile, 'utf-8');
        const statesObj = JSON.parse(data);

        // 转换为 Map
        this.states = new Map(Object.entries(statesObj));
        console.log(`[PluginStateManager] 已加载 ${this.states.size} 个插件状态`);
        resolve(this.states);
      } catch (error) {
        console.error('[PluginStateManager] 加载状态失败:', error.message);
        // 返回空状态而不是抛出错误
        resolve(new Map());
      }
    });
  }

  /**
   * 保存状态到文件
   */
  save() {
    return new Promise((resolve, reject) => {
      try {
        const statesObj = Object.fromEntries(this.states);
        fs.writeFileSync(this.statesFile, JSON.stringify(statesObj, null, 2), 'utf-8');
        console.log(`[PluginStateManager] 已保存 ${this.states.size} 个插件状态`);
        resolve();
      } catch (error) {
        console.error('[PluginStateManager] 保存状态失败:', error.message);
        reject(error);
      }
    });
  }

  /**
   * 获取插件状态
   * @param {string} pluginId 插件 ID
   * @returns {PluginState|null}
   */
  getState(pluginId) {
    return this.states.get(pluginId) || null;
  }

  /**
   * 获取所有插件状态
   * @returns {Map<string, PluginState>}
   */
  getAllStates() {
    return new Map(this.states);
  }

  /**
   * 设置插件状态
   * @param {string} pluginId 插件 ID
   * @param {object} state 状态对象
   */
  setState(pluginId, state) {
    const existingState = this.states.get(pluginId) || {};
    
    this.states.set(pluginId, {
      ...existingState,
      ...state,
      lastModified: Date.now()
    });
  }

  /**
   * 批量保存状态
   * @param {Map<string, PluginState>} states 状态 Map
   */
  saveAll(states) {
    for (const [pluginId, state] of states) {
      this.setState(pluginId, state);
    }
    return this.save();
  }

  /**
   * 删除插件状态
   * @param {string} pluginId 插件 ID
   */
  deleteState(pluginId) {
    this.states.delete(pluginId);
  }

  /**
   * 获取所有已禁用的插件
   * @returns {string[]}
   */
  getDisabledPlugins() {
    const disabled = [];
    for (const [pluginId, state] of this.states) {
      if (state.enabled === false) {
        disabled.push(pluginId);
      }
    }
    return disabled;
  }

  /**
   * 获取所有已启用的插件
   * @returns {string[]}
   */
  getEnabledPlugins() {
    const enabled = [];
    for (const [pluginId, state] of this.states) {
      if (state.enabled === true) {
        enabled.push(pluginId);
      }
    }
    return enabled;
  }

  /**
   * 启用插件
   * @param {string} pluginId 
   */
  enablePlugin(pluginId) {
    this.setState(pluginId, { 
      enabled: true, 
      enabledAt: Date.now() 
    });
  }

  /**
   * 禁用插件
   * @param {string} pluginId 
   */
  disablePlugin(pluginId) {
    this.setState(pluginId, { 
      enabled: false, 
      disabledAt: Date.now() 
    });
  }

  /**
   * 检查插件是否启用
   * @param {string} pluginId 
   * @returns {boolean}
   */
  isEnabled(pluginId) {
    const state = this.states.get(pluginId);
    return state ? state.enabled !== false : true; // 默认启用
  }
}

/**
 * 插件状态类型
 * @typedef {Object} PluginState
 * @property {boolean} enabled - 是否启用
 * @property {number} [enabledAt] - 启用时间戳
 * @property {number} [disabledAt] - 禁用时间戳
 * @property {number} lastModified - 最后修改时间
 */

module.exports = { PluginStateManager };
