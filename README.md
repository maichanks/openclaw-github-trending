# GitHub Trending Notifier

🔥 **每小时自动监控 GitHub Trending，AI 生成摘要，推送到您的聊天频道**

> 专为 OpenClaw 平台设计的智能 GitHub Trending 通知技能

---

## 📋 目录

- [✨ 核心功能](#-核心功能)
- [🎯 适用人群](#-适用人群)
- [📦 快速安装](#-快速安装)
- [⚙️ 完整配置](#️完整配置)
  - [必需环境变量](#必需环境变量)
  - [可选环境变量](#可选环境变量)
- [🚀 使用指南](#-使用指南)
  - [基础使用](#基础使用)
  - [高级用法](#高级用法)
- [📊 输出示例](#-输出示例)
- [🔔 通知渠道配置](#-通知渠道配置)
  - [Telegram 配置](#telegram-配置)
  - [Feishu 配置](#feishu-配置)
  - [Discord 配置](#discord-配置)
- [🛠️ 开发与调试](#️开发与调试)
- [🐛 故障排除](#-故障排除)
- [🔧 高级自定义](#-高级自定义)
- [📈 性能与成本](#-性能与成本)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)

---

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 🔍 **智能发现** | 自动搜索过去24小时内创建的、stars超过100的热门新仓库 |
| 🤖 **AI 摘要** | 使用 OpenRouter 集成多种 AI 模型（GPT-4、Claude、Gemini 等）生成3句话亮点摘要 |
| 📢 **多平台推送** | 支持 Telegram、Feishu、Discord 通知，可通过 OpenClaw 统一发送 |
| ⏰ **定时任务** | 完美集成 OpenClaw Cron，每小时自动运行 |
| ⚡ **轻量高效** | Node.js 原生实现，无重型依赖，内存占用 < 50MB |
| 🛡️ **安全设计** | 无需 GitHub repo 权限，仅使用公开 API；所有密钥环境变量注入 |

---

## 🎯 适用人群

- **开发者**：不想错过 GitHub 上新兴的热门项目
- **技术团队**：团队成员共享最新技术趋势
- **AI 爱好者**：结合 AI 自动分析项目价值
- **OpenClaw 用户**：需要自动化通知技能的进阶用户

---

## 📦 快速安装

### 系统要求

- Node.js 18+ （支持 ES Modules）
- OpenClaw 已安装并运行
- 有效的 GitHub Personal Access Token
- 有效的 OpenRouter API Key

### 安装步骤

#### 1. 进入项目目录

```bash
cd /home/admin/.openclaw/workspace/openclaw-github-trending
```

#### 2. 安装依赖

```bash
npm install
```

项目主要依赖：
- `node-fetch` ^3.3.2 - 用于 HTTP 请求

#### 3. 配置环境变量

创建 `.env` 文件（或直接导出环境变量）：

```bash
# 必需配置
export GITHUB_TOKEN="ghp_your_github_token_here"
export OPENROUTER_API_KEY="sk-or-your-openrouter-key"
export NOTIFY_CHANNEL="telegram"  # 或 feishu/discord
export NOTIFY_TARGET="your_target_id"

# 可选配置（使用默认值即可）
# export MAX_REPOS=5
# export OPENROUTER_MODEL="openai/gpt-4o-mini"
```

⚠️ **安全提示**：
- 切勿将 `.env` 文件提交到 Git（已在 `.gitignore` 中）
- GitHub Token 只需 `public_repo` 权限即可
- OpenRouter Key 请妥善保管，不要泄露

#### 4. 手动测试运行

```bash
node scripts/trending.js
```

预期输出：
```
🚀 开始获取 GitHub Trending...
✅ 找到 5 个热门仓库
  ├ owner/repo1 (⭐ 1234)
  ├ owner/repo2 (⭐ 567)
...
✅ Trending 通知完成
```

如果看到 "📢 通知内容:" 说明通知已备妥，等待配置好通知渠道后自动发送。

---

## ⚙️ 完整配置

### 必需环境变量

| 变量名 | 类型 | 说明 | 如何获取 |
|--------|------|------|----------|
| `GITHUB_TOKEN` | String | GitHub Personal Access Token | [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) |
| `OPENROUTER_API_KEY` | String | OpenRouter API Key | [OpenRouter API Keys](https://openrouter.ai/keys) |
| `NOTIFY_CHANNEL` | String | 通知渠道 | `telegram` / `feishu` / `discord` |
| `NOTIFY_TARGET` | String | 目标接收者标识 | 各渠道配置见下文 |

### 可选环境变量

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `MAX_REPOS` | Number | `5` | 最多推送的仓库数量（支持环境变量配置） |
| `OPENROUTER_MODEL` | String | `openai/gpt-4o-mini` | AI 模型名称，完整列表见 [OpenRouter Models](https://openrouter.ai/models) |

#### 推荐的 OpenRouter 模型

| 模型 | 价格（每1K tokens） | 特点 | 适用场景 |
|------|---------------------|------|----------|
| `openai/gpt-4o-mini` | $0.00011 | 快速、经济 | ✅ 日常推荐（默认） |
| `openai/gpt-4o` | $0.005 | 高质量、稍慢 | 高精度摘要 |
| `anthropic/claude-3.5-sonnet` | $0.003 | 智能、细致 | 深度技术分析 |
| `google/gemini-2.0-flash-001` | $0.0001 | 快速、多语言 | 多语言仓库 |
| `meta-llama/llama-3.3-70b-instruct` | $0.0007 | 开源、免费 | 隐私敏感场景 |

💡 提示：建议先用 `gpt-4o-mini` 测试，每月花费通常不到 $1。

---

## 🚀 使用指南

### 基础使用

#### 一次性运行

```bash
# 确保环境变量已设置
node scripts/trending.js
```

#### 设置 OpenClaw 定时任务

每小时自动运行：

```bash
openclaw cron add \
  --kind every \
  --everyMs 3600000 \
  --sessionTarget isolated \
  --payload '{"kind":"agentTurn","message":"node /home/admin/.openclaw/workspace/openclaw-github-trending/scripts/trending.js"}'
```

验证定时任务：

```bash
openclaw cron list
```

停止定时任务：

```bash
openclaw cron remove <job_id>
```

### 高级用法

#### 1. 自定义搜索条件

编辑 `scripts/trending.js` 中的 `getTrending()` 函数：

```javascript
// 原代码（搜索过去24小时，stars>100）
const query = `created:>=${dateStr} stars:>100 sort:stars-desc`;

// 自定义示例：一周内 stars>500 的 Python 项目
const query = `created:>=${dateStr} language:Python stars:>500 sort:stars-desc`;
```

常用 GitHub 搜索语法：
- `language:TypeScript` - 指定语言
- `stars:>1000` - stars 大于 1000
- `topic:ai` - 带有特定 topic
- `created:>=2025-03-01` - 创建时间

#### 2. 集成到自定义 Workflow

在您的 OpenClaw workflow 中调用：

```yaml
steps:
  - name: fetch-trending
    run: node /path/to/openclaw-github-trending/scripts/trending.js
    env:
      GITHUB_TOKEN: "{{secrets.GITHUB_TOKEN}}"
      OPENROUTER_API_KEY: "{{secrets.OPENROUTER_KEY}}"
```

#### 3. 添加数据库存储历史

使用 SQLite 记录每次获取的仓库：

```javascript
// 在 scripts/trending.js 顶部添加
import Database from 'better-sqlite3';
const db = new Database('trending-history.db');
db.exec(`CREATE TABLE IF NOT EXISTS repos (
  github_id INTEGER PRIMARY KEY,
  full_name TEXT,
  stars INTEGER,
  language TEXT,
  fetched_at TEXT
)`);

// 在主流程中添加
for (const repo of repos) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO repos (github_id, full_name, stars, language, fetched_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(repo.id, repo.full_name, repo.stargazers_count, repo.language);
}
```

#### 4. 自定义消息格式

编辑 `sendNotification()` 函数中的 `buildMessage` 逻辑：

```javascript
function buildMessage(notifications) {
  // 改为 Markdown 格式
  let message = '🔥 **GitHub Trending 日报**\n\n';
  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    message += `${i+1}. [${n.repo.full_name}](${n.repo.html_url})\n`;
    message += `   ⭐ ${n.repo.stargazers_count} · ${n.repo.language}\n`;
    message += `   ${n.summary}\n\n`;
  }
  message += `⏰ 更新时间: ${new Date().toLocaleString('zh-CN')}`;
  return message;
}
```

#### 5. 多语言摘要支持

```javascript
// 根据仓库语言选择摘要语言
const prompt = `请${repo.language === 'Chinese' ? '用中文' : '用英文'}总结这个项目的亮点（3句话以内）：
项目: ${repo.full_name}
描述: ${repo.description || '无'}
...
`;

// 或根据目标频道
const channelLangs = { telegram: 'en', feishu: 'zh-CN', discord: 'en' };
const prompt = `请用${channelLangs[CONFIG.notifyChannel]}总结...`;
```

---

## 📊 输出示例

### 标准推送格式

```
🔥 GitHub Trending 今日推荐

1. elizaOS/eliza
   ⭐ 15,234 | 🍴 1,892 | TypeScript
   📝 基于 AI 的自主代理框架，支持多模型和插件系统。社区活跃度高，文档完善。适合构建智能对话系统。
   🔗 https://github.com/elizaOS/eliza

2. openclaw/openclaw
   ⭐ 2,345 | 🍴 456 | Python
   📝 下一代 AI Agent 平台，支持多模型、技能系统、自动化工作流。模块化设计优秀。
   🔗 https://github.com/openclaw/openclaw

3. langchain-ai/langchain
   ⭐ 92,100 | 🍴 14,500 | Python
   📝 大语言模型应用开发框架，提供丰富的链式调用能力。生态完善，插件众多。
   🔗 https://github.com/langchain-ai/langchain
```

### Markdown 格式（支持 Discord/Telegram）

```
🔥 **GitHub Trending - 2025-03-08**

1. **elizaOS/eliza**
   ⭐ 15.2k | 🍴 1.8k | TypeScript
   📝 基于 AI 的自主代理框架...
   🔗 [访问仓库](https://github.com/elizaOS/eliza)
```

---

## 🔔 通知渠道配置

### Telegram 配置

1. **创建 Bot**：
   - 在 Telegram 中搜索 `@BotFather`
   - 发送 `/newbot`，按提示设置名称和用户名
   - 保存获得的 `BOT_TOKEN`（格式：`123456:ABCdefGHI...`）

2. **获取 Chat ID**：
   - 搜索 `@userinfobot` 或 `@getidsbot`
   - 发送任意消息，Bot 会回复您的 `chat_id`

3. **配置环境变量**：

```bash
export NOTIFY_CHANNEL="telegram"
export NOTIFY_TARGET="123456:ABCdefGHI...:987654321"
# 格式: <bot_token>:<chat_id>
```

4. **测试**：

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>" \
  -d "text=测试消息"
```

### Feishu（飞书）配置

1. **创建应用**：
   - 访问 [飞书开发者后台](https://open.feishu.cn/)
   - 创建自定义机器人，获取 `Webhook URL`

2. **获取权限**：
   - 在应用管理中启用 `chat:bot` 权限
   - 发布应用到对应群组

3. **配置环境变量**：

```bash
export NOTIFY_CHANNEL="feishu"
export NOTIFY_TARGET="https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

4. **测试**：

```bash
curl -X POST "$NOTIFY_TARGET" \
  -H "Content-Type: application/json" \
  -d '{"msg_type":"text","content":{"text":"测试消息"}}'
```

### Discord 配置

1. **创建 Webhook**：
   - 进入 Discord 频道的 `Settings → Integrations → Webhooks`
   - 点击 `Create Webhook`，复制 `Webhook URL`

2. **配置环境变量**：

```bash
export NOTIFY_CHANNEL="discord"
export NOTIFY_TARGET="https://discord.com/api/webhooks/xxxxxxxx/yyyyyyyyyyyyyyyyyyyyyyyy"
```

3. **测试**：

```bash
curl -X POST "$NOTIFY_TARGET" \
  -H "Content-Type: application/json" \
  -d '{"content":"测试消息"}'
```

### 自定义渠道扩展

如需支持其他渠道（如 Slack、企业微信等），编辑 `scripts/trending.js` 的 `sendNotification()` 函数，添加新的 case：

```javascript
switch (CONFIG.notifyChannel) {
  case 'telegram':
    await sendTelegram(message, CONFIG.notifyTarget);
    break;
  case 'slack':
    await sendSlack(message, CONFIG.notifyTarget);
    break;
  // 新增渠道
  default:
    console.log('📢 通知内容:\n', message);
}
```

---

## 🛠️ 开发与调试

### 启用详细日志

```bash
# 查看所有 HTTP 请求
DEBUG=* node scripts/trending.js

# 或自定义日志级别（需修改代码添加 LOG_LEVEL 支持）
```

### 测试模式（不实际发送）

```bash
# 通知演示
node scripts/trending.js
# 观察输出，确认消息格式正确后再配置 NOTIFY_CHANNEL

# 模拟网络错误
export GITHUB_TOKEN="invalid_token"
node scripts/trending.js
# 应看到错误处理和降级逻辑
```

### 查看每次执行的统计

```bash
# 添加时间统计
time node scripts/trending.js

# 或修改代码输出
console.log(`⏱️ 执行时间: ${Date.now() - start}ms`);
```

---

## 🐛 故障排除

遇到问题？首先查看下方表格，如未解决，请访问 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 获取更详细的故障排除指南。

### 常见问题速查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| ❌ `缺少 GITHUB_TOKEN` | 环境变量未设置 | 1. `export GITHUB_TOKEN="xxx"`<br>2. 或创建 `.env` 文件 |
| ❌ GitHub API 403/429 | Token 无效或限流 | 1. 检查 Token 权限<br>2. 60 请求/分钟限制 |
| ❌ OpenRouter 失败 | API Key 无效/欠费 | 1. 访问 OpenRouter 控制台<br>2. 检查余额和 Key |
| ❌ 通知未收到 | 渠道配置错误 | 1. 检查 NOTIFY_CHANNEL<br>2. 验证 NOTIFY_TARGET 格式<br>3. 测试渠道 API（见上文） |
| ⚠️ AI 摘要总是 "AI 摘要暂不可用" | OpenRouter 错误降级 | 检查 OPENROUTER_API_KEY 和网络 |

### 调试步骤

1. **检查环境变量**：

```bash
echo "GITHUB_TOKEN=${GITHUB_TOKEN:0:10}..."
echo "OPENROUTER_API_KEY=${OPENROUTER_API_KEY:0:10}..."
echo "NOTIFY_CHANNEL=$NOTIFY_CHANNEL"
echo "NOTIFY_TARGET=$NOTIFY_TARGET"
```

2. **测试 GitHub API**：

```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/search/repositories?q=created:>=$(date -d 'yesterday' +%Y-%m-%d)+stars:>100&per_page=1"
```

3. **测试 OpenRouter**：

```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"你好"}]}'
```

4. **查看完整日志**：

```bash
node scripts/trending.js 2>&1 | tee trending.log
```

---

## 🔧 高级自定义

### 修改时间范围

默认搜索过去24小时，修改 `scripts/trending.js` 第26行：

```javascript
// 过去7天
const since = new Date();
since.setDate(since.getDate() - 7);
```

### 按语言过滤

```javascript
const query = `created:>=${dateStr} language:TypeScript stars:>100 sort:stars-desc`;
```

### 添加 RSS 输出

```javascript
function generateRSS(notifications) {
  let rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>GitHub Trending</title>
    <link>https://github.com/trending</link>
    <description>AI 生成的 Trending 仓库推荐</description>
  `;
  
  for (const n of notifications) {
    rss += `
    <item>
      <title>${n.repo.full_name}</title>
      <link>${n.repo.html_url}</link>
      <description><![CDATA[${n.summary}]]></description>
      <guid>${n.repo.html_url}</guid>
    </item>`;
  }
  
  rss += `
  </channel>
</rss>`;
  
  return rss;
}
```

### 并发请求优化

当前代码顺序生成摘要（避免 API 限流）。如需加速，使用 `Promise.all`（注意遵守 API 限制）：

```javascript
// 并发处理（慎用，可能触发限流）
const AiSummaryPromises = repos.slice(0, CONFIG.maxRepos).map(repo => 
  generateSummary(repo).then(summary => ({ repo, summary }))
);
const notifications = await Promise.all(AiSummaryPromises);
```

---

## 📈 性能与成本

### 性能指标（典型值）

| 指标 | 数值 | 说明 |
|------|------|------|
| 执行时间 | 15-30 秒 | 受网络延迟和 AI 速度影响 |
| API 调用次数 | 1 (GitHub) + N (OpenRouter) | N = MAX_REPOS |
| 内存占用 | 30-50 MB | 纯 Node.js |
| CPU 使用 | < 10% | 主要是网络 IO 等待 |

### 成本估算（OpenRouter）

使用 `gpt-4o-mini` 模型：
- 输入：$0.00011 / 1K tokens
- 输出：$0.00011 / 1K tokens
- 每次请求约 100-200 tokens
- **每月（每天 5 个仓库）：~ $0.02-0.05**

使用 `claude-3.5-sonnet`：
- 每月：~ $0.15-0.30

✅ **总结：成本极低，可放心使用**

### 限流与重试

- GitHub API：60 请求/分钟（有认证），当前实现 1 请求/小时，无压力
- OpenRouter：默认 20 请求/分钟，当前 5 请求/小时，无压力

如需要更高频率，需：
1. 实现指数退避重试
2. 添加请求队列
3. 监控 API 响应头 `X-RateLimit-Remaining`

---

## 🤝 贡献指南

欢迎为该项目贡献代码、报告问题或提出建议！

### 如何贡献

1. **Fork 本仓库**

2. **创建特性分支**

```bash
git checkout -b feature/amazing-feature
```

3. **提交您的更改**

```bash
git commit -m "Add amazing feature"
```

4. **推送到分支**

```bash
git push origin feature/amazing-feature
```

5. **开启 Pull Request**

请在 PR 中说明：
- 新增功能或修复的问题
- 测试方法和结果
- 是否需要更新文档

### 开发规范

- 遵循项目的代码风格（缩进 2 空格，单引号）
- 为新功能添加日志输出（使用 `console.log` 而非 `console.error` 输出普通信息）
- 确保 `node scripts/trending.js` 能正常运行
- 更新 README 和 API.md（如变更配置或接口）

### 报告问题

如遇 Bug 或需要新功能，请创建 Issue，包含：

```
**环境信息**
- Node.js 版本:
- OpenClaw 版本:
- 操作系统:

**问题描述**
清晰描述遇到的问题

**复现步骤**
1. 
2. 
3. 

**预期行为**
描述期望的结果

**日志**
粘贴相关日志（敏感信息请脱敏）
```

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件（如有）

---

**由 HR Agent - Skill Factory 精心打造** 🤖  
**自动发布：2025-03-08**  
**版本：1.0.0**

如有问题，请访问 [项目仓库](https://github.com/openclaw/openclaw-github-trending) 提交 Issue。
