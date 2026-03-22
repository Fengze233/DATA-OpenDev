const { contextBridge, ipcRenderer } = require('electron');

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', { filePath, content }),
  getFileStats: (filePath) => ipcRenderer.invoke('fs:getFileStats', filePath),
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  
  // 对话框
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (filePath, content) => ipcRenderer.invoke('dialog:saveFile', { filePath, content }),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  
  // AI 服务
  ai: {
    setApiKey: (apiKey) => ipcRenderer.invoke('ai:setApiKey', apiKey),
    setConfig: (config) => ipcRenderer.invoke('ai:setConfig', config),
    chat: (messages, options) => ipcRenderer.invoke('ai:chat', { messages, options }),
    chatSimple: (systemMessage, userMessage, options) => ipcRenderer.invoke('ai:chatSimple', { systemMessage, userMessage, options }),
    isConfigured: () => ipcRenderer.invoke('ai:isConfigured')
  },
  
  // 菜单事件监听
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback)
});
