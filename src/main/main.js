const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { AIServiceManager } = require('./ai-providers');

// 禁用 GPU 加速以避免缓存警告
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

// 初始化 AI 服务管理器（多模型支持）
const aiService = new AIServiceManager();

// Configure logging
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');
log.info('Application starting...');

// Global reference to main window
let mainWindow = null;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  app.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function createWindow() {
  log.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    title: 'OpenDev IDE',
    show: false
  });

  // Create application menu
  const menuTemplate = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu-open-file')
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save-file')
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Load the renderer
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('Main window displayed');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  log.info('App ready, creating window...');
  createWindow();
  initPlugins(); // 初始化插件系统

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for file system operations

// Open file dialog
ipcMain.handle('dialog:openFile', async () => {
  log.info('Opening file dialog...');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JavaScript', extensions: ['js', 'jsx', 'ts', 'tsx'] },
      { name: 'HTML', extensions: ['html', 'htm'] },
      { name: 'CSS', extensions: ['css', 'scss', 'less'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    log.info('File opened:', filePath);
    return { filePath, content };
  }
  return null;
});

// Save file
ipcMain.handle('dialog:saveFile', async (event, { filePath, content }) => {
  log.info('Saving file:', filePath);
  
  let savePath = filePath;
  
  if (!savePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'TypeScript', extensions: ['ts'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) return null;
    savePath = result.filePath;
  }

  fs.writeFileSync(savePath, content, 'utf-8');
  log.info('File saved:', savePath);
  return savePath;
});

// Read file
ipcMain.handle('fs:readFile', async (event, filePath) => {
  log.info('Reading file:', filePath);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    log.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

// Write file
ipcMain.handle('fs:writeFile', async (event, { filePath, content }) => {
  log.info('Writing file:', filePath);
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    log.error('Error writing file:', error);
    return { success: false, error: error.message };
  }
});

// Get file stats
ipcMain.handle('fs:getFileStats', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      success: true,
      stats: {
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        mtime: stats.mtime,
        ctime: stats.ctime
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Read directory (recursive)
ipcMain.handle('fs:readDir', async (event, dirPath) => {
  log.info('Reading directory:', dirPath);
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
      path: path.join(dirPath, entry.name)
    }));
    return { success: true, files };
  } catch (error) {
    log.error('Error reading directory:', error);
    return { success: false, error: error.message };
  }
});

// Read directory recursively
function readDirRecursive(dirPath, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const item = {
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        path: fullPath,
        children: []
      };
      
      if (entry.isDirectory() && depth < maxDepth) {
        // Skip node_modules and hidden folders
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          item.children = readDirRecursive(fullPath, depth + 1, maxDepth);
        }
      }
      
      result.push(item);
    }
    
    // Sort: directories first, then files, alphabetically
    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return result;
  } catch (error) {
    log.error('Error reading directory recursively:', error);
    return [];
  }
}

// Open folder dialog
ipcMain.handle('dialog:openFolder', async () => {
  log.info('Opening folder dialog...');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    log.info('Folder selected:', folderPath);
    
    // Read directory tree
    const tree = readDirRecursive(folderPath, 0, 3); // Max 3 levels deep
    return { folderPath, tree };
  }
  return null;
});

log.info('Main process initialized');

// ========== AI 服务 IPC 处理器（多模型支持）==========

// 设置 API Key
ipcMain.handle('ai:setApiKey', async (event, apiKey) => {
  log.info('设置 AI API Key...');
  aiService.setApiKey(apiKey);
  return { success: true };
});

// 设置 AI 提供商
ipcMain.handle('ai:setProvider', async (event, provider) => {
  log.info('设置 AI 提供商:', provider);
  return aiService.setProvider(provider);
});

// 设置 AI 模型
ipcMain.handle('ai:setModel', async (event, model) => {
  log.info('设置 AI 模型:', model);
  return aiService.setModel(model);
});

// 配置 AI 参数
ipcMain.handle('ai:setConfig', async (event, config) => {
  log.info('设置 AI 配置:', config);
  aiService.setConfig(config);
  return { success: true };
});

// 获取当前 AI 配置
ipcMain.handle('ai:getConfig', async () => {
  return aiService.getConfig();
});

