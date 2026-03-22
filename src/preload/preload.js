const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  
  // File system operations
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (data) => ipcRenderer.invoke('fs:writeFile', data),
  getFileStats: (filePath) => ipcRenderer.invoke('fs:getFileStats', filePath),
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  
  // Menu events
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // AI Service
  ai: {
    setApiKey: (apiKey) => ipcRenderer.invoke('ai:setApiKey', apiKey),
    setConfig: (config) => ipcRenderer.invoke('ai:setConfig', config),
    chat: (messages, options) => ipcRenderer.invoke('ai:chat', { messages, options }),
    chatSimple: (systemMessage, userMessage, options) => 
      ipcRenderer.invoke('ai:chatSimple', { systemMessage, userMessage, options }),
    isConfigured: () => ipcRenderer.invoke('ai:isConfigured')
  }
});

console.log('Preload script loaded');
