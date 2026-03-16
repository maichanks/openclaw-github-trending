# OpenClaw GitHub Trending Notifier

[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-ff6b6b)](https://github.com/openclaw/openclaw)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)
[![Status](https://img.shields.io/badge/status-Production-brightgreen)](/LICENSE)

[English](#english) | [中文](#中文)

---

## English

**Status**: Production | **License**: MIT | **Author**: maichanks

> ⚡ **一键部署**：`curl -fsSL https://raw.githubusercontent.com/maichanks/openclaw-github-trending/main/deploy.js -o deploy.js && node deploy.js`
>
> 实时监控 GitHub Trending 热门仓库，智能过滤 + 可选 AI 摘要，定时推送至飞书/Telegram/Discord/Slack。快速洞察开发趋势，3 分钟部署即用。

**🚀 3 分钟部署** | 📖 双语文档 | 🆓 MIT 协议 | ⭐ OpenClaw 原生集成

### Features

- Scheduled fetching (via OpenClaw cron)
- Filter by language, stars, date
- Optional AI summarization (OpenRouter)
- Multiple notifiers: Feishu, Telegram, Discord, Slack
- Designed for OpenClaw ecosystem

### 🚀 One-Click Deploy

Run the automated deployment script:

```bash
curl -fsSL https://raw.githubusercontent.com/maichanks/openclaw-github-trending/main/deploy.js -o deploy.js && node deploy.js
```

This will clone the repo, install dependencies, and create a `.env` file.

---


### Quick Start

#### 1. Install to OpenClaw skills

```bash
# Clone or copy to your OpenClaw skills directory
git clone https://github.com/maichanks/openclaw-github-trending.git
# OR: cp -r openclaw-github-trending $HOME/.openclaw/workspace/skills/
```

#### 2. Install dependencies

```bash
cd $HOME/.openclaw/workspace/skills/openclaw-github-trending
pnpm install   # or: npm install
```

#### 3. Configure

```bash
cp .env.example .env
# Edit .env:
# - NOTIFY_CHANNEL=feishu (or telegram, discord, slack)
# - NOTIFY_TARGET=ou_OPEN_ID  (your user/chat open_id)
# - OPENROUTER_API_KEY=... (optional, for AI summaries)
```

#### 4. Test (optional)

```bash
node src/index.js
```

#### 5. Add to OpenClaw cron (automatic delivery)

```bash
openclaw cron add \
  --name "GitHub Trending" \
  --cron "0 9 * * *" \
  --session isolated \
  --message "node $HOME/.openclaw/workspace/skills/openclaw-github-trending/src/index.js"
```

---

## 中文

**状态**: 生产就绪 | **许可证**: MIT | **作者**: maichanks

OpenClaw skill：监控 GitHub 热门仓库，并将格式化摘要发送到你的聊天频道（飞书/Telegram/Discord/Slack）。

### 功能

- 定时抓取（通过 OpenClaw cron）
- 按语言、星数、日期过滤
- 可选 AI 摘要（OpenRouter）
- 多通道通知：飞书、Telegram、Discord、Slack
- 专为 OpenClaw 生态系统设计

### 快速开始

#### 1. 安装到 OpenClaw skills

```bash
# 克隆或复制到你的 OpenClaw skills 目录
git clone https://github.com/maichanks/openclaw-github-trending.git
# 或：cp -r openclaw-github-trending $HOME/.openclaw/workspace/skills/
```

#### 2. 安装依赖

```bash
cd $HOME/.openclaw/workspace/skills/openclaw-github-trending
pnpm install   # 或：npm install
```

#### 3. 配置

```bash
cp .env.example .env
# 编辑 .env：
# - NOTIFY_CHANNEL=feishu (也可选 telegram, discord, slack)
# - NOTIFY_TARGET=ou_OPEN_ID  (你的用户/群组 open_id)
# - OPENROUTER_API_KEY=... (可选，AI 摘要)
```

#### 4. 测试（可选）

```bash
node src/index.js
```

#### 5. 注册 OpenClaw 定时任务（自动推送）

```bash
openclaw cron add \
  --name "GitHub Trending" \
  --cron "0 9 * * *" \
  --session isolated \
  --message "node $HOME/.openclaw/workspace/skills/openclaw-github-trending/src/index.js"
```

---

## 📝 Keywords

`openclaw`, `github-trending`, `github-monitor`, `notifications`, `ai-summarization`, `openrouter`, `feishu`, `telegram`, `discord`, `slack`, `automation`, `devops`, `developer-tools`

---

## 🔗 Related OpenClaw Projects

- [Smart Digest](https://github.com/maichanks/smart-digest) - AI-powered news digest for OpenClaw
- [Security Hardening for OpenClaw](https://github.com/maichanks/security-hardening) - Comprehensive security toolkit
- [LLM Cost Optimizer](https://github.com/maichanks/llm-cost-optimizer) - Monitor and reduce LLM API costs
- [Multi-Platform Publisher](https://github.com/maichanks/multi-platform-publisher) - Enterprise content publishing with MCP support

---

## 📄 License

MIT © 2026 maichanks <hankan1993@gmail.com>