// 获取可用提供商列表
ipcMain.handle('ai:getProviders', async () => {
  return aiService.getProviders();
});

// 获取可用模型列表
ipcMain.handle('ai:getModels', async (event, providerName) => {
  return aiService.getModels(providerName);
});

// 获取所有提供商的模型
ipcMain.handle('ai:getAllModels', async () => {
  return aiService.getAllModels();
});

// 获取 Ollama 本地模型列表
ipcMain.handle('ai:fetchOllamaModels', async () => {
  log.info('获取 Ollama 本地模型列表...');
  try {
    const models = await aiService.fetchOllamaModels();
    return { success: true, models };
  } catch (error) {
    log.error('获取 Ollama 模型失败:', error);
    return { success: false, error: error.message };
  }
});

// 发送对话请求
ipcMain.handle('ai:chat', async (event, { messages, options }) => {
  log.info('AI 对话请求...');
  try {
    const response = await aiService.chat(messages, options);
    log.info('AI 对话响应接收成功');
    return { success: true, response };
  } catch (error) {
    log.error('AI 对话错误:', error);
    return { success: false, error: error.message };
  }
});

// 简单对话（系统消息 + 用户消息）
ipcMain.handle('ai:chatSimple', async (event, { systemMessage, userMessage, options }) => {
  log.info('AI 简单对话请求...');
  try {
    const response = await aiService.chatWithSystem(systemMessage, userMessage, options);
    log.info('AI 简单对话响应接收成功');
    return { success: true, response };
  } catch (error) {
    log.error('AI 简单对话错误:', error);
    return { success: false, error: error.message };
  }
});

// 检查 API Key 是否已配置
ipcMain.handle('ai:isConfigured', async () => {
  return { configured: !!aiService.config.apiKey };
});

log.info('AI 多模型服务处理器已注册');

// ========== 文件操作 IPC 处理器 ==========

// 新建文件
ipcMain.handle('fs:createFile', async (event, { dirPath, fileName }) => {
  log.info('创建新文件:', dirPath, fileName);
  try {
    const filePath = path.join(dirPath, fileName);
    if (fs.existsSync(filePath)) {
      return { success: false, error: '文件已存在' };
    }
    fs.writeFileSync(filePath, '', 'utf-8');
    log.info('文件创建成功:', filePath);
    return { success: true, filePath };
  } catch (error) {
    log.error('创建文件错误:', error);
    return { success: false, error: error.message };
  }
});

// 新建文件夹
ipcMain.handle('fs:createFolder', async (event, { dirPath, folderName }) => {
  log.info('创建新文件夹:', dirPath, folderName);
  try {
    const folderPath = path.join(dirPath, folderName);
    if (fs.existsSync(folderPath)) {
      return { success: false, error: '文件夹已存在' };
    }
    fs.mkdirSync(folderPath, { recursive: true });
    log.info('文件夹创建成功:', folderPath);
    return { success: true, folderPath };
  } catch (error) {
    log.error('创建文件夹错误:', error);
    return { success: false, error: error.message };
  }
});

// 删除文件或文件夹
ipcMain.handle('fs:delete', async (event, { targetPath }) => {
  log.info('删除文件/文件夹:', targetPath);
  try {
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      fs.rmdirSync(targetPath, { recursive: true });
    } else {
      fs.unlinkSync(targetPath);
    }
    log.info('删除成功:', targetPath);
    return { success: true };
  } catch (error) {
    log.error('删除错误:', error);
    return { success: false, error: error.message };
  }
});

// 重命名文件或文件夹
ipcMain.handle('fs:rename', async (event, { oldPath, newName }) => {
  log.info('重命名:', oldPath, '->', newName);
  try {
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    if (fs.existsSync(newPath)) {
      return { success: false, error: '目标名称已存在' };
    }
    fs.renameSync(oldPath, newPath);
    log.info('重命名成功:', newPath);
    return { success: true, newPath };
  } catch (error) {
    log.error('重命名错误:', error);
    return { success: false, error: error.message };
  }
});

// 显示确认对话框（用于删除确认）
ipcMain.handle('dialog:confirm', async (event, { title, message, detail }) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['取消', '确定'],
    defaultId: 0,
    cancelId: 0,
    title: title || '确认',
    message: message || '确定要执行此操作吗？',
    detail: detail || ''
  });
  return { confirmed: result.response === 1 };
});

