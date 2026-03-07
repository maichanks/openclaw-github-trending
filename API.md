# API Reference - GitHub Trending Notifier

📖 **v1.0 完整 API 文档**

本文件详细描述了 GitHub Trending Notifier 的所有外部接口、配置选项、数据结构和错误处理。

---

## 📑 目录

1. [概述](#概述)
2. [命令行接口](#命令行接口)
3. [GitHub Search API 集成](#github-search-api-集成)
4. [OpenRouter AI API 集成](#openrouter-ai-api-集成)
5. [通知系统](#通知系统)
6. [配置架构](#配置架构)
7. [数据模型](#数据模型)
8. [错误处理](#错误处理)
9. [退出码参考](#退出码参考)
10. [扩展开发](#扩展开发)

---

## 概述

本技能通过以下三个核心外部 API 实现功能：

| API | 用途 | 频率 | 认证方式 |
|-----|------|------|----------|
| **GitHub Search API** | 获取 trending 仓库 | 每小时 1 次 | Bearer Token (GITHUB_TOKEN) |
| **OpenRouter Chat API** | AI 生成摘要 | 每小时 5 次（默认） | Bearer Token (OPENROUTER_API_KEY) |
| **通知渠道 API** | 发送消息 | 每小时 1 次 | 依赖渠道（Bot Token/Webhook） |

此外，提供 **OpenClaw 集成接口** 用于定时触发和消息传递。

---

## 命令行接口

### 脚本入口

```bash
node scripts/trending.js [options]
```

当前版本 **不接受命令行参数**，所有配置通过环境变量读取。

### 基本用法

```bash
# 标准运行（使用环境变量配置）
node scripts/trending.js

# 测试运行（查看输出）
node scripts/trending.js

# 调试模式
DEBUG=* node scripts/trending.js

# 指定工作目录
cd /path/to/openclaw-github-trending && node scripts/trending.js
```

### 执行流程图

```
┌─────────────────┐
│   开始执行      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 1. 验证环境变量                         │
│    - GITHUB_TOKEN 是否存在              │
│    - OPENROUTER_API_KEY 是否存在        │
└────────┬────────────────────────────────┘
         │
         │ ✅ 通过
         ▼
┌─────────────────────────────────────────┐
│ 2. 获取 Trending 仓库                   │
│    GET /search/repositories             │
│    query: created:>=YYYY-MM-DD stars>100│
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 3. AI 生成摘要（每个仓库）              │
│    POST /chat/completions               │
│    delay: 1秒/次（避免限流）            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 4. 发送推送到通知渠道                    │
│    message.send() 或控制台输出           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 5. 退出（0=成功，1=失败）               │
└─────────────────────────────────────────┘
```

### 返回值

| 退出码 | 含义 | 触发条件 |
|--------|------|----------|
| `0` | ✅ 成功 | 正常执行完成（即使无新仓库） |
| `1` | ❌ 错误 | 配置缺失或 API 调用失败 |

---

## GitHub Search API 集成

### 请求参数

脚本使用 GitHub **Search Repositories** 端点：

```
GET https://api.github.com/search/repositories
```

**完整请求 URL（示例）**：

```
https://api.github.com/search/repositories?q=created%3A%3E%3D2025-03-07+stars%3A100&sort=stars&order=desc&per_page=5
```

| 查询参数 | 值 | 说明 |
|----------|-----|------|
| `q` | `created:>=2025-03-07 stars:>100` | 搜索条件：昨天之后创建，stars > 100 |
| `sort` | `stars` | 按 stars 排序 |
| `order` | `desc` | 降序 |
| `per_page` | `5`（可配置 `MAX_REPOS`） | 返回数量 |

### 认证头

```http
Authorization: token ghp_your_github_token_here
User-Agent: OpenClaw-HR-Agent
Accept: application/vnd.github.v3+json
```

### 响应结构

```json
{
  "total_count": 12345,
  "incomplete_results": false,
  "items": [
    {
      "id": 123456789,
      "name": "repository-name",
      "full_name": "owner/repository-name",
      "html_url": "https://github.com/owner/repository-name",
      "description": "Project description text",
      "stargazers_count": 5678,
      "forks_count": 890,
      "language": "TypeScript",
      "created_at": "2025-03-07T10:30:00Z",
      "updated_at": "2025-03-08T02:15:00Z",
      "owner": {
        "login": "owner-username",
        "avatar_url": "https://avatars.githubusercontent.com/u/123456?v=4",
        "html_url": "https://github.com/owner-username"
      }
    }
  ]
}
```

**使用的字段映射**：

| 脚本变量名 | API 字段 | 数据类型 | 说明 |
|-----------|----------|----------|------|
| `repo.id` | `id` | Number | GitHub 仓库 ID（唯一） |
| `repo.name` | `name` | String | 仓库名（不含 owner） |
| `repo.full_name` | `full_name` | String | 完整名称 `owner/repo` |
| `repo.html_url` | `html_url` | String | 仓库 URL |
| `repo.description` | `description` | String | 项目描述（可能为 null） |
| `repo.stargazers_count` | `stargazers_count` | Number | Star 数量 |
| `repo.forks_count` | `forks_count` | Number | Fork 数量 |
| `repo.language` | `language` | String | 主要编程语言（可能为 null） |
| `repo.created_at` | `created_at` | String (ISO 8601) | 创建时间 |
| `repo.owner.login` | `owner.login` | String | Owner 用户名 |

### 限流策略

| 类型 | 限制 | 说明 |
|------|------|------|
| **未认证** | 10 请求/分钟 | ❌ 不推荐使用 |
| **已认证** | 60 请求/分钟 | ✅ 使用 GITHUB_TOKEN |

**限流响应头**：

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1702000000
```

当前实现 **1 请求/小时**，远低于限制，无需担心限流。

---

## OpenRouter AI API 集成

### 请求端点

```
POST https://openrouter.ai/api/v1/chat/completions
```

### 认证头

```http
Authorization: Bearer sk-or-your-api-key
Content-Type: application/json
HTTP-Referer: https://openclaw.ai
X-Title: OpenClaw HR Agent
```

> **关于 HTTP-Referer 和 X-Title**：OpenRouter 要求这两个头用来识别调用来源，请勿修改。

### 请求体结构

```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "请用中文总结这个 GitHub 项目的亮点（3句话以内）：\n\n项目名称: elizaOS/eliza\n描述: 基于 AI 的自主代理框架\n语言: TypeScript\n星数: 15234\nFork: 1892\n\n亮点："
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": false
}
```

**各字段说明**：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `model` | String | ✅ | `openai/gpt-4o-mini` | 使用的模型名称 |
| `messages` | Array | ✅ | - | 消息数组，role 为 `user` 或 `system` |
| `max_tokens` | Number | ❌ | `150` | 最大输出 token 数 |
| `temperature` | Number | ❌ | `0.7` | 创造性参数，0-2 |
| `stream` | Boolean | ❌ | `false` | 是否流式输出（当前禁用） |

**动态 Prompt 构建逻辑**：

```javascript
const prompt = `请用中文总结这个 GitHub 项目的亮点（3句话以内）：

项目名称: ${repo.full_name}
描述: ${repo.description || '无'}
语言: ${repo.language || 'Unknown'}
星数: ${repo.stargazers_count}
Fork: ${repo.forks_count}

亮点：`;
```

### 响应结构（成功）

```json
{
  "id": "chatcmpl-ABC123xyz",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "openai/gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "这是一个基于 AI 的自主代理框架，支持多模型和插件系统。社区活跃度高，文档完善，适合作为学习现代 AI 应用开发的参考案例。"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 58,
    "completion_tokens": 42,
    "total_tokens": 100
  }
}
```

**提取摘要**：

```javascript
const summary = result.choices[0].message.content.trim();
```

### 响应结构（错误）

```json
{
  "error": {
    "message": "Invalid API key",
    "code": 401,
    "type": "authentication_error"
  }
}
```

### 限流与成本

| 模型 | 输入价格 ($/1K) | 输出价格 ($/1K) | 每次请求成本（估算） |
|------|------------------|------------------|---------------------|
| gpt-4o-mini | 0.00011 | 0.00011 | ~ $0.00002 |
| gpt-4o | 0.005 | 0.015 | ~ $0.0003 |
| claude-3.5-sonnet | 0.003 | 0.015 | ~ $0.0003 |

**月度成本估算（5 仓库/小时，24 小时/天，30 天）**：
- gpt-4o-mini: **~ $0.72**
- claude-3.5-sonnet: **~ $10.8**

> 实际使用通常远低于此（GitHub trending 仓库数量有限，大多时间无新仓库）

### 错误降级策略

OpenRouter API 失败时的处理：

1. **网络错误 / 超时** → 记录错误，使用备用文本 `'AI 摘要暂不可用'`
2. **401 Unauthorized** → 记录错误，使用备用文本
3. **429 Rate Limit** → 记录警告，使用备用文本
4. **5xx 服务器错误** → 记录错误，使用备用文本
5. **响应格式异常** → 记录错误，使用备用文本

```javascript
try {
  const result = await response.json();
  if (result.choices && result.choices[0]) {
    return result.choices[0].message.content.trim();
  } else {
    throw new Error('Invalid response format');
  }
} catch (err) {
  console.error('❌ AI 生成摘要失败:', err.message);
  return 'AI 摘要暂不可用'; // 降级文本
}
```

---

## 通知系统

### 消息格式

#### 标准格式（默认）

```
🔥 GitHub Trending 今日推荐

1. elizaOS/eliza
   ⭐ 15234 | 🍴 1892 | TypeScript
   📝 这是一个基于 AI 的自主代理框架，支持多模型和插件系统。社区活跃度高，文档完善。
   🔗 https://github.com/elizaOS/eliza

2. openclaw/openclaw
   ⭐ 2345 | 🍴 456 | Python
   📝 下一代 AI Agent 平台，支持多模型、技能系统、自动化工作流。模块化设计优秀。
   🔗 https://github.com/openclaw/openclaw
```

#### Markdown 格式（可选）

```markdown
🔥 **GitHub Trending 今日推荐**

1. **elizaOS/eliza**
   ⭐ 15.2k | 🍴 1.8k | TypeScript
   📝 这是一个基于 AI 的自主代理框架...
   🔗 [访问仓库](https://github.com/elizaOS/eliza)
```

### 发送机制

当前实现 **集成 OpenClaw 消息系统**，通过全局 `message` 对象发送（需 OpenClaw 实例注入）。

```javascript
if (typeof message !== 'undefined' && message.send) {
  await message.send({
    channel: CONFIG.notifyChannel,
    target: CONFIG.notifyTarget,
    message: messageText
  });
} else {
  console.log('📢 通知内容:\n', messageText);
}
```

**如 OpenClaw 不可用**，消息会输出到控制台，便于调试。

### 通知渠道参数

| 参数 | 类型 | 说明 | 示例值 |
|------|------|------|--------|
| `channel` | String | 渠道名称 | `telegram` / `feishu` / `discord` |
| `target` | String | 目标标识 | 格式依赖渠道（见 README） |

### 扩展新渠道

编辑 `scripts/trending.js` 的 `sendNotification()` 函数：

```javascript
async function sendNotification(notifications) {
  const message = buildMessage(notifications);
  
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
    // 新增渠道
    case 'slack':
      await sendSlack(message, CONFIG.notifyTarget);
      break;
    case 'webhook':
      await sendWebhook(message, CONFIG.notifyTarget);
      break;
    default:
      console.log('📢 通知内容:\n', message);
  }
}

// 实现发送函数示例
async function sendSlack(text, webhookUrl) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status}`);
  }
}
```

---

## 配置架构

### 配置加载流程

```
环境变量 → CONFIG 对象 → 各模块使用
```

### 配置表

| 配置项 | 环境变量 | 类型 | 默认值 | 必需 | 说明 |
|--------|----------|------|--------|------|------|
| `githubToken` | `GITHUB_TOKEN` | String | - | ✅ | GitHub PAT |
| `openrouterKey` | `OPENROUTER_API_KEY` | String | - | ✅ | OpenRouter Key |
| `notifyChannel` | `NOTIFY_CHANNEL` | String | `'telegram'` | ✅ | 通知渠道 |
| `notifyTarget` | `NOTIFY_TARGET` | String | - | ✅ | 目标标识 |
| `maxRepos` | `MAX_REPOS` | Number | `5` | ❌ | 最大仓库数 |
| `openrouterModel` | `OPENROUTER_MODEL` | String | `'openai/gpt-4o-mini'` | ❌ | AI 模型 |

⚠️ **注意**：`maxRepos` 当前在代码中硬编码为 `5`（第13行），如需修改请编辑源码：

```javascript
const CONFIG = {
  // ...
  maxRepos: parseInt(process.env.MAX_REPOS) || 5, // 改为这样支持环境变量
  // ...
};
```

### 配置验证

脚本启动时验证必填配置：

```javascript
if (!CONFIG.githubToken) {
  console.error('❌ 缺少 GITHUB_TOKEN');
  process.exit(1);
}
```

建议在运行前手动检查：

```bash
# 检查所有必需变量是否设置
: "${GITHUB_TOKEN:?请设置 GITHUB_TOKEN}"
: "${OPENROUTER_API_KEY:?请设置 OPENROUTER_API_KEY}"
: "${NOTIFY_CHANNEL:?请设置 NOTIFY_CHANNEL}"
: "${NOTIFY_TARGET:?请设置 NOTIFY_TARGET}"

echo "✅ 所有配置就绪"
```

---

## 数据模型

### Repository（仓库对象）

```typescript
interface Repository {
  id: number;                    // GitHub ID
  name: string;                  // 仓库名
  full_name: string;             // owner/repo
  html_url: string;              // URL
  description: string | null;    // 描述
  stargazers_count: number;      // Stars
  forks_count: number;           // Forks
  language: string | null;       // 语言
  created_at: string;            // 创建时间 (ISO 8601)
  updated_at: string;            // 更新时间
  owner: {
    login: string;               // 用户名
    avatar_url: string;          // 头像
    html_url: string;            // 用户主页
  };
}
```

### Notification（通知对象）

```typescript
interface Notification {
  repo: Repository;   // 仓库数据
  summary: string;    // AI 生成的摘要
}
```

### Config（配置对象）

```typescript
interface Config {
  githubToken: string;
  openrouterKey: string;
  notifyChannel: 'telegram' | 'feishu' | 'discord';
  notifyTarget: string;
  maxRepos: number;
  openrouterModel: string;
}
```

---

## 错误处理

### 错误类型

| 错误类型 | 触发条件 | 处理方式 | 用户影响 |
|----------|----------|----------|----------|
| **配置错误** | 环境变量缺失 | 打印错误，退出 1 | 脚本不执行 |
| **网络错误** | fetch/连接失败 | 记录日志，跳过失败步骤 | 可能无通知 |
| **API 限流** | GitHub/OpenRouter 429 | 自动重试（暂未实现） | 本次失败 |
| **认证失败** | Token 无效 401 | 记录错误，使用降级 | AI 摘要不可用 |
| **数据格式异常** | API 响应异常 | 使用默认值 | 部分数据缺失 |

### 重试机制

**当前版本**：**无自动重试**（连续失败需手动重跑）

**建议增强**（未来版本）：

```javascript
async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i))); // 指数退避
    }
  }
}
```

### 日志输出规范

| 级别 | 输出 | 说明 |
|------|------|------|
| **info** | `🚀 开始获取 GitHub Trending...` | 流程开始 |
| **info** | `✅ 找到 N 个热门仓库` | 数据获取完成 |
| **info** | `  ├ owner/repo (⭐ 1234)` | 处理中 |
| **error** | `❌ 获取 trending 失败: ...` | 错误（带 ❌ 前缀） |
| **warn** | `⚠️ 无 trending 数据` | 警告 |
| **info** | `✅ Trending 通知完成` | 流程结束 |

---

## 退出码参考

| 代码 | 含义 | 建议操作 |
|------|------|----------|
| `0` | ✅ 成功 | 正常结束，检查通知是否收到 |
| `1` | ❌ 通用错误 | 1. 查看日志<br>2. 验证环境变量<br>3. 测试 API 连通性 |

未来可能扩展更多退出码（例如 2=配置错误，3=网络错误，4=限流）。

---

## 扩展开发

### 1. 添加新 AI 模型

1. 获取模型 ID 从 [OpenRouter Models](https://openrouter.ai/models)
2. 设置环境变量：

```bash
export OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"
```

3. 验证：

```bash
node scripts/trending.js
```

### 2. 支持 OAuth 认证

替换 `httpsGet()` 中的认证方式：

```javascript
// GitHub App 认证（需要 JWT）
headers: {
  'Authorization': `Bearer ${appToken}`,
  ...
}
```

### 3. 添加数据库存储

详见 README 高级用法章节，建议使用 `better-sqlite3` 或 `PostgreSQL`。

### 4. 实现 Webhook 触发器

创建 `scripts/webhook-server.js`：

```javascript
import { createServer } from 'http';
import TrendingNotifier from './trending.js';

const server = createServer(async (req, res) => {
  if (req.url === '/trigger') {
    await TrendingNotifier.main(); // 暴露主函数
    res.writeHead(200);
    res.end('OK');
  }
});

server.listen(3000, () => console.log('Webhook server listening on :3000'));
```

### 5. 多语言摘要

修改 `generateSummary()`：

```javascript
const languages = { zh: '中文', en: '英文', ja: '日文' };
const targetLang = languages[process.env.SUMMARY_LANG] || '中文';

const prompt = `请用${targetLang}总结这个项目的亮点...`;
```

---

## 📚 参考资源

- [GitHub Search API 文档](https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-repositories)
- [OpenRouter API 文档](https://openrouter.ai/docs)
- [OpenClaw 文档](https://openclaw.ai/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Feishu Bot 开发](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN)

---

**API 版本**: v1.0.0  
**最后更新**: 2025-03-08  
**维护者**: HR Agent - Skill Factory
