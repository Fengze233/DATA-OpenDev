# Dictionary.md - 变量名与含义

本文件记录 OpenDev 项目中使用的所有变量名及其含义。

---

## 主进程变量 (src/main/main.js)

| 变量名 | 类型 | 含义 |
|--------|------|------|
| `app` | Object | Electron 应用实例 |
| `BrowserWindow` | Class | Electron 窗口类 |
| `ipcMain` | Object | 主进程 IPC 通信模块 |
| `dialog` | Object | Electron 对话框模块 |
| `Menu` | Object | Electron 菜单模块 |
| `path` | Module | Node.js 路径处理模块 |
| `fs` | Module | Node.js 文件系统模块 |
| `log` | Object | electron-log 日志实例 |
| `aiService` | Object | AI 服务实例 |
| `mainWindow` | Object | 主窗口实例 |
| `menuTemplate` | Array | 应用程序菜单模板 |

### GPU 禁用参数

| 参数 | 作用 |
|------|------|
| `disableHardwareAcceleration` | 禁用硬件加速 |
| `disable-gpu` | 禁用 GPU 渲染 |
| `disable-software-rasterizer` | 禁用软件光栅化 |
| `disable-gpu-compositing` | 禁用 GPU 合成 |
| `disable-gpu-rasterization` | 禁用 GPU 光栅化 |
| `disable-gpu-sandbox` | 禁用 GPU 沙箱 |
| `no-sandbox` | 禁用沙箱 |
| `disable-dev-shm-usage` | 禁用 /dev/shm 使用 |
| `result` | Object | 对话框返回结果 |
| `filePath` | String | 文件路径 |
| `content` | String | 文件内容 |
| `savePath` | String | 保存文件路径 |
| `stats` | Object | 文件统计信息 |
| `entries` | Array | 目录条目列表 |
| `files` | Array | 文件列表 |
| `folderPath` | String | 文件夹路径 |
| `tree` | Array | 目录树结构 |

---

## AI 服务变量 (src/main/ai-service.js)

| 变量名 | 类型 | 含义 |
|--------|------|------|
| `https` | Module | Node.js HTTPS 模块 |
| `DEFAULT_CONFIG` | Object | 默认 AI 配置 |
| `model` | String | AI 模型名称 |
| `temperature` | Number | 生成随机性参数 |
| `maxTokens` | Number | 最大令牌数 |
| `AIService` | Class | AI 服务类 |
| `apiKey` | String | OpenAI API 密钥 |
| `baseUrl` | String | API 请求基础 URL |
| `config` | Object | 当前 AI 配置 |
| `requestBody` | Object | API 请求体 |
| `messages` | Array | 对话消息数组 |
| `options` | Object | 请求选项 |
| `req` | Object | HTTPS 请求对象 |
| `res` | Object | HTTPS 响应对象 |
| `data` | String | 响应数据 |
| `parsed` | Object | 解析后的 JSON |
| `response` | Object | AI 响应结果 |
| `reader` | Object | 流式读取器 |
| `buffer` | String | 数据缓冲区 |

---

## AI 多模型支持 (src/main/ai-providers.js)

### 提供商类

| 类名 | 含义 |
|------|------|
| `OpenAIProvider` | OpenAI API 提供商 |
| `AnthropicProvider` | Anthropic Claude 提供商 |
| `OllamaProvider` | Ollama 本地模型提供商 |
| `AIServiceManager` | AI 服务管理器 |

### 提供商变量

| 变量名 | 类型 | 含义 |
|--------|------|------|
| `providers` | Object | AI 提供商对象集合 |
| `provider` | String | 当前使用的提供商名称 |
| `OpenAIProvider` | Class | OpenAI 提供商类 |
| `AnthropicProvider` | Class | Claude 提供商类 |
| `OllamaProvider` | Class | Ollama 提供商类 |
| `availableModels` | Object | 各提供商的可用模型列表 |
| `http` | Module | Node.js HTTP 模块 |
| `URL` | Module | Node.js URL 解析模块 |
| `host` | String | Ollama 主机地址 |
| `port` | Number | Ollama 端口号 |

---

## 预加载脚本变量 (src/preload/preload.js)

