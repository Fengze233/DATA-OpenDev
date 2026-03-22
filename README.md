# OpenDev IDE

> AI全栈自动开发IDE - 运行于OpenClaw的AI软件开发团队

## 项目定位

- **目标用户**：个人开发者
- **部署方式**：桌面端（Electron）
- **AI模型**：多模型支持（OpenAI/Claude/Ollama）
- **收费模式**：一次性购买 $99

## 技术架构

```
用户界面层 → 核心引擎层 → 适配层 → 智能体层
```

### 核心技术选型

- 编辑器：Monaco Editor
- 前端：React + TypeScript
- 桌面壳：Electron
- AI：OpenAI API / Claude API / Ollama
- 规范驱动：spec-kit（GitHub 官方 PRD/Spec 工具）

## 团队成员（5人）

| 角色 | 名字 | 职责 |
|------|------|------|
| 架构师 | 老周(周明远) | 系统设计、技术选型 |
| IDE工程师 | 小锤(锤二毛) | Monaco Editor、UI |
| 适配专家 | 桥王(王思柯) | VSCode插件兼容层 + 核心功能开发 |
| AI编排 | 调度(调小度) | 多模型调度 |
| 审查工程师 | 净镜(镜无尘) | 代码Review |

## 开发阶段

- Phase 1 (4周): MVP - 编辑器 + 基础AI
- Phase 2 (6周): 插件兼容层
- Phase 3 (6周): 高级功能
- Beta (4周): 测试优化

**预计总工期**: ~20周
