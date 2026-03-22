const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  confirm: (options) => ipcRenderer.invoke('dialog:confirm', options),
  
  // File system operations
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (data) => ipcRenderer.invoke('fs:writeFile', data),
  getFileStats: (filePath) => ipcRenderer.invoke('fs:getFileStats', filePath),
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  createFile: (data) => ipcRenderer.invoke('fs:createFile', data),
  createFolder: (data) => ipcRenderer.invoke('fs:createFolder', data),
  delete: (targetPath) => ipcRenderer.invoke('fs:delete', { targetPath }),
  rename: (data) => ipcRenderer.invoke('fs:rename', data),
  
  // Menu events
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // AI Service - 多模型支持
  ai: {
    // 基础配置
    setApiKey: (apiKey) => ipcRenderer.invoke('ai:setApiKey', apiKey),
    setConfig: (config) => ipcRenderer.invoke('ai:setConfig', config),
    getConfig: () => ipcRenderer.invoke('ai:getConfig'),
    isConfigured: () => ipcRenderer.invoke('ai:isConfigured'),
    
    // 提供商管理
    setProvider: (provider) => ipcRenderer.invoke('ai:setProvider', provider),
    getProviders: () => ipcRenderer.invoke('ai:getProviders'),
    
    // 模型管理
    setModel: (model) => ipcRenderer.invoke('ai:setModel', model),
    getModels: (providerName) => ipcRenderer.invoke('ai:getModels', providerName),
    getAllModels: () => ipcRenderer.invoke('ai:getAllModels'),
    fetchOllamaModels: () => ipcRenderer.invoke('ai:fetchOllamaModels'),
    
    // 对话功能
    chat: (messages, options) => ipcRenderer.invoke('ai:chat', { messages, options }),
    chatSimple: (systemMessage, userMessage, options) => 
      ipcRenderer.invoke('ai:chatSimple', { systemMessage, userMessage, options })
  }
});

console.log('Preload script loaded');