| 变量名 | 类型 | 含义 |
|--------|------|------|
| `contextBridge` | Module | 上下文桥接模块 |
| `ipcRenderer` | Module | 渲染进程 IPC 模块 |
| `electronAPI` | Object | 暴露给渲染进程的 API |

---

## 渲染进程变量 (src/renderer/index.html)

| 变量名 | 类型 | 含义 |
|--------|------|------|
| `currentFile` | String/null | 当前打开的文件路径 |
| `currentFolder` | String/null | 当前打开的文件夹路径 |
| `editor` | Object | Monaco Editor 实例 |
| `monacoLoaded` | Boolean | Monaco 是否已加载 |
| `openFiles` | Array | 已打开文件列表 |
| `activeFileIndex` | Number | 当前活动标签索引 |
| `btnOpen` | Element | 打开文件按钮 |
| `btnOpenFolder` | Element | 打开文件夹按钮 |
| `btnSave` | Element | 保存文件按钮 |
| `btnNew` | Element | 新建文件按钮 |
| `welcome` | Element | 欢迎界面 |
| `editorContainer` | Element | 编辑器容器 |
| `editorTabs` | Element | 标签栏容器 |
| `statusFile` | Element | 文件状态显示 |
| `statusLanguage` | Element | 语言状态显示 |
| `fileTree` | Element | 文件树显示 |
| `aiPanel` | Element | AI 面板 |
| `aiMessages` | Element | AI 消息容器 |
| `aiInput` | Element | AI 输入框 |
| `aiSend` | Element | AI 发送按钮 |
| `aiModal` | Element | AI 配置弹窗 |
| `apiKeyInput` | Element | API Key 输入框 |
| `statusAI` | Element | AI 状态显示 |
| `aiConfigured` | Boolean | AI 是否已配置 |
| `aiConversation` | Array | AI 对话历史 |
| `aiProviderSelect` | Element | AI 提供商选择下拉框 |
| `aiModelSelect` | Element | AI 模型选择下拉框 |
| `ollamaHint` | Element | Ollama 连接提示 |
| `currentProvider` | String | 当前 AI 提供商 |
| `currentModel` | String | 当前 AI 模型 |

### 国际化 (i18n) 变量

| 变量名 | 类型 | 含义 |
|--------|------|------|
| `translations` | Object | 多语言翻译对象 |
| `currentLang` | String | 当前语言代码 |
| `langSelect` | Element | 语言选择下拉框 |

### 标签管理变量

| 变量名 | 类型 | 含义 |
|--------|------|------|
| `tabContextMenu` | Element | 标签右键菜单 |
| `contextMenuTabIndex` | Number | 右键菜单对应的标签索引 |

---

## HTML 元素 ID

| ID | 含义 |
|----|------|
| `app` | 应用根容器 |
| `btn-open-folder` | 打开文件夹按钮 |
| `btn-open` | 打开文件按钮 |
| `btn-save` | 保存文件按钮 |
| `btn-new` | 新建文件按钮 |
| `btn-welcome-open` | 欢迎页打开按钮 |
| `btn-ai` | AI 助手按钮 |
| `welcome` | 欢迎界面 |
| `editor-area` | 编辑器区域 |
| `editor-tabs` | 标签栏 |
| `editor-container` | 编辑器容器 |
| `monaco-editor` | Monaco 编辑器 DOM |
| `file-tree` | 文件树 |
| `tab-context-menu` | 标签右键菜单 |
| `language-selector` | 语言选择器 |
| `lang-select` | 语言选择下拉框 |
| `status-file` | 当前文件状态 |
| `status-encoding` | 编码状态 |
| `status-language` | 语言状态 |
| `status-ai` | AI 状态 |
| `ai-panel` | AI 对话面板 |
| `ai-messages` | AI 消息列表 |
| `ai-input` | AI 输入框 |
| `ai-close` | AI 面板关闭按钮 |
| `ai-config-modal` | API 配置弹窗 |
| `api-key-input` | API Key 输入框 |
| `ai-provider-select` | AI 提供商选择 |
| `ai-model-select` | AI 模型选择 |
| `ollama-hint` | Ollama 连接提示 |

---

