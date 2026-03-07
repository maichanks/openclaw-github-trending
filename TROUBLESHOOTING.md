# Troubleshooting Guide - GitHub Trending Notifier

🔧 **故障排除与调试完整指南**

本指南帮助您快速诊断和解决 GitHub Trending Notifier 的所有常见问题。

---

## 📋 目录

1. [快速诊断流程图](#快速诊断流程图)
2. [常见问题速查表](#常见问题速查表)
3. [详细故障排除](#详细故障排除)
   - [环境变量配置问题](#环境变量配置问题)
   - [GitHub API 问题](#github-api-问题)
   - [OpenRouter API 问题](#openrouter-api-问题)
   - [通知渠道问题](#通知渠道问题)
   - [OpenClaw 集成问题](#openclaw-集成问题)
   - [性能与限流问题](#性能与限流问题)
4. [调试技巧与工具](#调试技巧与工具)
5. [日志解读](#日志解读)
6. [性能优化建议](#性能优化建议)
7. [安全故障排查](#安全故障排查)
8. [FAQ](#faq)

---

## 快速诊断流程图

```
启动脚本
   │
   ├─→ 缺少配置错误？ ────→ 检查环境变量 → 修复 → 重新运行
   │        │
   │        ✗
   │        ↓
   ├─→ GitHub API 失败？ ────→ 检查 Token/网络 → 修复 → 重新运行
   │        │
   │        ✗
   │        ↓
   ├─→ OpenRouter 失败？ ────→ 检查 API Key/余额 → 修复或换模型 → 重新运行
   │        │
   │        ✗
   │        ↓
   ├─→ 通知未收到？ ────────→ 检查渠道配置 → 测试 API → 修复 → 重新运行
   │        │
   │        ✗
   │        ↓
   ✅ 运行成功，通知已发送
```

---

## 常见问题速查表

| 问题现象 | 优先级 | 可能原因 | 快速解决方案 |
|----------|--------|----------|--------------|
| ❌ `缺少 GITHUB_TOKEN` | 🔴 高 | 环境变量未设置 | 1. `export GITHUB_TOKEN="xxx"`<br>2. 或创建 `.env` 文件 |
| ❌ GitHub API 返回 401/403 | 🔴 高 | Token 无效或无权限 | 1. 重新生成 GitHub PAT<br>2. 赋予 `public_repo` 权限<br>3. 检查 Token 是否过期 |
| ❌ GitHub API 返回 429 | 🟡 中 | 触发速率限制 | 1. 降低频率<br>2. 或等待 60 秒后重试<br>3. 检查其他应用是否共用 Token |
| ❌ OpenRouter 失败 | 🔴 高 | API Key 无效或欠费 | 1. 访问 [OpenRouter Keys](https://openrouter.ai/keys)<br>2. 检查账户余额<br>3. 确认 Key 格式正确（`sk-or-...`） |
| ❌ 通知未收到 | 🟡 中 | 渠道配置错误 | 1. 验证 `NOTIFY_CHANNEL`<br>2. 测试渠道 API（见下文）<br>3. 检查 OpenClaw 消息系统 |
| ⚠️ AI 摘要总是 "AI 摘要暂不可用" | 🟡 中 | OpenRouter 持续失败 | 1. 尝试换模型<br>2. 检查网络连接<br>3. 联系 OpenRouter 支持 |
| ⚠️ 执行时间过长（> 60秒） | 🟡 中 | 网络延迟或模型慢 | 1. 换用 `gpt-4o-mini`<br>2. 使用国内镜像<br>3. 减少 `MAX_REPOS` |
| ⚠️ 无新仓库数据 | 🟢 低 | 过去24小时无 stars>100的新仓库 | 正常现象，降低阈值或等待 |
| ⚠️ 内存占用过高（> 100MB） | 🟡 中 | 其他进程占用 | 重启脚本，检查 Node.js 版本 |

---

## 详细故障排除

### 环境变量配置问题

#### 症状：`❌ 缺少 GITHUB_TOKEN` 或类似错误

**原因分析：**
1. 环境变量未导出
2. `.env` 文件未加载（脚本使用 `require('dotenv').config()`）
3. 变量名拼写错误

**诊断步骤：**

```bash
# 1. 检查环境变量是否设置
echo $GITHUB_TOKEN
echo $OPENROUTER_API_KEY
echo $NOTIFY_CHANNEL
echo $NOTIFY_TARGET

# 2. 检查 .env 文件
ls -la .env
cat .env | grep -v "^#" | grep .

# 3. 测试 Node.js 能读取到吗
node -e "console.log(process.env.GITHUB_TOKEN ? 'OK' : 'MISSING')"
```

**解决方案：**

```bash
# 方法 1：临时导出（当前终端有效）
export GITHUB_TOKEN="ghp_xxx"
export OPENROUTER_API_KEY="sk-or-xxx"
export NOTIFY_CHANNEL="telegram"
export NOTIFY_TARGET="bot_token:chat_id"

# 方法 2：写入 .env 文件（推荐）
cat > .env << EOF
GITHUB_TOKEN=ghp_xxx
OPENROUTER_API_KEY=sk-or-xxx
NOTIFY_CHANNEL=telegram
NOTIFY_TARGET=bot_token:chat_id
MAX_REPOS=5
OPENROUTER_MODEL=openai/gpt-4o-mini
EOF

# 重新运行
node scripts/trending.js
```

**验证：**

```bash
# 检查 .env 格式是否正确
node -e "require('dotenv').config(); console.log('githubToken:', process.env.GITHUB_TOKEN ? 'SET' : 'MISSING')"
```

---

### GitHub API 问题

#### 症状：`GitHub API: 401` 或 `GitHub API: 403`

**401 Unauthorized**：Token 无效或未提供

**403 Forbidden**：
- Token 无权限
- IP 被限制
- 已达到速率限制

**诊断：**

```bash
# 测试 GitHub API 直接调用
curl -I -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/user"
```

预期响应：
- `200 OK`：Token 有效
- `401 Unauthorized`：Token 无效
- `403 Forbidden`：权限不足或限流

**解决方案：**

1. **重新生成 GitHub PAT**：
   - 访问 https://github.com/settings/tokens
   - 点击 `Generate new token (classic)`
   - 选择 `public_repo` 权限（勾选即可）
   - 复制新 Token，替换 `GITHUB_TOKEN`

2. **检查 Token 格式**：
   ```bash
   # Token 应以 ghp_、gho_、ghp_、ghu_ 等开头
   echo $GITHUB_TOKEN | head -c 4
   # 应为 "ghp_" 或类似
   ```

3. **速率限制检查**：
   ```bash
   curl -I -H "Authorization: token $GITHUB_TOKEN" \
     "https://api.github.com/rate_limit"
   ```

   查看响应头：
   ```
   X-RateLimit-Limit: 60
   X-RateLimit-Remaining: 58
   X-RateLimit-Reset: 1702000000
   ```

   如果 `Remaining` 为 0，需等待到 `Reset` 时间。

#### 症状：`GitHub API: 404` 或 `422`

**404**：搜索关键词可能不合法，检查 `q` 参数编码。

**422 Unprocessable Entity**：搜索语法错误。检查代码中的日期格式。

**诊断：**

```bash
# 手动构造查询 URL（替换为今天的日期）
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/search/repositories?q=created:%3E%3D2025-03-08+stars:>100&per_page=1"
```

**解决方案：**
- 确保日期格式为 `YYYY-MM-DD`
- URL 编码正确（`:` 应编码为 `%3A`，`>` 应编码为 `%3E`）

---

### OpenRouter API 问题

#### 症状：`AI 摘要暂不可用` 或 `OpenRouter 失败`

**原因：**
1. API Key 无效/过期
2. 账户余额不足
3. 网络连接问题
4. 模型名称错误

**诊断：**

```bash
# 1. 测试 OpenRouter 认证
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: https://openclaw.ai" \
  -H "X-Title: OpenClaw HR Agent" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"你好"}]}'
```

**预期响应：**
- `200 OK` + JSON：Key 有效
- `401 Unauthorized`：Key 无效
- `402 Payment Required`：余额不足
- `429 Too Many Requests`：限流（20 请求/分钟）

**解决方案：**

1. **401 错误**：
   - 访问 https://openrouter.ai/keys
   - 复制新 Key，更新 `OPENROUTER_API_KEY`
   - 确保 Key 格式：`sk-or-xxxxx` 或 `sk-...`

2. **402 余额不足**：
   - 访问 https://openrouter.ai/account/usage
   - 充值或选择免费模型（如 `meta-llama/llama-3.3-70b-instruct`）

3. **429 限流**：
   - 当前实现 5 请求/小时，无需担心
   - 如果修改代码提高频率，确保 < 20 请求/分钟
   - 添加重试逻辑（指数退避）

4. **模型不存在**：
   ```bash
   # 查看可用模型
   curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     "https://openrouter.ai/api/v1/models"
   ```
   - 确认 `OPENROUTER_MODEL` 与返回的 `id` 完全匹配

5. **网络问题**：
   ```bash
   # 测试连通性
   ping -c 3 openrouter.ai
   curl -I https://openrouter.ai
   ```

   - 如网络受限，使用代理或配置系统网络

---

### 通知渠道问题

#### Telegram

**症状：消息未收到，但脚本无错误**

**诊断：**

```bash
# 1. 验证 Bot Token 和 Chat ID 格式
echo "NOTIFY_TARGET=$NOTIFY_TARGET"
# 格式应为：BOT_TOKEN:CHAT_ID
# 例如：123456:ABCdefGHIxyz

IFS=':' read -r botToken chatId <<< "$NOTIFY_TARGET"
echo "Bot Token: $botToken"
echo "Chat ID: $chatId"
```

```bash
# 2. 测试 Bot API
curl -X POST "https://api.telegram.org/bot/$botToken/sendMessage" \
  -d "chat_id=$chatId" \
  -d "text=测试消息来自GitHub Trending Notifier"
```

**预期响应：**
- `{"ok":true,...}`：成功
- `{"ok":false,"error_code":401,"description":"Unauthorized"}`：Bot Token 无效
- `{"ok":false,"error_code":403,"description":"Forbidden: bot was blocked by the user"}`：用户屏蔽了 Bot

**解决方案：**

1. **Bot Token 无效**：
   - 重新创建 Bot：Telegram 搜索 `@BotFather`
   - `/newbot` → 按提示设置
   - 复制新 Token，更新 `NOTIFY_TARGET`

2. **Chat ID 错误**：
   - 搜索 `@userinfobot` 或 `@getidsbot` 获取正确 Chat ID
   - 或让 Bot 主动获取：
     ```bash
     curl "https://api.telegram.org/bot$botToken/getUpdates"
     ```
     发送一条消息给 Bot 后，查看 `message.chat.id`

3. **Bot 被屏蔽**：
   - 在 Telegram 中找到 Bot，点击 `Start` 或发送 `/start`
   - 解除屏蔽

4. **群组权限**：
   - 在群组设置中，确保 Bot 有 `Send Messages` 权限

#### Feishu（飞书）

**症状：消息未收到或返回错误**

**诊断：**

```bash
# 1. 检查 Webhook URL 格式
echo $NOTIFY_TARGET
# 应为：https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx

# 2. 测试发送
curl -X POST "$NOTIFY_TARGET" \
  -H "Content-Type: application/json" \
  -d '{"msg_type":"text","content":{"text":"测试消息"}}'
```

**预期响应：**
- `{"Extra":null,"StatusCode":0,"StatusMessage":"success"}`：成功
- `{"StatusCode":999916,"StatusMessage":"invalid token"}`：Webhook 无效

**解决方案：**

1. **Webhook 无效**：
   - 进入飞书开发者后台
   - 重新创建机器人，复制新 Webhook URL
   - 更新 `NOTIFY_TARGET`

2. **应用未发布**：
   - 在「版本管理与发布」中，发布应用到对应群组
   - 确认 Bot 已加入目标群组

3. **权限不足**：
   - 在「权限管理」中，添加 `chat:bot` 权限
   - 重新发布应用

4. **网络限制**：
   - 检查服务器是否能访问 `open.feishu.cn`
   - 如使用代理，确保 `curl` 能通过代理访问

#### Discord

**诊断：**

```bash
# 测试 Webhook
curl -X POST "$NOTIFY_TARGET" \
  -H "Content-Type: application/json" \
  -d '{"content":"测试消息","username":"Trending Bot"}'
```

**预期响应：** `HTTP 204 No Content`

**常见错误：**
- `404 Not Found`：Webhook URL 错误或已被删除
- `400 Bad Request`：JSON 格式错误

**解决方案：**
1. 重新生成 Webhook（Discord Channel Settings → Integrations → Webhooks）
2. 确保消息格式符合 Discord API 要求（不能过长，避免特殊字符）

---

### OpenClaw 集成问题

#### 症状：脚本运行成功，但 OpenClaw 未发送通知

**原因：** 脚本依赖 OpenClaw 注入的全局 `message` 对象，如不在 OpenClaw 环境中运行，会降级到 `console.log`。

**诊断：**

```bash
# 检查是否在 OpenClaw 环境中
node -e "console.log(typeof message, typeof message !== 'undefined' && message.send)"
# 预期输出：undefined undefined（外部环境）
# OpenClaw 中会输出：object true
```

**解决方案：**

**方案 A：通过 OpenClaw Cron 触发（推荐）**

```bash
openclaw cron add \
  --kind every \
  --everyMs 3600000 \
  --sessionTarget isolated \
  --payload '{"kind":"agentTurn","message":"node /home/admin/.openclaw/workspace/openclaw-github-trending/scripts/trending.js"}'
```

**方案 B：在 OpenClaw Agent 会话中运行**

```bash
openclaw session create
# 在交互式会话中运行
node scripts/trending.js
```

**方案 C：自行实现消息发送（独立运行）**

修改 `scripts/trending.js` 的 `sendNotification()` 函数，使用原生 HTTP 调用：

```javascript
async function sendNotification(notifications) {
  const message = buildMessage(notifications);
  
  // 使用原生 fetch 直接发送
  switch (CONFIG.notifyChannel) {
    case 'telegram':
      await fetch(`https://api.telegram.org/bot${CONFIG.notifyTarget.split(':')[0]}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CONFIG.notifyTarget.split(':')[1], text: message })
      });
      break;
    // ... 其他渠道
    default:
      console.log(message);
  }
}
```

---

### 性能与限流问题

#### 症状：执行时间过长（> 60 秒）

**原因分析：**
- AI 模型响应慢（如 `gpt-4`）
- 网络延迟高
- 串行请求（每个仓库等待 1 秒）

**诊断：**

```bash
# 计时运行
time node scripts/trending.js

# 或添加时间输出到脚本
echo "Start: $(date +%s)"
node scripts/trending.js
echo "End: $(date +%s)"
```

**优化建议：**

1. **换用更快模型**：
   ```bash
   export OPENROUTER_MODEL="openai/gpt-4o-mini"
   ```

2. **减少仓库数量**：
   ```bash
   # 修改代码或降低阈值（编辑 trending.js 第 12 行）
   maxRepos: 3  // 改为 3
   ```

3. **实现并发请求**（注意限流）：
   ```javascript
   // 并发处理，但限制并发数
   const pLimit = require('p-limit');
   const limit = pLimit(3); // 最大 3 并发
   
   const tasks = repos.map(repo => limit(() => generateSummary(repo)));
   const summaries = await Promise.all(tasks);
   ```

4. **添加超时控制**：
   ```javascript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s 超时
   
   const response = await fetch(url, { signal: controller.signal });
   clearTimeout(timeoutId);
   ```

#### 症状：API 限流（429）

**GitHub 限流**：60 请求/分钟（认证后）
**OpenRouter 限流**：默认 20 请求/分钟

**解决：**
- 当前实现频率极低，无需担心
- 如需提高频率，添加重试和延迟
- 监控限流响应头，动态调整

---

## 调试技巧与工具

### 1. 启用详细输出

**修改脚本添加调试：**

```javascript
// 在文件顶部添加
const DEBUG = process.env.DEBUG ? process.env.DEBUG.split(',') : [];

function debug(...args) {
  if (DEBUG.includes('http') || DEBUG.includes('all')) {
    console.log('[DEBUG]', ...args);
  }
}

// 在 fetch 调用前后添加
debug('Fetching:', url);
```

**运行：**

```bash
DEBUG=http,all node scripts/trending.js
```

### 2. 使用日志文件

```bash
# 记录所有输出
node scripts/trending.js 2>&1 | tee /tmp/trending-$(date +%Y%m%d-%H%M).log

# 查看最近的日志
ls -lt /tmp/trending-*.log

# 搜索错误
grep -i "error\|failed\|❌" /tmp/trending-*.log
```

### 3. 分段测试

```bash
# 只测试 GitHub API
node -e "import('./scripts/trending.js').then(m => m.getTrending()).then(console.log).catch(console.error)"

# 只测试 OpenRouter
node -e "
import('./scripts/trending.js').then(m => 
  m.generateSummary({
    full_name: 'test/repo',
    description: 'Test project',
    language: 'JavaScript',
    stargazers_count: 100,
    forks_count: 10
  }).then(console.log).catch(console.error)
);
"

# 只测试通知发送
node -e "import('./scripts/trending.js').then(m => m.sendNotification([{repo:{full_name:'test'}, summary:'test'}]))"
```

### 4. 网络诊断

```bash
# 测试 GitHub 连通性
curl -o /dev/null -s -w "GitHub: %{http_code}\n" https://api.github.com

# 测试 OpenRouter 连通性
curl -o /dev/null -s -w "OpenRouter: %{http_code}\n" https://openrouter.ai

# 测试 Telegram 连通性
curl -o /dev/null -s -w "Telegram: %{http_code}\n" https://api.telegram.org

# 查看 DNS
nslookup api.github.com
nslookup openrouter.ai

# 查看路由
traceroute api.github.com
```

---

## 日志解读

### 正常日志示例

```
🚀 开始获取 GitHub Trending...
✅ 找到 5 个热门仓库
  ├ elizaOS/eliza (⭐ 15234)
  ├ openclaw/openclaw (⭐ 2345)
  ├ langchain-ai/langchain (⭐ 92100)
  ├ vercel/next.js (⭐ 120000)
  ├ facebook/react (⭐ 218000)
✅ Trending 通知完成
```

**解读：**
- 前 3 行：正常启动和数据获取
- 中间：5 个仓库的摘要正在生成（每行一个）
- 最后：成功发送通知

### 错误日志示例 1：配置缺失

```
❌ 缺少 GITHUB_TOKEN
```

**含义**：`GITHUB_TOKEN` 环境变量未设置。

**解决**：设置环境变量或创建 `.env` 文件。

### 错误日志示例 2：GitHub API 失败

```
❌ 获取 trending 失败: GitHub API: 403
```

**含义**：GitHub API 返回 403。

**排查**：
1. 检查 Token 格式和权限
2. 检查速率限制：`curl -I -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit`
3. 检查 IP 是否被封禁

### 错误日志示例 3：OpenRouter 失败

```
❌ AI 生成摘要失败: Invalid API key
```

**含义**：OpenRouter API Key 无效。

**排查**：
1. 访问 OpenRouter 控制台验证 Key
2. 重新生成 Key
3. 检查网络连接（ domestic proxy 可能需要）

### 错误日志示例 4：通知降级

```
📢 通知内容:

🔥 GitHub Trending 今日推荐
...
```

**含义**：通知未通过渠道发送，而是输出到控制台。

**原因**：
- 不在 OpenClaw 环境中
- `NOTIFY_CHANNEL` 设置错误
- OpenClaw `message` 对象不可用

**解决**：
- 配置 OpenClaw Cron，或
- 修改代码使用原生 HTTP 发送

---

## 性能优化建议

### 1. 减少 API 调用

**问题**：为每个仓库都调用 OpenRouter，成本累积。

**优化**：
- 降低 `MAX_REPOS` 到 3
- 缓存 AI 摘要（如果仓库之前已处理过）

```javascript
const cache = new Map();
if (cache.has(repo.full_name)) {
  summary = cache.get(repo.full_name);
} else {
  summary = await generateSummary(repo);
  cache.set(repo.full_name, summary);
}
```

### 2. 使用更快的模型

| 模型 | 响应速度 | 成本 | 推荐度 |
|------|----------|------|--------|
| gpt-4o-mini | ~3s | $0.00011/K | ✅ 最佳 |
| gemini-flash | ~2s | $0.0001/K | ✅ 最快 |
| llama-3.3-70b | ~8s | 较低 | ⚠️ 较慢 |

### 3. 增量更新

仅在仓库确实是新的时才生成摘要（避免重复处理）。

```javascript
const processed = new Set(JSON.parse(localStorage.getItem('processed') || '[]'));
if (!processed.has(repo.full_name)) {
  await generateSummary(repo);
  processed.add(repo.full_name);
  localStorage.setItem('processed', JSON.stringify([...processed]));
}
```

### 4. 使用本地模型（高级）

如担心 API 成本或隐私，可本地运行小型模型（推荐 `llama.cpp` 或 `vllm`）。

---

## 安全故障排查

### 1. Token 泄露

**症状**：发现 Token 已提交到 Git 历史或公开。

**立即行动：**
1. 撤销 Token（GitHub/OpenRouter 控制台）
2. 生成新 Token
3. 使用 `git filter-branch` 或 `BFG` 清理历史（如已提交）
4. 检查 `.gitignore` 是否包含 `.env`

### 2. 意外高费用

**监控：**
- OpenRouter：https://openrouter.ai/account/usage
- GitHub：免费，无费用

**防范：**
- 设置 OpenRouter 预算提醒
- 使用较便宜的模型（`gpt-4o-mini`）
- 限制 `MAX_REPOS` 和运行频率

### 3. 权限最小化

- GitHub Token：仅需 `public_repo`（公开仓库读取）
- OpenRouter Key：无特殊权限，但关联计费
- 通知渠道：Bot 仅需发送消息权限

---

## FAQ

### Q1: 能每天只运行一次吗？

A: 可以，将 OpenClaw Cron 改为每天运行：

```bash
openclaw cron add --kind cron --cron "0 9 * * *" ...
# 每天上午9点运行
```

### Q2: 能获取每周/monthly trending 吗？

A: 可以，编辑 `getTrending()` 中的日期逻辑：

```javascript
// 过去一周
const since = new Date();
since.setDate(since.getDate() - 7);
```

### Q3: 能同时推送到多个渠道吗？

A: 可以，修改 `sendNotification()` 添加多个渠道：

```javascript
await sendTelegram(message, telegramTarget);
await sendFeishu(message, feishuTarget);
await sendDiscord(message, discordTarget);
```

### Q4: 能自定义消息模板吗？

A: 可以，编辑 `buildMessage()` 函数（当前内联在 `sendNotification` 中）。

### Q5: 脚本能作为独立服务运行吗？

A: 可以，配合 PM2 或 systemd：

```bash
# PM2
pm2 start scripts/trending.js --name github-trending --cron "0 * * * *"

# systemd
# 创建 /etc/systemd/system/github-trending.service
```

### Q6: 如何处理私有仓库？

A: GitHub Search API 默认只搜索公开仓库。如需私有仓库，需要：
1. Token 有 `repo` 权限
2. 修改搜索查询：`q=user:your-org created:>=...`（搜索组织内）

### Q7: 能集成到 Slack 吗？

A: 可以，参考「通知渠道配置 - 自定义渠道扩展」，添加 Slack Webhook 支持。

### Q8: OpenRouter 有免费额度吗？

A: 部分模型免费（如 `meta-llama/llama-3.3-70b-instruct`），但有限流。详细查看 OpenRouter 控制台。

### Q9: 如 OpenRouter 宕机怎么办？

A: 脚本已实现降级，AI 摘要会显示 `'AI 摘要暂不可用'`，其他功能正常。

### Q10: 如何彻底禁用 AI 摘要（仅推送仓库列表）？

A: 修改 `generateSummary()` 始终返回固定文本：

```javascript
async function generateSummary(repo) {
  return '暂无 AI 摘要（已禁用）'; // 或 ''
}
```

---

## 更多帮助

如本指南未解决您的问题：

1. **查看项目 Issues**：https://github.com/openclaw/openclaw-github-trending/issues
2. **OpenClaw 社区**：https://openclaw.ai/community
3. **OpenRouter 支持**：https://openrouter.ai/support
4. **GitHub API 文档**：https://docs.github.com/en/rest

---

**祝您使用愉快！** 🎉

如有其他问题，欢迎提交 Issue 或 PR 改进本指南。
