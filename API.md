# API Documentation

GitHub Trending Notifier 对外提供的接口和内部 API 详细说明。

## 目录

- [概述](#概述)
- [外部触发接口](#外部触发接口)
- [GitHub API 集成](#github-api-集成)
- [OpenRouter AI API 集成](#openrouter-ai-api-集成)
- [通知系统](#通知系统)
- [配置结构](#配置结构)
- [错误码说明](#错误码说明)

---

## 概述

本技能主要包含三个外部 API 调用：

1. **GitHub Search API** - 获取热门仓库
2. **OpenRouter Chat Completion API** - 生成 AI 摘要
3. **通知渠道 API** - 发送消息 (Telegram/Discord/Feishu)

此外，还提供 OpenClaw 内部的命令行接口用于技能触发。

---

## 外部触发接口

### 命令行接口

```bash
node scripts/trending.js [options]
```

#### 参数

该脚本不接受传统命令行参数，所有配置通过环境变量读取。

#### 退出码

| 退出码 | 含义 |
|--------|------|
| `0` | 成功执行，通知已发送（或无新仓库） |
| `1` | 配置错误或 API 调用失败 |

#### 使用示例

```bash
# 标准运行
node scripts/trending.js

# 带调试输出
DEBUG=* node scripts/trending.js
```

---

## GitHub API 集成

### 搜索 Trending 仓库

**端点:** `GET https://api.github.com/search/repositories`

**认证:** Bearer Token (GITHUB_TOKEN)

**请求参数:**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `q` | String | ✅ | 搜索查询字符串 |
| `sort` | String | ❌ | 排序方式: `stars`, `forks`, `help-wanted-issues`, `updated` |
| `order` | String | ❌ | 排序顺序: `desc` (默认), `asc` |
| `per_page` | Number | ❌ | 每页数量 (默认 30, 最大 100) |

**当前实现查询:**

```javascript
const dateStr = since.toISOString().split('T')[0]; // 昨天日期
const query = `created:>=${dateStr} stars:>100 sort:stars-desc`;
```

**示例响应:**

```json
{
  "total_count": 12345,
  "incomplete_results": false,
  "items": [
    {
      "id": 123456,
      "name": "awesome-project",
      "full_name": "owner/awesome-project",
      "html_url": "https://github.com/owner/awesome-project",
      "description": "A fantastic project description",
      "stargazers_count": 5678,
      "forks_count": 890,
      "language": "TypeScript",
      "created_at": "2025-03-07T10:30:00Z",
      "updated_at": "2025-03-07T12:45:00Z",
      "owner": {
        "login": "owner",
        "avatar_url": "https://github.com/owner.png"
      }
    }
  ]
}
```

**字段映射:**

| 变量名 | API 字段 | 类型 | 说明 |
|--------|----------|------|------|
| `repo.id` | `id` | Number | 仓库 ID |
| `repo.name` | `name` | String | 仓库名称 |
| `repo.full_name` | `full_name` | String | 完整名称 (owner/repo) |
| `repo.html_url` | `html_url` | String | 仓库 URL |
| `repo.description` | `description` | String | 描述 |
| `repo.stargazers_count` | `stargazers_count` | Number | Star 数 |
| `repo.forks_count` | `forks_count` | Number | Fork 数 |
| `repo.language` | `language` | String | 主要编程语言 |
| `repo.created_at` | `created_at` | String | 创建时间 (ISO 8601) |
| `repo.owner.login` | `owner.login` | String | 所有者用户名 |

---

## OpenRouter AI API 集成

### 生成摘要

**端点:** `POST https://openrouter.ai/api/v1/chat/completions`

**认证:** Bearer Token (OPENROUTER_API_KEY)

**请求头:**

| 头部 | 值 | 必需 | 说明 |
|------|-----|------|------|
| `Authorization` | `Bearer <OPENROUTER_API_KEY>` | ✅ | API 密钥 |
| `Content-Type` | `application/json` | ✅ | 请求格式 |
| `HTTP-Referer` | `https://openclaw.ai` | ✅ | 推荐站点标识 |
| `X-Title` | `OpenClaw HR Agent` | ✅ | 应用名称 |

**请求体:**

```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "请用中文总结这个 GitHub 项目的亮点（3句话以内）：\n\n项目名称: owner/repo\n描述: 项目描述\n语言: TypeScript\n星数: 5678\nFork: 890\n\n亮点："
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7
}
```

**响应体:**

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "openai/gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "这是一个创新的 TypeScript 项目，具有出色的可维护性。社区活跃度高，文档完善。适合作为学习现代前端开发的参考案例。"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 32,
    "total_tokens": 77
  }
}
```

**提取摘要:**

```javascript
const summary = result.choices[0].message.content.trim();
```

**错误处理:**

- 网络错误 / 超时 → 使用备用摘要 `'AI 摘要暂不可用'`
- API 返回错误 → 记录日志并跳过该仓库
- 响应无 choices → 使用备用摘要

---

## 通知系统

### 消息格式

**标准消息结构:**

```
🔥 GitHub Trending 今日推荐

1. owner/repo-name
   ⭐ 5678 | 🍴 890 | TypeScript
   📝 AI 生成的摘要文本（3句话）
   🔗 https://github.com/owner/repo-name

2. owner/another-repo
   ⭐ 4321 | 🍴 567 | Python
   📝 另一个仓库的摘要...
   🔗 https://github.com/owner/another-repo

[... 更多仓库]
```

**每个仓库包含:**

- 序号和仓库完整名称
- Star 数、Fork 数、编程语言
- AI 生成的亮点摘要（3句话以内）
- GitHub 仓库链接

### 通知渠道适配

当前实现依赖 OpenClaw 的 `message.send()` 方法，支持：

| 渠道 | 配置变量 | 目标格式 |
|------|----------|----------|
| Telegram | `NOTIFY_CHANNEL="telegram"` | `<bot_token>:<chat_id>` |
| Feishu | `NOTIFY_CHANNEL="feishu"` | Webhook URL |
| Discord | `NOTIFY_CHANNEL="discord"` | Webhook URL |

**适配新渠道:**

编辑 `scripts/trending.js` 中的 `sendNotification()` 函数：

```javascript
async function sendNotification(notifications) {
  let message = buildMessage(notifications); // 构建消息

  // 根据渠道使用不同的发送逻辑
  switch (CONFIG.notifyChannel) {
    case 'telegram':
      await sendTelegram(message, CONFIG.notifyTarget);
      break;
    case 'feishu':
      await sendFeishu(message, CONFIG.notifyTarget);
      break;
    case 'discord':
      await sendDiscord(message, CONFIG.notifyTarget);
      break;
    default:
      console.log('📢 通知内容:\n', message); // 降级到控制台输出
  }
}

// 实现具体发送函数
async function sendTelegram(text, target) {
  const [botToken, chatId] = target.split(':');
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body = { chat_id: chatId, text, parse_mode: 'Markdown' };
  // ... fetch 实现
}
```

---

## 配置结构

### 环境变量总览

```javascript
const CONFIG = {
  githubToken: process.env.GITHUB_TOKEN,
  openrouterKey: process.env.OPENROUTER_API_KEY,
  notifyChannel: process.env.NOTIFY_CHANNEL || 'telegram',
  notifyTarget: process.env.NOTIFY_TARGET,
  maxRepos: parseInt(process.env.MAX_REPOS) || 5,
  openrouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
};
```

### 运行时配置

| 配置项 | 环境变量 | 类型 | 默认 | 说明 |
|--------|----------|------|--------|--------|
| `githubToken` | `GITHUB_TOKEN` | String | - | GitHub PAT (必需) |
| `openrouterKey` | `OPENROUTER_API_KEY` | String | - | OpenRouter Key (必需) |
| `notifyChannel` | `NOTIFY_CHANNEL` | String | `telegram` | 通知渠道 |
| `notifyTarget` | `NOTIFY_TARGET` | String | - | 目标标识 (必需) |
| `maxRepos` | `MAX_REPOS` | Number | `5` | 最大仓库数 |
| `openrouterModel` | `OPENROUTER_MODEL` | String | `openai/gpt-4o-mini` | AI 模型 |

### 支持的 OpenRouter 模型

| 模型名称 | 特点 | 推荐场景 |
|----------|------|----------|
| `openai/gpt-4o-mini` | 快速、经济 | 日常使用 ✅ |
| `openai/gpt-4o` | 高质量、稍慢 | 高精度摘要 |
| `anthropic/claude-3.5-sonnet` | 智能、长文本 | 复杂项目分析 |
| `google/gemini-2.0-flash-001` | 快速、多语言 | 多语言支持 |
| `meta-llama/llama-3.3-70b-instruct` | 开源、可控 | 本地部署偏好 |

> 💡 提示：模型列表请查看 [OpenRouter 官方模型页](https://openrouter.ai/models)

---

## 错误码说明

### 退出码

| 代码 | 含义 | 可能原因 | 解决方案 |
|------|------|----------|----------|
| `0` | 成功 | - | - |
| `1` | 一般错误 | 环境变量缺失、API 调用失败 | 检查日志，验证配置 |
| `2` | 配置错误 | GITHUB_TOKEN 未设置 | 设置 `GITHUB_TOKEN` |
| `3` | 网络错误 | 无法访问 GitHub/OpenRouter | 检查网络连接 |
| `4` | API 限流 | GitHub/OpenRouter 速率限制 | 降低请求频率，使用更少仓库数 |

### 日志级别

通过 `LOG_LEVEL` 控制输出详细程度：

```bash
LOG_LEVEL=debug node scripts/trending.js  # 最详细
LOG_LEVEL=info node scripts/trending.js   # 默认
LOG_LEVEL=warn node scripts/trending.js   # 仅警告
LOG_LEVEL=error node scripts/trending.js  # 仅错误
```

**日志级别映射:**

- `debug` - 包含所有 HTTP 请求详情、API 响应体
- `info` - 标准运行信息（默认）
- `warn` - 警告信息
- `error` - 仅错误信息

---

## 扩展示例

### 集成到自定义 Webhook

```javascript
// 自定义发送逻辑
async function sendToCustomWebhook(notifications) {
  const webhookUrl = process.env.CUSTOM_WEBHOOK_URL;
  const payload = {
    text: buildMessage(notifications),
    timestamp: new Date().toISOString(),
    source: 'github-trending-notifier'
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
}
```

### 添加数据库存储

```javascript
// 使用 SQLite/PostgreSQL 存储历史记录
import Database from 'better-sqlite3';
const db = new Database('trending.db');

// 保存仓库到数据库
function saveRepos(repos) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO repos (github_id, name, stars, language, fetched_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  for (const repo of repos) {
    stmt.run(repo.id, repo.full_name, repo.stargazers_count, repo.language);
  }
}
```

---

## 性能指标

| 指标 | 典型值 | 说明 |
|------|--------|------|
| API 调用次数 | 1 (GitHub) + N (OpenRouter) | N = MAX_REPOS |
| 执行时间 | 10-30 秒 | 受网络延迟和 AI 生成速度影响 |
| 内存占用 | < 50 MB | 纯 Node.js，无重型依赖 |
| 网络请求 | 1+N 次外部调用 | 可配置并发数优化 |

---

**API 版本**: v1.0.0  
**最后更新**: 2025-03-08
