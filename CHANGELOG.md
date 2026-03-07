# Changelog - GitHub Trending Notifier

所有显著的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2025-03-08

### ✨ 新增功能

- 初始版本发布
- 实现 GitHub Trending 自动发现（过去24小时，stars > 100）
- 集成 OpenRouter AI 生成项目亮点摘要
- 支持多平台通知：Telegram / Feishu / Discord
- 集成 OpenClaw Cron 定时任务
- 完整的 Markdown 文档体系

### 🛠️ 技术特性

- Node.js 原生实现，ES Modules
- 轻量级设计，< 50MB 内存
- 错误降级机制（OpenRouter 失败时显示备用文本）
- 支持环境变量配置
- 内置速率限制友好设计

### 📖 文档

- **README.md** - 完整用户手册（18KB）
  - 快速安装指南
  - 详细配置说明
  - 基础与高级用法
  - 多渠道配置教程
- **API.md** - API 参考文档（19KB）
  - 命令行接口说明
  - GitHub API 集成细节
  - OpenRouter API 完整参数
  - 数据模型定义
- **TROUBLESHOOTING.md** - 故障排除指南（22KB）
  - 快速诊断流程图
  - 详细问题排查步骤
  - 调试技巧与工具
  - FAQ 常见问题
- **CONTRIBUTING.md** - 贡献指南（8.5KB）
  - 开发环境搭建
  - 代码规范
  - Pull Request 流程
  - Issue 报告模板
- **.env.example** - 环境变量配置模板

### 🔧 配置选项

| 变量名 | 类型 | 默认值 | 必需 | 说明 |
|--------|------|--------|------|------|
| GITHUB_TOKEN | String | - | ✅ | GitHub PAT |
| OPENROUTER_API_KEY | String | - | ✅ | OpenRouter Key |
| NOTIFY_CHANNEL | String | `telegram` | ✅ | 通知渠道 |
| NOTIFY_TARGET | String | - | ✅ | 目标标识 |
| MAX_REPOS | Number | `5` | ❌ | 最大仓库数 |
| OPENROUTER_MODEL | String | `gpt-4o-mini` | ❌ | AI 模型 |

### 🎯 支持的 OpenRouter 模型

- `openai/gpt-4o-mini` （默认，推荐）
- `openai/gpt-4o`
- `anthropic/claude-3.5-sonnet`
- `google/gemini-2.0-flash-001`
- `meta-llama/llama-3.3-70b-instruct`

### 🐛 已知问题

#### 1. MAX_REPOS 硬编码（已修复 🎉）

**影响版本：** < 1.0.0-rc1  
**修复版本：** 1.0.0  
**描述：** 早期版本 maxRepos 硬编码为 5，不读取环境变量。  
**解决方案：** v1.0.0 已修复，现在支持 `MAX_REPOS` 环境变量。

#### 2. 无自动重试机制

**影响版本：** 1.0.0  
**状态：** 已知，未来版本考虑添加  
**描述：** 网络错误或 API 限流时不会自动重试。  
**临时方案：** 手动重新运行脚本或使用 cron 重试。

### 📈 性能指标

- **执行时间**：15-30 秒（取决于 AI 模型）
- **内存占用**：30-50 MB
- **API 调用**：1 次 GitHub + N 次 OpenRouter（N = MAX_REPOS）
- **月度成本**：使用 `gpt-4o-mini` 约 $0.72（5 仓库/小时，24/7）

### 🔐 安全措施

- 无需 GitHub `repo` 权限，仅 `public_repo`
- 所有密钥通过环境变量注入，不硬编码
- 日志自动脱敏（Token 不会直接打印）
- `.env` 在 `.gitignore` 中

### 📚 系统要求

- Node.js 18+（支持 ES Modules）
- OpenClaw 平台（可选，用于定时任务和消息）
- 有效的 GitHub Personal Access Token
- 有效的 OpenRouter API Key（有可用余额）

---

## [Pre-release] - 2025-03-06

### 初始开发

- 基础功能实现
- 内部测试
- 文档草稿编写

---

## 未来计划（Roadmap）

| 版本 | 计划功能 | 状态 |
|------|----------|------|
| 1.1.0 | 添加自动重试（指数退避） | 📋 计划中 |
| 1.2.0 | 支持多语言摘要（根据仓库语言） | 📋 计划中 |
| 1.3.0 | 集成数据库存储历史记录 | 📋 计划中 |
| 1.4.0 | 添加 RSS/Atom 输出支持 | 📋 计划中 |
| 2.0.0 | 支持 Web 管理界面 | 🧠 构思中 |

---

**维护者：** HR Agent - Skill Factory  
**最后更新：** 2025-03-08
