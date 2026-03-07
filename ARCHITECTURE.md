# GitHub Trending Notifier Skill - Architecture Design

**Role:** Designer
**Date:** 2026-03-08
**Project:** GitHub Trending Notifier Skill
**Based on:** Researcher Report (`memory/projects/researcher_report_github_trending.json`)

---

## 1. 功能规格 (Functional Specifications)

### 1.1 核心功能

#### 1.1.1 趋势数据获取
- ✅ **多源数据采集**
  - GitHub Official Trending API (daily/weekly/monthly)
  - GitHub Search API (按 stars、创建时间、语言过滤)
  - 备选数据源：GH Archive、 Libraries.io
- ✅ **智能过滤引擎**
  - 基于 Researcher 报告的关键词过滤：AI agents, OpenClaw, Neovim plugins, Python automation, TypeScript frameworks, Rust tools, LLM applications, Developer productivity
  - 可配置的热门领域匹配：AI/ML工具链、浏览器自动化、知识管理、代码助手、DevOps工具
  - 动态阈值：stars增长速率、fork比例、issue活跃度
- ✅ **定时抓取**
  - 默认：每小时一次（可配置）
  - 支持 cron 表达式自定义
  - 增量更新机制，避免重复推送

#### 1.1.2 AI 智能分析
- ✅ **亮点摘要生成 (OpenRouter)**
  - 多模型支持：openai/gpt-4o-mini, anthropic/claude-3.5-sonnet, meta-llama/llama-3.2-3b-instruct
  - 提示词模板：
    ```
    你是一个技术趋势分析师。请用中文（简练，3-5句话）总结以下 GitHub 项目的亮点：
    - 项目名称与描述
    - 核心技术栈
    - 创新点/解决的问题
    - 适用场景
    - 潜在学习价值
    ```
  - 输出格式：纯文本摘要 + 标签（如"AI Agent"、"自动化"、"生产力工具"）
- ✅ **相关性评分**
  - 计算项目与目标关键词/领域的匹配度 (0-100)
  - 基于：关键词密度、主题分类、stars/fork比例、更新频率
- ✅ **趋势预测 (可选)**
  - 基于历史增长曲线预测未来 7 天趋势
  - 标记 "rising star" (增长速率 > 10%/天)

#### 1.1.3 通知推送
- ✅ **多通道支持**
  - Telegram Bot API
  - Feishu 机器人 / 群聊
  - Discord Webhook
  - Email (SMTP)
  - Slack Incoming Webhook
- ✅ **消息模板**
  - 简洁模式：编号 + 项目名 + stars + 摘要 + 链接 (适合 Telegram/Discord)
  - 卡片模式：富文本卡片（Feishu专用，包含图标、颜色标签、按钮）
  - 摘要模式：每日/每周聚合报告（Top 10）
- ✅ **可配置规则**
  - 最低 stars 阈值 (默认 100)
  - 最低相关性评分 (默认 70)
  - 按语言/领域白名单过滤
  - 智能去重（同一项目 24h 内不重复推送）

#### 1.1.4 数据持久化
- ✅ **本地数据库 (SQLite)**
  - `repos`: 项目元数据 (id, name, url, stars, forks, language, topics, created_at, updated_at)
  - `notifications`: 推送历史 (repo_id, channel, target, sent_at, status)
  - `user_preferences`: 用户配置 (filter_keywords, min_stars, channels, schedule)
- ✅ **状态追踪**
  - 记录每个项目的 last_seen_at, trend_score, growth_rate
  - 支持 "已读/已忽略" 标记（防骚扰）

---

### 1.2 非功能性需求

| 类别 | 要求 |
|------|------|
| **性能** | 单次抓取 + 分析 < 5 分钟 (max 5 个项目); 支持并发 API 调用 |
| **可用性** | 99% 在线率; 失败重试机制 (exponential backoff, max 3 retries) |
| **可扩展性** | 模块化设计; 数据源插件化; 通知通道可扩展; 支持横向扩展 (future) |
| **可观测性** | 结构化日志 (JSON); 指标导出 (Prometheus format: requests_total, errors_total, latency_seconds) |
| **容错性** | API 限流检测 (X-RateLimit-* headers); 优雅降级 (AI 失败时发送原始数据) |
| **易用性** | 一键安装; 环境变量配置; 内置健康检查; 支持 dry-run 模式 |

