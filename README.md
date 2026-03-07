# GitHub Trending Notifier

[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-blue)](https://openclaw.ai)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 🔥 自动监控 GitHub Trending，AI 生成摘要并推送到您的即时通讯频道

GitHub Trending Notifier 是一个 OpenClaw 技能，每小时自动获取 GitHub 上的热门仓库，使用 AI 生成中文亮点摘要，并通过 Telegram、飞书或 Discord 推送到指定频道。让您随时掌握最新的开源趋势！

## ✨ 功能特性

- 🔍 **智能发现** - 使用 GitHub Search API 获取每日新增的高星仓库
- 🤖 **AI 摘要** - 集成 OpenRouter，自动生成项目亮点总结（3句话以内）
- 📢 **多平台推送** - 支持 Telegram、飞书、Discord 等多种通知渠道
- ⏰ **定时任务** - 与 OpenClaw Cron 完美集成，每小时自动运行
- 🎨 **精美排版** - 格式化消息，清晰展示仓库信息、星数、语言等
- ⚡ **轻量高效** - 纯 Node.js 实现，无外部依赖包，仅使用内置模块

## 📋 目录

- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [使用方法](#使用方法)
- [命令行选项](#命令行选项)
- [自定义配置](#自定义配置)
- [部署为定时任务](#部署为定时任务)
- [API 文档](./API.md)
- [故障排除](./TROUBLESHOOTING.md)

## 🚀 快速开始

### 前置要求

- Node.js 18+ (推荐使用最新 LTS 版本)
- OpenClaw 已安装并运行
- GitHub Personal Access Token (PAT)
- OpenRouter API Key

### 1. 获取 API 密钥

**GitHub Token:**
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Fine-grained tokens" 或 "Personal access token (classic)"
3. 勾选以下权限：
   - `repo` (Full control of private repositories)
   - `read:org` (Read organization and team membership)
4. 生成并复制 Token

**OpenRouter API Key:**
1. 访问 https://openrouter.ai/keys
2. 点击 "Create Key"
3. 复制生成的 API Key

### 2. 配置环境变量

在 OpenClaw 环境中设置以下环境变量：

```bash
# 必需：GitHub 认证
export GITHUB_TOKEN="ghp_your_github_token_here"

# 必需：OpenRouter AI 服务
export OPENROUTER_API_KEY="sk-or-your-openrouter-key"

# 可选：OpenRouter 模型（默认: openai/gpt-4o-mini）
export OPENROUTER_MODEL="openai/gpt-4o-mini"

# 必需：通知渠道 (telegram/feishu/discord)
export NOTIFY_CHANNEL="telegram"

# 必需：目标聊天 ID / 用户 ID / Webhook URL
export NOTIFY_TARGET="your_chat_id_or_webhook_url"
```

> 💡 **提示**：建议将上述变量添加到 `~/.openclaw/.env` 文件中，OpenClaw 会自动加载。

### 3. 运行测试

```bash
# 手动运行一次，验证配置是否正确
cd /home/admin/.openclaw/workspace/openclaw-github-trending
node scripts/trending.js
```

如果配置正确，您将看到类似输出：
```
🚀 开始获取 GitHub Trending...
✅ 找到 5 个热门仓库
  ├ octocat/hello-world (⭐ 1234)
  ├ facebook/react (⭐ 215000)
...
📢 通知内容:
🔥 GitHub Trending 今日推荐

1. octocat/hello-world
   ⭐ 1234 | 🍴 567 | JavaScript
   📝 这是一个示例项目，展示了...
   🔗 https://github.com/octocat/hello-world

✅ Trending 通知完成
```

## ⚙️ 详细配置

### 环境变量说明

| 变量名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `GITHUB_TOKEN` | String | ✅ | - | GitHub Personal Access Token |
| `OPENROUTER_API_KEY` | String | ✅ | - | OpenRouter API 密钥 |
| `OPENROUTER_MODEL` | String | ❌ | `openai/gpt-4o-mini` | AI 模型名称，支持 [OpenRouter 所有模型](https://openrouter.ai/models) |
| `NOTIFY_CHANNEL` | String | ✅ | `telegram` | 通知渠道：`telegram`、`feishu`、`discord` |
| `NOTIFY_TARGET` | String | ✅ | - | 目标标识，格式因渠道而异（见下方） |
| `MAX_REPOS` | Number | ❌ | `5` | 每次推送的最大仓库数量 (1-20) |
| `LOG_LEVEL` | String | ❌ | `info` | 日志级别：`debug`、`info`、`warn`、`error` |

### 各渠道 NOTIFY_TARGET 格式

#### Telegram
```
# 使用 Bot Token 和 Chat ID
export NOTIFY_TARGET="123456789:ABCdefGHI-jklMNOpqrsTUVwxyz"
# 格式: <bot_token>:<chat_id>
```

**获取 Chat ID:**
1. 与您的 Bot 对话
2. 访问 `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. 发送消息后，查看 `chat.id` 字段

#### 飞书 (Feishu)
```
# 使用 Webhook URL
export NOTIFY_TARGET="https://open.feishu.cn/open-apis/bot/v2/hook/your_webhook_token"
```

#### Discord
```
# 使用 Webhook URL
export NOTIFY_TARGET="https://discord.com/api/webhooks/.../your_webhook_token"
```

## 💻 使用方法

### 命令行运行

```bash
# 基本用法
node scripts/trending.js

# 指定配置文件路径
GITHUB_TOKEN="xxx" OPENROUTER_API_KEY="xxx" node scripts/trending.js

# 调整最大仓库数
MAX_REPOS=10 node scripts/trending.js

# 调试模式
LOG_LEVEL=debug node scripts/trending.js
```

### 与 OpenClaw 集成

#### 1. 安装技能

```bash
# 将技能复制到 OpenClaw skills 目录
cp -r /path/to/openclaw-github-trending ~/.openclaw/workspace/skills/
```

#### 2. 配置环境变量

编辑 `~/.openclaw/.env` 文件，添加：

```bash
GITHUB_TOKEN="your_github_token"
OPENROUTER_API_KEY="your_openrouter_key"
NOTIFY_CHANNEL="telegram"
NOTIFY_TARGET="your_target"
```

#### 3. 设置定时任务

使用 OpenClaw Cron 每小时自动运行：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每小时运行）
0 * * * * /usr/bin/node /home/admin/.openclaw/workspace/skills/github-trending/scripts/trending.js >> /var/log/github-trending.log 2>&1
```

或使用 OpenClaw 任务调度器（如果支持）：

```bash
openclaw schedule add "github-trending" "0 * * * *" "node skills/github-trending/scripts/trending.js"
```

### 手动触发

您可以随时手动运行技能来测试或立即获取 Trending 通知：

```bash
# 直接运行脚本
node /path/to/skill/scripts/trending.js

# 或通过 OpenClaw CLI
openclaw skill run github-trending
```

## 🔧 自定义配置

### 调整 AI 模型

使用不同的 OpenRouter 模型以获得更好的摘要质量或更低的成本：

```bash
# 高质量模型（收费较高）
export OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"

# 平衡模型
export OPENROUTER_MODEL="openai/gpt-4o"

# 经济模型（默认）
export OPENROUTER_MODEL="openai/gpt-4o-mini"

# 本地模型（如果 OpenRouter 支持）
export OPENROUTER_MODEL="your-model-name"
```

### 修改搜索条件

编辑 `scripts/trending.js` 中的 `getTrending()` 函数，自定义搜索逻辑：

```javascript
// 例如：按周 trending，或指定语言
const query = `language:javascript created:>=${dateStr} stars:>50 sort:stars-desc`;
```

### 自定义消息格式

修改 `sendNotification()` 函数以调整消息模板：

```javascript
let message = '🌟 今日 GitHub Trending\n\n'; // 修改标题

for (let i = 0; i < notifications.length; i++) {
  const n = notifications[i];
  message += `🏆 ${i+1}. ${n.repo.full_name}\n`; // 修改编号样式
  message += `⭐ ${n.repo.stargazers_count} 🌐 ${n.repo.language}\n`; // 调整信息
  message += `${n.summary}\n`;
  message += `🔗 ${n.repo.html_url}\n\n`;
}
```

### 限制仓库语言

只监控特定编程语言的 Trending 仓库：

```javascript
// 在 getTrending() 中添加语言过滤
const preferredLanguages = ['javascript', 'python', 'rust', 'go'];
const query = `language:${preferredLanguages.join('|')} created:>=${dateStr} stars:>100 sort:stars-desc`;
```

## 📡 API 文档

详细的 API 文档请参见 [API.md](./API.md)。

## 🆘 故障排除

常见问题和解决方案请参见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [OpenClaw 官方网站](https://openclaw.ai)
- [GitHub API 文档](https://docs.github.com/en/rest)
- [OpenRouter API Reference](https://openrouter.ai/docs)
- [技能仓库](https://github.com/your-repo/openclaw-github-trending)

---

**Made with ❤️ by OpenClaw Community**
