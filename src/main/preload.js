const { contextBridge, ipcRenderer } = require('electron');

// 统一使用 electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', { filePath, content }),
  getFileStats: (filePath) => ipcRenderer.invoke('fs:getFileStats', filePath),
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  createFile: (dirPath, fileName) => ipcRenderer.invoke('fs:createFile', { dirPath, fileName }),
  createFolder: (dirPath, folderName) => ipcRenderer.invoke('fs:createFolder', { dirPath, folderName }),
  delete: (targetPath) => ipcRenderer.invoke('fs:delete', targetPath),
  rename: (oldPath, newName) => ipcRenderer.invoke('fs:rename', { oldPath, newName }),
  confirm: (title, message, detail) => ipcRenderer.invoke('dialog:confirm', { title, message, detail }),
  
  // 终端系统
  terminal: {
    create: (shell, cwd) => ipcRenderer.invoke('terminal:create', { shell, cwd }),
    write: (id, data) => ipcRenderer.invoke('terminal:write', { id, data }),
    resize: (id, cols, rows) => ipcRenderer.invoke('terminal:resize', { id, cols, rows }),
    close: (id) => ipcRenderer.invoke('terminal:close', id),
    list: () => ipcRenderer.invoke('terminal:list'),
    onData: (id, callback) => {
      ipcRenderer.on(`terminal:data:${id}`, (event, data) => callback(data));
    },
    onExit: (id, callback) => {
      ipcRenderer.on(`terminal:exit:${id}`, (event, exitCode, signal) => callback(exitCode, signal));
    }
  },

  // AI 服务
  ai: {
    setApiKey: (apiKey) => ipcRenderer.invoke('ai:setApiKey', apiKey),
    setConfig: (config) => ipcRenderer.invoke('ai:setConfig', config),
    chat: (messages, options) => ipcRenderer.invoke('ai:chat', { messages, options }),
    chatSimple: (systemMessage, userMessage, options) => ipcRenderer.invoke('ai:chatSimple', { systemMessage, userMessage, options }),
    isConfigured: () => ipcRenderer.invoke('ai:isConfigured'),
    getModels: (provider) => ipcRenderer.invoke('ai:getModels', provider),
    fetchOllamaModels: () => ipcRenderer.invoke('ai:fetchOllamaModels'),
    
    // AI 代码增强
    configure: (config) => ipcRenderer.invoke('ai:configure', config),
    completion: (code, language, cursorPosition) => 
      ipcRenderer.invoke('ai:completion', { code, language, cursorPosition }),
    explain: (code, language) => 
      ipcRenderer.invoke('ai:explain', { code, language }),
    refactor: (code, language, goal) => 
      ipcRenderer.invoke('ai:refactor', { code, language, goal }),
    generate: (description, language, context) => 
      ipcRenderer.invoke('ai:generate', { description, language, context }),
    fixBug: (code, language, errorMessage) => 
      ipcRenderer.invoke('ai:fixBug', { code, language, errorMessage }),
    optimize: (code, language) => 
      ipcRenderer.invoke('ai:optimize', { code, language }),
    generateTests: (code, language, framework) => 
      ipcRenderer.invoke('ai:generateTests', { code, language, framework }),
    translate: (code, fromLang, toLang) => 
      ipcRenderer.invoke('ai:translate', { code, fromLang, toLang })
  },

  // 插件系统
  plugins: {
    getList: () => ipcRenderer.invoke('plugins:getList'),
    activate: (pluginId) => ipcRenderer.invoke('plugins:activate', pluginId),
    deactivate: (pluginId) => ipcRenderer.invoke('plugins:deactivate', pluginId),
    uninstall: (pluginId) => ipcRenderer.invoke('plugins:uninstall', pluginId),
    search: (query, page) => ipcRenderer.invoke('plugins:search', { query, page }),
    install: (namespace, name, version) => ipcRenderer.invoke('plugins:install', { namespace, name, version }),
    getState: (pluginId) => ipcRenderer.invoke('plugins:getState', pluginId),
    setState: (pluginId, state) => ipcRenderer.invoke('plugins:setState', { pluginId, state }),
    getConfig: (pluginId) => ipcRenderer.invoke('plugins:getConfig', pluginId),
    setConfig: (pluginId, config) => ipcRenderer.invoke('plugins:setConfig', { pluginId, config }),
    checkUpdates: () => ipcRenderer.invoke('plugins:checkUpdates')
  },

  // Git 版本控制
  git: {
    setRepo: (repoPath) => ipcRenderer.invoke('git:setRepo', repoPath),
    status: () => ipcRenderer.invoke('git:status'),
    branches: () => ipcRenderer.invoke('git:branches'),
    log: (maxCount) => ipcRenderer.invoke('git:log', maxCount),
    diff: (filePath) => ipcRenderer.invoke('git:diff', filePath),
    add: (filePath) => ipcRenderer.invoke('git:add', filePath),
    commit: (message) => ipcRenderer.invoke('git:commit', message),
    checkout: (branchName) => ipcRenderer.invoke('git:checkout', branchName),
    createBranch: (branchName) => ipcRenderer.invoke('git:createBranch', branchName),
    pull: () => ipcRenderer.invoke('git:pull'),
    push: () => ipcRenderer.invoke('git:push'),
    remotes: () => ipcRenderer.invoke('git:remotes')
  },

  // 项目模板
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    get: (templateId) => ipcRenderer.invoke('templates:get', templateId),
    categories: () => ipcRenderer.invoke('templates:categories'),
    create: (templateId, projectName, targetDir) => 
      ipcRenderer.invoke('templates:create', { templateId, projectName, targetDir }),
    installDeps: (projectPath) => ipcRenderer.invoke('templates:installDeps', projectPath)
  },

  // 调试系统
  debug: {
    start: (config) => ipcRenderer.invoke('debug:start', config),
    stop: (sessionId) => ipcRenderer.invoke('debug:stop', sessionId),
    continue: (sessionId) => ipcRenderer.invoke('debug:continue', sessionId),
    pause: (sessionId) => ipcRenderer.invoke('debug:pause', sessionId),
    stepIn: (sessionId) => ipcRenderer.invoke('debug:stepIn', sessionId),
    stepOver: (sessionId) => ipcRenderer.invoke('debug:stepOver', sessionId),
    stepOut: (sessionId) => ipcRenderer.invoke('debug:stepOut', sessionId),
    setBreakpoint: (sessionId, file, line) => ipcRenderer.invoke('debug:setBreakpoint', { sessionId, file, line }),
    deleteBreakpoint: (sessionId, file, line) => ipcRenderer.invoke('debug:deleteBreakpoint', { sessionId, file, line }),
    getBreakpoints: (sessionId) => ipcRenderer.invoke('debug:getBreakpoints', sessionId),
    getStack: (sessionId) => ipcRenderer.invoke('debug:getStack', sessionId),
    getVariables: (sessionId, scope) => ipcRenderer.invoke('debug:getVariables', { sessionId, scope }),
    evaluate: (sessionId, expr) => ipcRenderer.invoke('debug:evaluate', { sessionId, expr }),
    listSessions: () => ipcRenderer.invoke('debug:listSessions')
  },

  // 菜单事件
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback)
});

// 兼容旧名称
contextBridge.exposeInMainWorld('opendev', window.electronAPI);