---

## 2. 技术栈选型 (Technology Stack)

### 2.1 核心架构

```
┌──────────────────────────────────────────────────────────────┐
│                      OpenClaw Skill Framework               │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │   Scheduler  │→│  Fetcher     │→│   AI Analyzer     │  │
│  │  (cron/      │  │ (GitHub API) │  │ (OpenRouter API)  │  │
│  │   interval)  │  │              │  │                   │  │
│  └─────────────┘  └─────────────┘  └───────────────────┘  │
│         │                │                  │              │
│         └────────────────┼──────────────────┘              │
│                          ▼                                 │
│               ┌────────────────────┐                       │
│               │   Filter Engine    │                       │
│               │ (keyword + score)  │                       │
│               └────────────────────┘                       │
│                          │                                 │
│                          ▼                                 │
│               ┌────────────────────┐                       │
│               │   Notifier         │                       │
│               │ (multi-channel)    │                       │
│               └────────────────────┘                       │
│                          │                                 │
│                          ▼                                 │
│               ┌────────────────────┐                       │
│               │   Persistence      │                       │
│               │ (SQLite + JSON)    │                       │
│               └────────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 技术选型表

| 组件 | 技术选型 | 理由 |
|------|---------|------|
| **运行时** | Node.js 18+ LTS | 与 OpenClaw 生态一致; 成熟度高; async/await 适合 I/O 密集型任务 |
| **包管理** | npm (or yarn/pnpm) | 标准工具 |
| **HTTP Client** | `axios` 或 `got` | 支持 interceptors、retry、timeout 管理 |
| **数据库** | `better-sqlite3` (同步 API) 或 `sqlite3` (异步封装) | 轻量、零配置、嵌入式; 适合单机部署 |
| **调度器** | `node-cron` + 自定义 interval | cron 表达式灵活; interval 用于高频检查 |
| **AI 集成** | OpenRouter SDK (REST) | 多模型统一接口; 已有 API key |
| **日志** | `pino` 或 `winston` (JSON 格式) | 结构化日志; 性能优秀 |
| **配置** | `dotenv` + `convict` (schema validation) | 环境变量优先; 类型安全 |
| **测试** | Jest + Supertest | 单元测试 + API 集成测试 |
| **指标** | `prom-client` (Prometheus) | 标准监控格式; OpenClaw 可集成 |
| **通知通道** | `node-telegram-bot-api`, `@slack/web-api`, 直接 HTTP POST (Feishu/Discord) | 官方/社区 SDK 成熟 |

### 2.3 目录结构

```
openclaw-github-trending/
├── src/
│   ├── index.js              # Main entry, scheduler
│   ├── config/
│   │   ├── index.js          # Config loader & validation
│   │   └── schema.js         # Convict schema
│   ├── fetcher/
│   │   ├── github.js         # GitHub API client
│   │   ├── gharchive.js      # Optional: GH Archive fetch
│   │   └── libsio.js         # Optional: Libraries.io
│   ├── analyzer/
│   │   ├── openrouter.js     # AI summary & scoring
│   │   ├── filter.js         # Keyword/score filter
│   │   └── predictor.js      # Trend prediction (v2)
│   ├── notifier/
│   │   ├── base.js           # Abstract notifier
│   │   ├── telegram.js
│   │   ├── feishu.js
│   │   ├── discord.js
│   │   ├── email.js
│   │   └── slack.js
│   ├── persistence/
│   │   ├── database.js       # SQLite wrapper
│   │   ├── models/
│   │   │   ├── repo.js
│   │   │   ├── notification.js
│   │   │   └── preference.js
│   │   └── migrations/       # SQL migrations (optional)
│   ├── utils/
│   │   ├── logger.js         # Pino wrapper
│   │   ├── metrics.js        # Prometheus metrics
│   │   ├── retry.js          # Exponential backoff
│   │   └── rate-limiter.js   # GitHub API rate limit handler
│   └── health/
│       └── check.js          # /health endpoint (if HTTP server)
├── scripts/
│   ├── install.sh            # Install dependencies
│   ├── setup-db.js           # Initialize DB
│   └── backfill.js           # Historical data import
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example              # Config template
├── .env                      # Local secrets (gitignore)
├── package.json
├── README.md
├── SKILL.md                  # OpenClaw skill metadata
├── ARCHITECTURE.md           # This document
└── CHANGELOG.md
```

---

## 3. API 设计 (API Design)

### 3.1 内部模块接口

#### 3.1.1 Fetcher Interface

```javascript
// fetcher/github.js
class GitHubFetcher {
  async getTrending(options) {
    // options: { period: 'daily'|'weekly'|'monthly', language: string, max: number }
    // returns: Array<Repo>
    // throws: GitHubAPIError
  }

