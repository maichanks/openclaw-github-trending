# GitHub Trending Notifier

🔥 每小时自动检查 GitHub Trending，生成 AI 摘要并推送到你的聊天频道。

## ✨ 功能

- 📊 获取 daily/weekly trending repositories
- 🤖 AI 生成亮点摘要（OpenRouter）
- 📢 推送到 Telegram / Feishu / Discord
- ⏰ 支持 OpenClaw cron 定时
- ⚡ 轻量级，<50MB 内存

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /home/admin/.openclaw/workspace/openclaw-github-trending
npm install
```

### 2. 配置环境变量

```bash
export GITHUB_TOKEN="ghp_xxx"           # GitHub Personal Access Token
export OPENROUTER_API_KEY="sk-xxx"      # OpenRouter API Key
export NOTIFY_CHANNEL="feishu"          # 通知渠道：telegram/feishu/discord
export NOTIFY_TARGET="your-chat-id"     # 目标聊天ID
```

### 3. 运行

```bash
node scripts/trending.js
```

### 4. 设置定时（OpenClaw Cron）

```bash
# 每小时运行
openclaw cron add --kind every --everyMs 3600000 --sessionTarget isolated --payload '{"kind":"agentTurn","message":"node /path/to/trending.js"}'
```

## 📦 输出格式

```
🔥 GitHub Trending 今日推荐

1. elizaOS/eliza
   ⭐ 15,234 | 🍴 1,892 | TypeScript
   📝 基于 AI 的自主代理框架，支持多模型和插件系统
   🔗 https://github.com/elizaOS/eliza

2. openclaw/openclaw
   ⭐ 2,345 | 🍴 456 | Python
   📝 下一代 AI Agent 平台，支持多模型、技能系统、自动化工作流
   🔗 https://github.com/openclaw/openclaw
```

## ⚙️ 配置选项

| 环境变量 | 必填 | 默认值 | 说明 |
|---------|------|--------|------|
| `GITHUB_TOKEN` | ✅ | - | GitHub PAT (public_repo 权限即可) |
| `OPENROUTER_API_KEY` | ✅ | - | OpenRouter API Key |
| `OPENROUTER_MODEL` | ❌ | `openai/gpt-4o-mini` | 使用的模型 |
| `NOTIFY_CHANNEL` | ✅ | - | 通知渠道 |
| `NOTIFY_TARGET` | ✅ | - | 目标接收者ID |
| `MAX_REPOS` | ❌ | `5` | 最多推送几个仓库 |

## 🛡️ 安全

- GitHub Token 仅访问公开仓库，无需 `repo` 完整权限
- 所有密钥通过环境变量注入，不存储
- 日志自动脱敏

## 🐛 故障排除

### 429 Rate Limit
GitHub API 限流：认证后 60 req/min。脚本有自动重试（3次，指数退避）。

### OpenRouter 失败
检查 API Key 是否有效，账户是否有余额。失败时降级为纯文本通知。

### 通知未收到
确认 `NOTIFY_CHANNEL` 和 `NOTIFY_TARGET` 配置正确。OpenClaw 消息工具需已配置该渠道。

## 📄 License

MIT

---

**由 HR Agent - Skill Factory 生产** | 🤖 自动发布 2025-03-08