log.info('文件操作处理器已注册');

// ========== ���ϵͳ IPC ������ ==========
const { PluginManager } = require('./plugin-manager.js');

// ���������ʵ��
let pluginManager = null;

// ��ʼ�����ϵͳ
function initPlugins() {
  const userPluginsPath = path.join(app.getPath('userData'), 'plugins');
  const builtInPluginsPath = path.join(__dirname, '..', 'plugins');
  
  pluginManager = new PluginManager({
    pluginPaths: [builtInPluginsPath, userPluginsPath],
    autoActivate: false
  });
  
  log.info('���ϵͳ��ʼ��...');
  log.info('���ò��Ŀ¼:', builtInPluginsPath);
  log.info('�û����Ŀ¼:', userPluginsPath);
}

// ��� IPC ������
ipcMain.handle('plugins:getList', async () => {
  try {
    if (!pluginManager) {
      initPlugins();
      await pluginManager.initialize();
    }
    const plugins = pluginManager.getPlugins();
    return { success: true, plugins };
  } catch (error) {
    log.error('��ȡ����б�ʧ��:', error);
    return { success: false, error: error.message, plugins: [] };
  }
});

ipcMain.handle('plugins:activate', async (event, pluginId) => {
  try {
    if (!pluginManager) {
      return { success: false, error: '���ϵͳδ��ʼ��' };
    }
    await pluginManager.activatePlugin(pluginId);
    return { success: true };
  } catch (error) {
    log.error('������ʧ��:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('plugins:deactivate', async (event, pluginId) => {
  try {
    if (!pluginManager) {
      return { success: false, error: '���ϵͳδ��ʼ��' };
    }
    await pluginManager.deactivatePlugin(pluginId);
    return { success: true };
  } catch (error) {
    log.error('ͣ�ò��ʧ��:', error);
    return { success: false, error: error.message };
  }
});

log.info('���ϵͳ��������ע��');

// ========== ����г����� IPC ==========
const { OpenVSXClient, PluginInstaller } = require('./openvsx-client.js');

// OpenVSX �ͻ���ʵ��
let openvsxClient = null;
let pluginInstaller = null;

// ��ȡ OpenVSX �ͻ���
function getOpenVSXClient() {
  if (!openvsxClient) {
    openvsxClient = new OpenVSXClient();
  }
  return openvsxClient;
}

// ��ȡ�����װ��
function getPluginInstaller() {
  if (!pluginInstaller) {
    const client = getOpenVSXClient();
    const userPluginsPath = path.join(app.getPath('userData'), 'plugins');
    pluginInstaller = new PluginInstaller(client, userPluginsPath);
  }
  return pluginInstaller;
}

// �������
ipcMain.handle('plugins:search', async (event, { query, page = 1 }) => {
  try {
    log.info('�������:', query, 'ҳ:', page);
    const client = getOpenVSXClient();
    const result = await client.searchExtensions(query, page, 20);
    return { success: true, ...result };
  } catch (error) {
    log.error('�������ʧ��:', error);
    return { success: false, error: error.message, extensions: [], count: 0 };
  }
});

// ��װ���
ipcMain.handle('plugins:install', async (event, { namespace, name, version }) => {
  try {
    log.info('��װ���:', namespace, name, version);
    const installer = getPluginInstaller();
    await installer.install(namespace, name, version);
    return { success: true };
  } catch (error) {
    log.error('��װ���ʧ��:', error);
    return { success: false, error: error.message };
  }
});

log.info('����г�������������ע��');

// ж�ز��
ipcMain.handle('plugins:uninstall', async (event, pluginId) => {
  try {
    log.info('ж�ز��:', pluginId);
    if (!pluginManager) {
      return { success: false, error: '���ϵͳδ��ʼ��' };
    }
    // ͣ�ò��
    await pluginManager.deactivatePlugin(pluginId);
    // TODO: ɾ�����Ŀ¼
    return { success: true };
  } catch (error) {
    log.error('ж�ز��ʧ��:', error);
    return { success: false, error: error.message };
  }
});