  async searchRepos(query, options) {
    // query: string (GitHub search syntax)
    // options: { sort: 'stars'|'updated', order: 'desc', per_page: number, page: number }
    // returns: { items: Array<Repo>, total_count: number }
  }

  async getRepo(owner, repo) {
    // returns: Repo (full metadata)
  }
}

// Repo 数据结构
{
  id: number,
  name: string,
  full_name: string,
  description: string | null,
  url: string,
  stars: number,
  forks: number,
  language: string | null,
  topics: string[],
  created_at: ISO8601,
  updated_at: ISO8601,
  pushed_at: ISO8601,
  owner: { login: string, avatar_url: string, type: 'User'|'Organization' }
}
```

#### 3.1.2 Analyzer Interface

```javascript
// analyzer/openrouter.js
class OpenRouterAnalyzer {
  constructor(config) {
    this.apiKey = config.openrouterKey;
    this.model = config.openrouterModel;
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  }

  async summarize(repo) {
    // Input: Repo object or minimal {name, description, language, stars}
    // Output: { summary: string, tags: string[], confidence: number (0-1) }
    // Throws: AIProviderError (falls back to 'AI 摘要暂不可用')
  }

  async score(repo, keywords) {
    // Compute relevance score (0-100) based on keywords
    // Output: { score: number, matched_keywords: string[] }
  }
}

// analyzer/filter.js
class FilterEngine {
  constructor(config) {
    this.minStars = config.minStars || 100;
    this.minScore = config.minScore || 70;
    this.keywords = config.keywords || []; // from researcher report
    this.blacklist = config.blacklist || [];
  }

  passes(repo, analysis) {
    // analysis: { score, tags, summary } from OpenRouterAnalyzer
    // returns: boolean, reason: string
  }
}
```

#### 3.1.3 Notifier Interface

```javascript
// notifier/base.js
abstract class BaseNotifier {
  constructor(config, channelConfig);
  async send(notification, options);
  async validateConfig(); // throws InvalidConfigError
}

// notification payload
{
  repo: Repo,
  analysis: { summary, tags, score },
  sent_at: timestamp,
  channel: 'telegram' | 'feishu' | ...,
  target: string // chat_id / webhook_url / email address
}

// Telegram implementation
class TelegramNotifier extends BaseNotifier {
  async send(payload) {
    // Format: text message with MarkdownV2
    // Parse mode: MarkdownV2 (escape special chars)
    // Buttons: [项目链接] [GitHub 打开]
  }
}

// Feishu implementation
class FeishuNotifier extends BaseNotifier {
  async send(payload) {
    // Format: Card message (interactive card)
    // Fields: 项目名称, 语言, Stars, 亮点摘要, 标签
    // Action: 打开链接 (primary button)
  }
}
```

#### 3.1.4 Persistence Interface

```javascript
// persistence/database.js
class Database {
  constructor(sqlitePath);
  
  // CRUD
  async upsertRepo(repo); // INSERT OR REPLACE
  async getRepo(id);
  async listRepos(filter);
  async saveNotification(notification);
  async getNotifications(repoId, limit);
  async setPreference(key, value);
  async getPreference(key, defaultValue);
}

// Models with validation
class Repo { /* ... */ }
class Notification { /* ... */ }
class Preference { /* ... */ }
```

### 3.2 外部 API 集成

#### 3.2.1 GitHub API

- **Base URL:** `https://api.github.com`
- **Authentication:** PAT in `Authorization: token <token>` header
- **Endpoints:**
  - `GET /search/repositories?q=...` (Search)
  - `GET /trending` (⚠️ Not official; use search with `created:>YYYY-MM-DD sort:stars` as fallback)
  - `GET /repos/{owner}/{repo}` (Detail)
- **Rate Limit:** 5000 req/h (authenticated); 60 req/m (IP)
- **Handling:** Read `X-RateLimit-Remaining`, `X-RateLimit-Reset`; backoff with `retry-js`

#### 3.2.2 OpenRouter API

