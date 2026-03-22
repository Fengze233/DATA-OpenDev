const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('opendev', {
  // 插件系统
  plugins: {
    // 基础操作
    getList: () => ipcRenderer.invoke('plugins:getList'),
    activate: (pluginId) => ipcRenderer.invoke('plugins:activate', pluginId),
    deactivate: (pluginId) => ipcRenderer.invoke('plugins:deactivate', pluginId),
    uninstall: (pluginId) => ipcRenderer.invoke('plugins:uninstall', pluginId),
    search: (query, page) => ipcRenderer.invoke('plugins:search', { query, page }),
    install: (namespace, name, version) => ipcRenderer.invoke('plugins:install', { namespace, name, version }),

    // 2.5 新增 - 状态和配置
    getState: (pluginId) => ipcRenderer.invoke('plugins:getState', pluginId),
    setState: (pluginId, state) => ipcRenderer.invoke('plugins:setState', { pluginId, state }),
    getConfig: (pluginId) => ipcRenderer.invoke('plugins:getConfig', pluginId),
    setConfig: (pluginId, config) => ipcRenderer.invoke('plugins:setConfig', { pluginId, config }),
    checkUpdates: () => ipcRenderer.invoke('plugins:checkUpdates')
  },

  // 菜单事件
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback)
});
