/**
 * 插件配置管理器 - OpenDev IDE
 * 阶段 2.5.2: 插件配置存储
 * 
 * 存储目录: {userData}/plugin-configs/
 */

const fs = require('fs');
const path = require('path');

/**
 * 插件配置管理器
 */
class PluginConfigManager {
  /**
   * @param {string} userDataPath 用户数据目录
   */
  constructor(userDataPath) {
    this.userDataPath = userDataPath;
    this.configsDir = path.join(userDataPath, 'plugin-configs');
    this._ensureConfigsDir();
  }

  /**
   * 确保配置目录存在
   */
  _ensureConfigsDir() {
    if (!fs.existsSync(this.configsDir)) {
      fs.mkdirSync(this.configsDir, { recursive: true });
    }
  }

  /**
   * 获取插件配置文件的路径
   * @param {string} pluginId 
   * @returns {string}
   */
  _getConfigPath(pluginId) {
    // 安全的文件名
    const safeId = pluginId.replace(/[^a-zA-Z0-9.-]/g, '_');
    return path.join(this.configsDir, `${safeId}.json`);
  }

  /**
   * 读取配置
   * @param {string} pluginId 插件 ID
   * @returns {object|null}
   */
  getConfig(pluginId) {
    const configPath = this._getConfigPath(pluginId);
    
    try {
      if (!fs.existsSync(configPath)) {
        return null;
      }
      
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`[PluginConfigManager] 读取配置失败 (${pluginId}):`, error.message);
      return null;
    }
  }

  /**
   * 保存配置
   * @param {string} pluginId 插件 ID
   * @param {object} config 配置对象
   */
  setConfig(pluginId, config) {
    const configPath = this._getConfigPath(pluginId);
    
    try {
      this._ensureConfigsDir();
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log(`[PluginConfigManager] 已保存配置: ${pluginId}`);
    } catch (error) {
      console.error(`[PluginConfigManager] 保存配置失败 (${pluginId}):`, error.message);
      throw error;
    }
  }

  /**
   * 更新配置（合并现有配置）
   * @param {string} pluginId 插件 ID
   * @param {object} config 新配置
   */
  updateConfig(pluginId, config) {
    const existingConfig = this.getConfig(pluginId) || {};
    const mergedConfig = { ...existingConfig, ...config };
    this.setConfig(pluginId, mergedConfig);
  }

  /**
   * 删除配置
   * @param {string} pluginId 插件 ID
   */
  deleteConfig(pluginId) {
    const configPath = this._getConfigPath(pluginId);
    
    try {
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        console.log(`[PluginConfigManager] 已删除配置: ${pluginId}`);
      }
    } catch (error) {
      console.error(`[PluginConfigManager] 删除配置失败 (${pluginId}):`, error.message);
      throw error;
    }
  }

  /**
   * 获取所有已配置的插件
   * @returns {string[]}
   */
  getConfiguredPlugins() {
    try {
      const files = fs.readdirSync(this.configsDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', '').replace(/_/g, '-'));
    } catch (error) {
      console.error('[PluginConfigManager] 获取配置列表失败:', error.message);
      return [];
    }
  }

  /**
   * 检查插件是否有配置
   * @param {string} pluginId 
   * @returns {boolean}
   */
  hasConfig(pluginId) {
    const configPath = this._getConfigPath(pluginId);
    return fs.existsSync(configPath);
  }

  /**
   * 获取配置数量
   * @returns {number}
   */
  getConfigCount() {
    return this.getConfiguredPlugins().length;
  }

  /**
   * 导出所有配置
   * @returns {object}
   */
  exportAll() {
    const plugins = this.getConfiguredPlugins();
    const configs = {};
    
    for (const pluginId of plugins) {
      const config = this.getConfig(pluginId);
      if (config) {
        configs[pluginId] = config;
      }
    }
    
    return configs;
  }

  /**
   * 导入配置
   * @param {object} configs 配置对象
   */
  importAll(configs) {
    for (const [pluginId, config] of Object.entries(configs)) {
      this.setConfig(pluginId, config);
    }
  }
}

module.exports = { PluginConfigManager };