- **Base URL:** `https://openrouter.ai/api/v1`
- **Authentication:** `Authorization: Bearer <OPENROUTER_API_KEY>`
- **Headers:** `HTTP-Referer`, `X-Title` (app identification)
- **Endpoint:** `POST /chat/completions`
- **Payload:** `{ model, messages: [{role, content}], max_tokens, temperature }`
- **Models:** `openai/gpt-4o-mini` (default), `anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.2-3b-instruct`
- **Rate Limit:** Varies by model (check OpenRouter dashboard)

#### 3.2.3 Notification Channels

| Channel | Auth | Payload | Rate Limit |
|---------|------|---------|------------|
| Telegram | `botToken` (HTTPS) | `sendMessage(chat_id, text, parse_mode, reply_markup)` | 30 msg/s |
| Feishu | Webhook URL (HMAC signature optional) | Card JSON (v2) | 10 req/s |
| Discord | Webhook URL | Embeds JSON | 5 req/s (per channel) |
| Email | SMTP (user/pass or OAuth2) | MIME message | Provider-dependent |
| Slack | `Bearer` token (Bot) | `chat.postMessage` with blocks | 1 msg/s (free tier) |

---

## 4. 安全考虑 (Security Considerations)

### 4.1 机密管理

| 密钥 | 用途 | 存储建议 | 泄露风险 |
|------|------|---------|----------|
| `GITHUB_TOKEN` | GitHub API 认证 | `.env` (chmod 600); 支持 fine-grained PAT (repo:public only) | 中 - 可读公开 repo; 避免 admin 权限 |
| `OPENROUTER_API_KEY` | OpenRouter 计费 | `.env` (chmod 600); 设置 OpenRouter 预算限制 | 中 - 产生费用; 需监控用量 |
| `TELEGRAM_BOT_TOKEN` | Telegram 发信 | `.env`; Bot token 可撤销 | 低 - 仅能发消息到 Bot 所在的 chats |
| `FEISHU_WEBHOOK_URL` | Feishu 机器人 | 环境变量或 OpenClaw 凭据管理器 | 低 - 仅能向指定群发消息 |
| `DISCORD_WEBHOOK_URL` | Discord 通知 | `.env`; Webhook 可删除重置 | 低 - 仅能向该 channel 发消息 |
| `SMTP_*` | Email 发送 | `.env`; App password 优于明文密码 | 中 - 可发送邮件; 使用应用专用密码 |

**最佳实践:**
- ✅ 所有 secrets 通过 `.env` 或 OpenClaw 凭据管理器注入
- ✅ `.env` 加入 `.gitignore`
- ✅ 生产环境使用 secrets 管理（Vault/环境变量注入）
- ✅ 密钥轮换策略：每 90 天更新一次
- ✅ 最小权限原则：GitHub Token 使用 `public_repo` 只读权限

### 4.2 API 安全

| 风险 | 措施 |
|------|------|
| GitHub API 滥用 | 使用 read-only PAT; 限制 IP (可选); 监控异常调用模式 |
| OpenRouter 费用爆炸 | 设置 monthly budget (OpenRouter console); 使用低成本模型默认; 限制 max_tokens |
| SSRF (fetching arbitrary URLs) | 仅允许 GitHub API 域名; 白名单验证 URL scheme (https) |
| 通知注入 (Telegram Markdown/HTML) | 对所有用户输入转义 (repo.description, summary); 使用 MarkdownV2 escape |
| Webhook URL 泄露 | 不记录 logs; 配置文件仅限 admin 可读 |

### 4.3 数据安全

- **SQLite 文件权限:** `chmod 600 database.db`
- **日志脱敏:** 避免记录 full API responses (especially tokens); sanitize before writing
- **数据保留策略:** 自动清理 180 天前的 notification records (可选 GDPR 合规)

### 4.4 部署安全

- **容器化 (推荐):** Docker image with non-root user
  ```dockerfile
  FROM node:18-alpine
  USER node
  COPY --chown=node:node . /app
  WORKDIR /app
  RUN npm ci --only=production
  CMD ["node", "src/index.js"]
  ```
- **网络安全:** 仅出站连接 (egress only); 无需入站端口
- **更新机制:** 定期更新 dependencies (npm audit); 使用 Dependabot

### 4.5 合规与审计

