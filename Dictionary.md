# Dictionary.md - 项目变量名与函数定义

本文档记录 OpenDev IDE 项目中所有的变量名、函数名、模块名及其含义。

---

## 主进程 (src/main/main.js)

### 全局变量

| 变量名 | 类型 | 含义 |
|--------|------|------|
| `app` | Electron App | Electron 应用实例 |
| `mainWindow` | BrowserWindow | 主窗口对象 |
| `aiService` | AIService | AI 服务实例 |
| `log` | electron-log | 日志记录器 |

### 函数

| 函数名 | 参数 | 返回值 | 含义 |
|--------|------|--------|------|
| `createWindow` | 无 | void | 创建主窗口，初始化菜单和加载渲染进程 |
| `readDirRecursive` | `dirPath, depth, maxDepth` | Array | 递归读取目录，返回目录树结构 |

### IPC 处理器

| 通道名 | 含义 |
|--------|------|
| `dialog:openFile` | 打开文件对话框 |
| `dialog:saveFile` | 保存文件对话框 |
| `dialog:openFolder` | 打开文件夹对话框 |
| `fs:readFile` | 读取文件内容 |
| `fs:writeFile` | 写入文件内容 |
| `fs:getFileStats` | 获取文件状态信息 |
| `fs:readDir` | 读取目录（单层） |
| `fs:readDirTree` | 读取目录树（递归） |
| `ai:setApiKey` | 设置AI API密钥 |
| `ai:setConfig` | 配置AI模型参数 |
| `ai:chat` | AI对话 |
| `ai:chatSimple` | 简单AI对话（系统消息+用户消息） |
| `ai:isConfigured` | 检查AI是否已配置 |

---

## 预加载脚本 (src/preload/preload.js)

### 暴露给渲染进程的 API

| API 名称 | 含义 |
|----------|------|
| `window.electronAPI.openFile()` | 打开文件 |
| `window.electronAPI.openFolder()` | 打开文件夹 |
| `window.electronAPI.saveFile(data)` | 保存文件 |
| `window.electronAPI.readFile(filePath)` | 读取文件 |
| `window.electronAPI.writeFile(data)` | 写入文件 |
| `window.electronAPI.getFileStats(filePath)` | 获取文件状态 |
| `window.electronAPI.readDir(dirPath)` | 读取目录 |
| `window.electronAPI.onMenuOpenFile(callback)` | 监听打开文件菜单事件 |
| `window.electronAPI.onMenuSaveFile(callback)` | 监听保存文件菜单事件 |
| `window.electronAPI.ai` | AI服务对象 |

---

## AI 服务 (src/main/ai-service.js)

| 变量/函数 | 类型 | 含义 |
|-----------|------|------|
| `AIService` | Class | AI服务类 |
| `apiKey` | String | OpenAI API 密钥 |
| `defaultModel` | String | 默认模型 (gpt-4) |
| `setApiKey(key)` | Method | 设置API密钥 |
| `setConfig(config)` | Method | 设置配置 |
| `chat(messages, options)` | Method | 发送对话消息 |
| `chatWithSystem(system, user, options)` | Method | 带系统消息的对话 |

---

## 渲染进程 (src/renderer/index.html)

### 全局变量

| 变量名 | 类型 | 含义 |
|--------|------|------|
| `currentFile` | String/null | 当前打开的文件路径 |
| `editor` | Monaco Editor | Monaco编辑器实例 |
| `monacoLoaded` | Boolean | Monaco编辑器是否已加载 |

### DOM 元素 ID

| ID 名称 | 含义 |
|---------|------|
| `btn-open` | 打开文件按钮 |
| `btn-save` | 保存文件按钮 |
| `btn-new` | 新建文件按钮 |
| `btn-welcome-open` | 欢迎页打开项目按钮 |
| `file-tree` | 文件树容器 |
| `welcome` | 欢迎页面 |
| `editor-container` | 编辑器容器 |
| `monaco-editor` | Monaco编辑器容器 |
| `status-file` | 状态栏-文件名 |
| `status-encoding` | 状态栏-编码 |
| `status-language` | 状态栏-语言 |

### 函数

| 函数名 | 含义 |
|--------|------|
| `initMonaco()` | 初始化Monaco编辑器 |
| `showEditor()` | 显示编辑器界面 |
| `updateStatus()` | 更新状态栏信息 |
| `getLanguage()` | 根据文件扩展名获取语言类型 |
| `openFile()` | 打开文件 |
| `saveFile()` | 保存文件 |
| `newFile()` | 新建文件 |

---

## 菜单栏

| 菜单名 | 含义 |
|--------|------|
| 文件 | 文件操作菜单（打开、保存、退出） |
| 编辑 | 编辑菜单（撤销、重做、剪切、复制、粘贴、全选） |
| 视图 | 视图菜单（刷新、开发工具、缩放、全屏） |
| 窗口 | 窗口菜单（最小化、关闭） |

---

*本文档由桥王维护，更新日期: 2026-03-23*
