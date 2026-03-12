# OpenClaw GitHub Trending Notifier

[English](#english) | [中文](#中文)

---

## English

**Status**: Production | **License**: MIT | **Author**: maichanks

Monitors GitHub Trending repositories and sends formatted summaries to your chat channels.

### Features

- Scheduled fetching (cron)
- Filter by language, stars, date
- AI summarization (optional)
- Multiple notifiers: Telegram, Discord, Slack, Feishu

### Quick Start

```bash
git clone https://github.com/maichanks/openclaw-github-trending.git
cd openclaw-github-trending
pnpm install
cp .env.example .env
# Edit .env: NOTIFY_CHANNEL, NOTIFY_TARGET, OPENROUTER_API_KEY (optional)
node src/index.js
```

---

## 中文

**状态**: 生产就绪 | **许可证**: MIT | **作者**: maichanks

监控 GitHub 热门仓库，并将格式化摘要发送到你的聊天频道。

### 功能

- 定时抓取（cron）
- 按语言、星数、日期过滤
- AI 自动摘要（可选）
- 多通道通知：Telegram、Discord、Slack、飞书

### 快速开始

```bash
git clone https://github.com/maichanks/openclaw-github-trending.git
cd openclaw-github-trending
pnpm install
cp .env.example .env
# 编辑 .env：NOTIFY_CHANNEL、NOTIFY_TARGET、OPENROUTER_API_KEY（可选）
node src/index.js
```