- **Open Source Compliance:** 所有依赖 SPDX 许可证兼容 (MIT, Apache-2.0, ISC)
- **Rate Limit Compliance:** 遵守 GitHub API TOS (no aggressive scraping)
- **Data Retention:** 明确隐私政策 (仅处理公开 GitHub data)
- **Audit Logging:** 记录配置变更、密钥轮换、异常错误

---

## 5. 质量保证 & 测试策略

### 5.1 测试类型

| 类型 | 工具 | 覆盖率目标 | 说明 |
|------|------|-----------|------|
| 单元测试 | Jest | 80%+ | Fetcher, Analyzer, Filter, Notifier (mocked) |
| 集成测试 | Supertest + nock | 60%+ | GitHub API mock, OpenRouter mock, Database in-memory |
| E2E 测试 | Docker Compose | 40%+ | Full stack run with fake data, verify DB + notifications |
| 负载测试 | autocannon | N/A | 10k notifications/day (peak hour) |

### 5.2 CI/CD Pipeline (OpenClaw)

```yaml
# .github/workflows/ci.yml (if hosted on GitHub)
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run build (if TypeScript)
  docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t openclaw/github-trending:${{ github.sha }} .
      - run: docker scan (Snyk)
      - run: docker push (if tag)
```

### 5.3 监控 & 告警

- **指标导出:** `GET /metrics` endpoint (if HTTP server) or file export for node_exporter
  - `github_trending_fetched_total`
  - `github_trending_errors_total` (by error_type)
  - `github_trending_notifications_sent_total` (by channel)
  - `openrouter_latency_seconds`
  - `database_queries_total`
- **日志级别:**
  - `info`: normal operation
  - `warn`: API rate limit approaching, temporary failures
  - `error`: unrecoverable errors, manual intervention needed
- **告警规则:**
  - Error rate > 5% over 10 min → PagerDuty/Slack
  - Fetch failed 3 consecutive times → Email admin
  - OpenRouter API cost over 80% budget → Slack alert

---

## 6. 扩展性设计 (Future Enhancements)

### 6.1 Phase 2 Features

| Feature | Description | Effort |
|---------|-------------|--------|
| **Trending Dashboard** | Web UI (Express + React) to browse history, adjust filters | Medium |
| **User Subscription** | Multiple users with custom keyword sets; per-user notification targets | High |
| **Advanced AI** | Use embeddings to find similar repos; cluster trending topics | Medium |
| **Webhook Events** | Push to user-defined webhooks (Zapier, IFTTT) | Low |
| **Multiple Data Sources** | Integrate GH Archive, Libraries.io, NPM trends, PyPI trends | Medium |
| **Smart Throttling** | ML model to predict "spam" repos (promotional/bot) | High |
| **API Access** | REST API for external tools to query trending data | Medium |

### 6.2 插件化架构 (v2.0)

```javascript
// plugins/
├── fetchers/
│   ├── github/
│   ├── gharchive/
│   └── libsio/
├── analyzers/
│   ├── openrouter/
│   ├── local-llm/     // future: Ollama
│   └── heuristic/     // rule-based scoring
├── notifiers/
│   ├── telegram/
│   ├── feishu/
│   ├── discord/
│   ├── webhook/       // generic JSON webhook
│   └── webui/         // dashboard push
└── persistence/
    ├── sqlite/
    ├── postgres/
    └── redis/         // caching
```

**Plugin Registry:** `plugins/index.js` with dynamic `require()` based on config `plugins: ['github', 'telegram', 'openrouter']`

---

## 7. 迁移 & 部署指南

### 7.1 快速开始

```bash
# 1. Clone skill (already cloned)
cd openclaw-github-trending

# 2. Install dependencies
npm ci --only=production

# 3. Configure
cp .env.example .env
# Edit .env with your keys

# 4. Initialize DB
node scripts/setup-db.js

# 5. Test dry-run
node scripts/trending.js --dry-run --max 2

# 6. Enable in OpenClaw
# Add to OpenClaw skill registry (if needed)

# 7. Schedule (via OpenClaw cron)
# openclaw cron add "0 * * * *" node /path/to/openclaw-github-trending/scripts/trending.js
```

### 7.2 Docker 部署 (推荐生产)

