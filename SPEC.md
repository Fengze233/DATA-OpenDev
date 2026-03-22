# OpenDev IDE - 技术规格文档

## 项目概述

**项目名称：** OpenDev IDE  
**版本：** 1.0.0  
**类型：** 桌面端 AI 全栈自动开发 IDE  
**技术栈：** Electron + Monaco Editor + React + TypeScript  
**编码：** UTF-8

---

## 阶段规划

### Phase 1: MVP (最小可行产品) ✅ 已完成

### Phase 2: VSCode 插件兼容层 ✅ 已完成

#### 2.1 插件加载框架 (桥王 主导) ✅ 已完成
- [x] 2.1.1 插件目录结构定义 - plugin-manager.js
- [x] 2.1.2 package.json 解析器
- [x] 2.1.3 插件注册机制
- [x] 2.1.4 插件设置 UI

#### 2.2 VSCode API 兼容层 (调度 主导) ✅ 已完成
- [x] 2.2.1 Extension Host 骨架 - vscode-api.js
- [x] 2.2.2 workspace API - vscode-workspace.js
- [x] 2.2.3 window API - vscode-window.js
- [x] 2.2.4 commands API - vscode-commands.js
- [x] 2.2.5 languages API - vscode-languages.js

#### 2.3 插件市场 (桥王 主导) ✅ 已完成
- [x] 2.3.1 OpenVSX API 对接 - openvsx-client.js
- [x] 2.3.2 插件搜索 UI
- [x] 2.3.3 插件安装/卸载

#### 2.5 增强功能 (规划中)
- [ ] 2.5.1 插件状态持久化
- [ ] 2.5.2 插件配置存储
- [ ] 2.5.3 插件依赖解析

---

## 功能范围

### 1. 编辑器核心
- Monaco Editor 集成
- 基础代码编辑（语法高亮、自动补全）
- 多文件标签管理
- 文件树浏览器

### 2. 基础 AI 能力
- **多模型支持：**
  - OpenAI (GPT-4/GPT-3.5)
  - Anthropic Claude
  - Ollama (本地模型)
  - Minimax (国际版/CN版) ⚠️ 待测试
  - 智谱GLM (glm-4) ⚠️ 待测试
  - 阿里通义 (Qwen系列) ⚠️ 待测试
  - 讯飞星火 (WebSocket) ⚠️ 待实现
  - 百度文心 (ERNIE系列) ⚠️ 待测试
- 基础的代码补全/生成
- 对话式 AI 助手面板

### 3. 多语言支持
| 语言 | 代码 | 状态 |
|------|------|------|
| 英语 | en | ✅ |
| 简体中文 | zh-CN | ✅ |
| 繁体中文 | zh-TW | ✅ |

### 4. 文件操作
- 打开/保存文件
- 新建文件/文件夹
- 打开项目文件夹
- 文件树导航

### 5. 窗口管理
- 最小化/最大化/关闭
- 菜单栏（文件/编辑/视图/窗口）
- 快捷键支持

---

## 技术架构

```
┌─────────────────────────────────────────┐
│           UI 层                         │
│  - 编辑器面板 (Monaco Editor)           │
│  - AI 对话面板                          │
│  - 文件树浏览器                         │
│  - 多语言支持 (i18n.js)                 │
├─────────────────────────────────────────┤
│         核心引擎层                      │
│  - Monaco Editor 包装器                 │
│  - AI Service (ai-providers.js)        │
│    - OpenAI Provider                    │
│    - Anthropic Provider                │
│    - Ollama Provider                    │
├─────────────────────────────────────────┤
│         Electron 层                     │
│  - 窗口管理 (main.js)                   │
│  - 文件系统访问                         │
│  - IPC 通信                             │
└─────────────────────────────────────────┘
```

---

## 项目结构

```
OpenDev/
├── src/
│   ├── main/              # 主进程
│   │   ├── main.js        # Electron 主入口
│   │   ├── preload.js     # 预加载脚本
│   │   ├── ai-service.js  # AI 服务封装
│   │   └── ai-providers.js # 多模型支持
│   ├── preload/           # 预加载脚本
│   │   └── preload.js
│   └── renderer/          # 渲染进程
│       ├── index.html     # 主页面
│       └── i18n.js        # 多语言模块
├── package.json
├── SPEC.md
├── Dictionary.md
├── REVIEW.md
└── README.md
```

---

## 验收标准

### Phase 1 MVP

- [x] Monaco Editor 正常加载，可编辑代码
- [x] 可创建/打开/保存文件
- [x] AI 对话面板可发送消息并接收回复
- [x] 多语言支持（英/简中/繁中）
- [x] 应用可打包为可执行文件
- [x] UTF-8 编码规范
- [x] 中文注释规范

---

## 团队成员

| 角色 | 名称 | 说明 |
|------|------|------|
| 架构师 | 老周 | 技术架构设计 |
| IDE 工程师 | 小锤 | 核心功能开发 |
| AI 编排工程师 | 调度 | AI 能力集成 |
| VSCode 适配专家 | 桥王 | 插件兼容层 |
| 代码审查工程师 | 净镜 | 代码质量把控 |

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-03-23 | 1.0.0 | Phase 1 MVP 完成，多语言支持 |
| 2026-03-23 | 1.1.0 | **Phase 2.2 VSCode API 兼容层** - 添加10+ VSCode核心API支持 |
| 2026-03-23 | 1.1.0 | AI Provider扩展: 添加Minimax/智谱/通义/讯飞/文心支持 |

---

**文档状态：** 已验收  
**最后更新：** 2026-03-23
