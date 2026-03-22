const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { AIService } = require('./ai-service');

// Initialize AI Service
const aiService = new AIService();

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

// AI Service IPC Handlers

// Set API Key
ipcMain.handle('ai:setApiKey', async (event, apiKey) => {
  log.info('Setting AI API key...');
  aiService.setApiKey(apiKey);
  return { success: true };
});

// Configure AI Model
ipcMain.handle('ai:setConfig', async (event, config) => {
  log.info('Setting AI config:', config);
  aiService.setConfig(config);
  return { success: true };
});

// Chat with AI
ipcMain.handle('ai:chat', async (event, { messages, options }) => {
  log.info('AI chat request...');
  try {
    const response = await aiService.chat(messages, options);
    log.info('AI chat response received');
    return { success: true, response };
  } catch (error) {
    log.error('AI chat error:', error);
    return { success: false, error: error.message };
  }
});

// Simple chat with system + user message
ipcMain.handle('ai:chatSimple', async (event, { systemMessage, userMessage, options }) => {
  log.info('AI simple chat request...');
  try {
    const response = await aiService.chatWithSystem(systemMessage, userMessage, options);
    log.info('AI simple chat response received');
    return { success: true, response };
  } catch (error) {
    log.error('AI simple chat error:', error);
    return { success: false, error: error.message };
  }
});

// Check if API key is configured
ipcMain.handle('ai:isConfigured', async () => {
  return { configured: !!aiService.apiKey };
});

log.info('AI Service handlers registered');