```dockerfile
# Dockerfile (see Security section)
docker build -t openclaw/github-trending:latest .
docker run -d \
  --name github-trending \
  --restart unless-stopped \
  -e GITHUB_TOKEN=... \
  -e OPENROUTER_API_KEY=... \
  -e NOTIFY_CHANNEL=telegram \
  -e NOTIFY_TARGET=123456 \
  -v $(pwd)/data:/app/data \
  openclaw/github-trending:latest
```

### 7.3 OpenClaw 集成

**Skill Metadata (`SKILL.md`):**

```yaml
name: github-trending
description: GitHub Trending repositories notifier with AI summaries
version: 2.0.0
metadata:
  clawdbot:
    emoji: "⭐"
    requires:
      bins: ["node"]
      env: ["GITHUB_TOKEN", "OPENROUTER_API_KEY", "NOTIFY_CHANNEL", "NOTIFY_TARGET"]
    scripts:
      - "scripts/trending.js"
      - "src/index.js"  # daemon mode
```

---

## 8. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| GitHub API rate limit exceeded | 中 | 高 | 使用 PAT (5000/h); 监控 headers; exponential backoff; 缓存 popular repos |
| OpenRouter API 费用超支 | 中 | 中 | 设置 budget cap; 使用 low-cost models; monitor daily spend |
| 通知骚扰 (too many messages) | 中 | 中 | 智能过滤 (score > 70); deduplication (24h); daily digest mode |
| 依赖服务宕机 (Telegram/Feishu) | 低 | 中 | fallback to alternative channel; retry with circuit breaker |
| 数据丢失 (SQLite corruption) | 低 | 高 | daily backups; WAL mode; integrity check on startup |
| AI 摘要质量差 | 中 | 低 | prompt engineering; fallback to raw description; human feedback loop |

---

## 9. 验收标准 (Acceptance Criteria)

1. ✅ **功能完整:** 所有 1.1 节功能通过集成测试
2. ✅ **性能达标:** 单次运行 < 5 min (5 repos), API latency < 2s p95
3. ✅ **安全合规:** 无 secrets in logs; DB encrypted at rest (optional); dependency vulnerabilities < 5 (npm audit)
4. ✅ **可观测:** Metrics endpoint returns valid Prometheus format; logs are JSON
5. ✅ **文档齐全:** README, ARCHITECTURE, SKILL.md, deployment guide
6. ✅ **OpenClaw 集成:** `openclaw status` shows skill healthy; cron scheduling works

---

## 附录

### A. 配置文件示例 (`.env`)

```bash
# GitHub API (fine-grained PAT with public_repo access only)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=openai/gpt-4o-mini

# Notification channel (choose one or multiple, comma-separated)
NOTIFY_CHANNELS=telegram,feishu
NOTIFY_TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
NOTIFY_TELEGRAM_CHAT_ID=-1001234567890
NOTIFY_FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxx

# Filtering
MIN_STARS=100
MIN_SCORE=70
KEYWORDS="AI agents,OpenClaw,Python automation,TypeScript frameworks,Rust tools,LLM applications,Developer productivity"
BLACKLIST="spam,scam,adult"

# Scheduling (cron expression, default hourly)
SCHEDULE="0 * * * *"

# Database
DATABASE_PATH=/app/data/github_trending.db

# Logging
LOG_LEVEL=info
```

### B. 依赖清单 (`package.json` 摘要)

```json
{
  "name": "openclaw-github-trending",
  "version": "2.0.0",
  "type": "module",
  "dependencies": {
    "axios": "^1.7.7",
    "better-sqlite3": "^9.4.3",
    "convict": "^6.2.4",
    "dotenv": "^16.4.5",
    "node-cron": "^3.0.3",
    "pino": "^9.2.0",
    "prom-client": "^15.1.3",
    "node-telegram-bot-api": "^0.66.0",
    "@slack/web-api": "^7.0.5"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "autocannon": "^7.14.0"
  }
}
```

### C. 术语表

- **Trending:** 指在特定时间段内 stars/fork/issue 增长显著的 GitHub 项目
- **OpenRouter:** 多模型 LLM API 网关，统一访问各种 AI 模型
- **PAT:** Personal Access Token (GitHub)
- **Notifier:** 消息推送模块
- **Filter Engine:** 基于关键词和评分的筛选逻辑
- **Scheduler:** 定时任务调度器

---

**文档版本:** v1.0 (Designer Output)
**下一步:** 交码 Generator 实现 → 验证 QA Tester → 发布 Publisher