## CSS 变量 (index.html)

| 变量名 | 含义 |
|--------|------|
| `--bg-primary` | 主背景色 (#1e1e1e) |
| `--bg-secondary` | 次级背景色 (#252526) |
| `--bg-tertiary` | 三级背景色 (#2d2d30) |
| `--text-primary` | 主文字色 (#cccccc) |
| `--text-secondary` | 次级文字色 (#858585) |
| `--accent` | 强调色 (#0e639c) |
| `--accent-hover` | 强调色悬停 (#1177bb) |
| `--border` | 边框色 (#3c3c3c) |

---

## IPC 处理器通道

### 文件对话框

| 通道名 | 含义 |
|--------|------|
| `dialog:openFile` | 打开文件对话框 |
| `dialog:saveFile` | 保存文件对话框 |
| `dialog:openFolder` | 打开文件夹对话框 |
| `dialog:confirm` | 确认对话框 |

### 文件系统操作

| 通道名 | 含义 |
|--------|------|
| `fs:readFile` | 读取文件内容 |
| `fs:writeFile` | 写入文件内容 |
| `fs:getFileStats` | 获取文件状态信息 |
| `fs:readDir` | 读取目录（单层） |
| `fs:createFile` | 新建文件 |
| `fs:createFolder` | 新建文件夹 |
| `fs:delete` | 删除文件或文件夹 |
| `fs:rename` | 重命名文件或文件夹 |

### AI 服务

| 通道名 | 含义 |
|--------|------|
| `ai:setApiKey` | 设置 AI API Key |
| `ai:setProvider` | 设置 AI 提供商 |
| `ai:setModel` | 设置 AI 模型 |
| `ai:setConfig` | 配置 AI 参数 |
| `ai:getConfig` | 获取当前 AI 配置 |
| `ai:getProviders` | 获取可用提供商列表 |
| `ai:getModels` | 获取可用模型列表 |
| `ai:getAllModels` | 获取所有提供商的模型 |
| `ai:fetchOllamaModels` | 获取 Ollama 本地模型 |
| `ai:chat` | AI 对话 |
| `ai:chatSimple` | 简单 AI 对话 |
| `ai:isConfigured` | 检查 AI 是否已配置 |

---

## 多语言模块 (src/renderer/i18n.js)

### 类

| 类名 | 含义 |
|------|------|
| `I18n` | 国际化类 |

### I18n 属性

| 属性名 | 类型 | 含义 |
|--------|------|------|
| `currentLang` | String | 当前语言代码 (en/zh-CN/zh-TW) |
| `translations` | Object | 语言资源对象 |

### I18n 方法

| 方法名 | 参数 | 返回值 | 含义 |
|--------|------|--------|------|
| `detectLanguage` | 无 | void | 检测浏览器语言 |
| `setLanguage` | `lang` | void | 设置语言 |
| `getLanguage` | 无 | String | 获取当前语言 |
| `t` | `key` | String | 获取翻译文本 |
| `getAvailableLanguages` | 无 | Array | 获取可用语言列表 |

### 支持语言

| 语言代码 | 语言名称 |
|----------|----------|
| `en` | 英语 (English) |
| `zh-CN` | 简体中文 |
| `zh-TW` | 繁体中文 |

---

## 文件操作流程

### 打开文件夹流程
1. 用户点击"打开文件夹"按钮
2. 触发 `dialog:openFolder` IPC 调用
3. 主进程显示文件夹选择对话框
4. 选择后调用 `readDirRecursive` 递归读取目录树
5. 返回文件夹路径和目录树结构给渲染进程
6. 渲染进程渲染文件树 UI

### 新建文件流程
1. 用户点击"新建文件"按钮或 Ctrl+N
2. 弹出输入对话框让用户输入文件名
3. 触发 `fs:createFile` IPC 调用
4. 主进程创建空文件
5. 返回结果，刷新文件树

### 删除流程
1. 用户选择文件/文件夹并点击删除
2. 触发 `dialog:confirm` 显示确认对话框
3. 用户确认后调用 `fs:delete` IPC
4. 主进程删除文件或递归删除文件夹
5. 刷新文件树

---

*最后更新: 2026-03-23*
