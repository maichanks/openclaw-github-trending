# GitHub Trending Notifier Skill - 架构设计文档

**版本:** 2.0  
**设计日期:** 2025-03-08  
**设计者:** Designer (Architecture Team)  
**状态:** Draft

---

## 1. 功能规格 (Functional Specifications)

### 1.1 核心功能

#### 1.1.1 数据采集层
- **多源数据获取**
  - GitHub官方 Trending 页面抓取（每日/每周/每月）
  - GitHub Search API（按 stars、forks、issues 等维度）
  - GitHub Events API（实时检测趋势变化）
  - 支持语言筛选（TypeScript, Python, Rust, Go, etc.）
  - 支持时间窗口：今日、本周、本月、自定义

- **智能过滤系统**
  - 关键字过滤（基于 Researcher 趋势报告）
  - 项目质量评分（stars 增长率、fork 率、issue 响应速度）
  - 排除陈旧/废弃项目（last updated > 6个月）
  - 去重（同一项目多榜单出现）

#### 1.1.2 AI 分析层
- **项目亮点摘要**（3句话以内）
  - 使用 OpenRouter 多模型支持
  - 可配置摘要风格（技术向/通俗向）
  - 多语言输出（中文/英文）

- **深度分析（可选）**
  - 技术栈识别（通过代码分析）
  - 适用场景推荐（适合新手/企业/特定用途）
  - 风险提示（许可证 GPL/MIT/Apache、维护状态）

#### 1.1.3 通知推送层
- **多渠道分发**
  - Telegram（支持 Markdown 格式化）
  - Feishu/Lark（支持卡片消息）
  - Discord（支持 Embed）
  - Email（HTML 模板）
  - 自定义 Webhook

- **消息模板**
  - 简洁列表模式（最多 N 条）
  - 详细卡片模式（每个 repo 独立卡片）
  - 聚合日报/周报模式

#### 1.1.4 配置管理
- **用户级配置**
  - 偏好设置（语言、频率、渠道）
  - 关键词订阅（关注特定技术栈）
  - 通知静音时间段

- **管理员级配置**
  - 全局默认设置
  - 用户权限管理
  - API 配额监控

### 1.2 非功能需求

- **性能**
  - 数据采集：< 30s（包含 API 限流处理）
  - AI 摘要：并发处理，每 repo < 10s
  - 端到端延迟：< 5分钟（从采集到推送）

- **可靠性**
  - 失败重试机制（指数退避）
  - 断点续传（记录上次成功位置）
  -  degraded mode（AI 失败时降级为纯数据推送）

- **可扩展性**
  - 插件式数据源（可扩展 GitLab/Bitbucket）
  - 插件式通知渠道
  - 水平扩展支持（多实例部署）

- **监控**
  - Prometheus 指标导出
  - 错误日志聚合
  - 成功率 SLA 追踪

---

## 2. 技术栈选型 (Technology Stack)

### 2.1 运行时环境

| 组件 | 选型 | 理由 |
|------|------|------|
| **运行时** | Node.js 20+ LTS | 现有 Skill 生态兼容，async/await 友好 |
| **包管理** | npm / yarn | 标准工具链 |
| **类型系统** | TypeScript 5.x | 类型安全，提升代码质量 |
| **配置管理** | dotenv + zod | 环境变量 + 运行时验证 |

### 2.2 数据采集模块

| 组件 | 选型 | 理由 |
|------|------|------|
| **HTTP 客户端** | `got` 或 `axios` | 更好的错误处理和拦截器 |
| **HTML 解析** | `cheerio` | 轻量，jQuery 兼容 API |
| **API 限流** | `bottleneck` | 精细化速率限制 |
| **缓存** | Redis / Upstash | 缓存 trending 数据，避免重复请求 |
| **数据存储** | SQLite（本地）或 PostgreSQL（集群） | 用户配置、历史记录 |

### 2.3 AI 分析模块

| 组件 | 选型 | 理由 |
|------|------|------|
| **LLM API 客户端** | OpenRouter SDK | 多模型统一接口，成本优化 |
| **提示词管理** | 模版字符串 + `prompts` 包 | 版本化管理提示词 |
| **并发控制** | `p-limit` | 控制 API 调用并发数 |
| **Fallback 机制** | 自定义降级逻辑 | AI 失败时使用预设摘要 |

### 2.4 通知推送模块

| 组件 | 选型 | 理由 |
|------|------|------|
| **Telegram** | `node-telegram-bot-api` | 成熟稳定 |
| **Feishu** | `@feishu/docus` 或自定义 webhook | 官方 SDK 支持 |
| **Discord** | `discord.js` | 功能完整 |
| **Email** | `nodemailer` | 广泛使用 |
| **模板引擎** | `handlebars` 或 `ejs` | 灵活的模板系统 |

### 2.5 运维与监控

| 组件 | 选型 | 理由 |
|------|------|------|
| **日志** | `pino` 或 `winston` | 结构化日志，JSON 输出 |
| **监控** | Prometheus + Grafana | 业界标准 |
| **健康检查** | 自定义 `/health` endpoint | K8s 就绪探针 |
| **任务调度** | `node-cron` 或系统 cron | 定时任务 |
| **进程管理** | PM2 或 systemd | 守护进程 |

### 2.6 开发与测试

| 组件 | 选型 | 理由 |
|------|------|------|
| **测试框架** | Jest + Supertest | 单元测试 + API 测试 |
| **E2E 测试** | Playwright | 端到端流程验证 |
| **代码质量** | ESLint + Prettier + Husky | 代码规范 |
| **依赖扫描** | `npm audit` + `snyk` | 安全漏洞检测 |

### 2.7 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenClaw Gateway                      │
│  (Plugin: github-trending)                                 │
├─────────────────────────────────────────────────────────────┤
│  Job Scheduler (cron: 0 * * * *)                           │
├─────────────────────────────────────────────────────────────┤
│  Skill Executor                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   Fetcher   │→ │  AI Engine  │→ │   Notifier      │   │
│  │ (GitHub)    │  │ (OpenRouter)│  │ (Multi-channel) │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
│         ↓                ↓                  ↓              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Persistence Layer                      │   │
│  │  • SQLite (configs, history)                       │   │
│  │  • Redis (cache)                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. API 设计

### 3.1 内部模块接口

#### 3.1.1 Config Manager

```typescript
interface Config {
  github: {
    token: string;
    rateLimit: number; // requests per minute
    retries: number;
  };
  openrouter: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  notification: {
    channels: NotificationChannel[];
    maxRepos: number;
    template: 'compact' | 'detailed' | 'card';
    language: 'zh' | 'en';
  };
  scheduler: {
    cron: string; // e.g., "0 * * * *"
    timezone: string;
  };
}

interface ConfigManager {
  load(): Promise<Config>;
  validate(): Promise<void>;
  get<T>(key: string): T;
  set(key: string, value: any): void;
  save(): Promise<void>;
}
```

#### 3.1.2 Fetcher Module

```typescript
interface TrendingRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  starsDelta: number; // 过去 N 天的增长
  topics: string[];
  license: string | null;
  lastUpdated: Date;
  fetchedAt: Date;
}

interface Fetcher {
  // 获取 trending 列表
  fetchTrending(timeWindow: 'daily' | 'weekly' | 'monthly'): Promise<TrendingRepo[]>;
  
  // 搜索（按自定义条件）
  searchRepos(query: SearchQuery): Promise<TrendingRepo[]>;
  
  // 获取单个 repo 详情
  fetchRepoDetails(fullName: string): Promise<RepoDetails>;
  
  // 获取历史趋势
  fetchHistory(repoId: string, days: number): Promise<TrendHistory>;
}

interface SearchQuery {
  language?: string;
  minStars?: number;
  minStarsDelta?: number;
  topics?: string[];
  excludeTopics?: string[];
  dateRange?: { since: Date; until: Date };
}
```

#### 3.1.3 AI Engine Module

```typescript
interface SummaryOptions {
  style: 'technical' | 'popular' | 'brief';
  language: 'zh' | 'en';
  maxLength: number;
}

interface AIEngine {
  // 生成摘要
  generateSummary(repo: TrendingRepo, options: SummaryOptions): Promise<string>;
  
  // 批量生成（并发控制）
  generateBatchSummaries(
    repos: TrendingRepo[], 
    options: SummaryOptions,
    concurrency: number
  ): Promise<Map<string, string>>;
  
  // 识别技术栈
  detectTechStack(repo: RepoDetails): Promise<string[]>;
  
  // 评估质量
  assessQuality(repo: RepoDetails): Promise<QualityScore>;
}

interface QualityScore {
  overall: number; // 0-100
  maintainability: number;
  popularity: number;
  activity: number;
  community: number;
}
```

#### 3.1.4 Notifier Module

```typescript
type NotificationChannel = 'telegram' | 'feishu' | 'discord' | 'email' | 'webhook';

interface NotificationTarget {
  channel: NotificationChannel;
  destination: string; // chat ID, email, webhook URL
  template?: string;
}

interface NotificationMessage {
  title: string;
  content: string;
  repos: FormattedRepo[];
  generatedAt: Date;
}

interface FormattedRepo {
  name: string;
  url: string;
  summary: string;
  stats: {
    stars: number;
    forks: number;
    language: string;
  };
}

interface Notifier {
  // 发送通知
  send(message: NotificationMessage, target: NotificationTarget): Promise<void>;
  
  // 批量发送
  sendBatch(messages: NotificationMessage[], targets: NotificationTarget[]): Promise<void>;
  
  // 测试连接
  testConnection(target: NotificationTarget): Promise<boolean>;
}
```

#### 3.1.5 Scheduler Module

```typescript
interface Job {
  id: string;
  name: string;
  cron: string;
  timezone: string;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

interface Scheduler {
  // 添加定时任务
  add(job: Omit<Job, 'id'>): string;
  
  // 移除任务
  remove(jobId: string): void;
  
  // 立即执行
  runNow(jobId: string): Promise<void>;
  
  // 列出所有任务
  list(): Job[];
  
  // 启动调度器
  start(): void;
  
  // 停止调度器
  stop(): void;
}
```

### 3.2 OpenClaw Skill 接口

#### 3.2.1 Skill Manifest (SKILL.md)

```yaml
name: github-trending
description: GitHub Trending repositories notifier with AI summaries
version: 2.0.0
metadata:
  clawdbot:
    emoji: "⭐"
    requires:
      bins: ["node"]
      env: [
        "GITHUB_TOKEN",
        "OPENROUTER_API_KEY",
        "NOTIFY_CHANNEL",
        "NOTIFY_TARGET"
      ]
    scripts:
      - "scripts/fetcher.js"
      - "scripts/ai.js"
      - "scripts/notifier.js"
      - "scripts/scheduler.js"
    configSchema:
      $schema: "http://json-schema.org/draft-07/schema#"
      type: object
      properties:
        github:
          type: object
          properties:
            token: { type: "string" }
            rateLimit: { type: "integer", default: 30 }
        openrouter:
          type: object
          properties:
            apiKey: { type: "string" }
            model: { type: "string", default: "openai/gpt-4o-mini" }
        notification:
          type: object
          properties:
            channels: { type: "array", items: { type: "string" } }
            maxRepos: { type: "integer", default: 5 }
            template: { type: "string", enum: ["compact", "detailed"], default: "compact" }
```

#### 3.2.2 CLI 命令

```bash
# 检查配置
node scripts/cli.js config validate

# 测试数据获取
node scripts/cli.js fetch --dry-run

# 测试 AI 摘要
node scripts/cli.js summarize <repo_url>

# 测试通知推送
node scripts/cli.js notify --dry-run

# 手动执行完整流程
node scripts/cli.js run --once

# 启动定时任务（daemon 模式）
node scripts/cli.js daemon

# 查看状态
node scripts/cli.js status

# 查看历史记录
node scripts/cli.js history --days 7
```

---

## 4. 安全考虑 (Security Considerations)

### 4.1 身份验证与授权

| 凭证 | 存储方式 | 访问控制 |
|------|---------|---------|
| GitHub PAT | 环境变量 `GITHUB_TOKEN` | 最小权限：`public_repo` + `read:org` |
| OpenRouter Key | 环境变量 `OPENROUTER_API_KEY` | 仅限本项目使用 |
| Notifier Tokens | 环境变量或加密配置 | 按渠道隔离（不同 bot 账号） |

**最佳实践:**
- ✅ 使用 `.env` 文件，加入 `.gitignore`
- ✅ 定期轮换 API 密钥
- ✅ 不同环境使用不同密钥（dev/staging/prod）
- ✅ 密钥泄露检测（git-secrets 预提交钩子）

### 4.2 输入验证与清理

```typescript
// 所有外部输入必须验证
const sanitizeRepo = (raw: any): TrendingRepo => {
  const schema = z.object({
    id: z.string().regex(/^[0-9]+$/),
    name: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/),
    fullName: z.string().max(200),
    url: z.string().url(),
    description: z.string().max(500).optional(),
    language: z.string().max(50).optional(),
    stars: z.number().int().nonnegative(),
    forks: z.number().int().nonnegative(),
  });
  
  return schema.parse(raw);
};
```

- **HTML 解析输出**：使用 `cheerio` 自动转义
- **AI 提示词注入防护**：用户输入不能覆盖系统提示词
- **Markdown 注入**：通知消息中转义 ```` ` ```` 代码块

### 4.3 速率限制与防滥用

```typescript
const limiter = new Bottleneck({
  minTime: 2000, // GitHub API: 5000/hr ~= 1.4 req/sec
  maxConcurrent: 1,
  strategy: Bottleneck.strategy.OVERFLOW,
});

// OpenRouter 限流（按模型配额）
const AIRateLimiter = new Bottleneck({
  minTime: 1000, // 保守限制
  maxConcurrent: 3,
});
```

**防护措施:**
- 监控 API 使用量，接近配额时告警
- 实现 exponential backoff 重试
- 队列化请求，避免突发流量

### 4.4 数据隐私

- **不存储** GitHub 用户个人信息（仅公开数据）
- **历史记录** 仅保存 repo 基本信息（名称、stars、摘要）
- **用户配置** 加密存储敏感字段（API keys）
- **数据保留策略**：历史记录保留 90 天自动清理

### 4.5 漏洞防护

| 风险 | 缓解措施 |
|------|---------|
| **SSRF** | 禁止 fetch 内网 IP，白名单 GitHub API |
| **XSS** | 通知消息 Markdown 转义，禁止 HTML |
| **RCE** | 动态代码执行远离（eval -> new Function） |
| **Dependency** | `npm audit` + `snyk` 定期扫描，更新依赖 |
| **Log Injection** | 结构化日志（JSON），避免字符串拼接 |

### 4.6 审计与合规

- **操作日志**：所有 API 调用记录（时间、用户、操作）
- **配置变更**：审计日志（谁修改了什么）
- **异常检测**：失败率 > 5% 自动告警
- **GDPR**：支持用户数据删除（配置文件 + 历史记录）

### 4.7 安全性设计原则

1. **最小权限原则**：每个组件只拥有必要的权限
2. **纵深防御**：多层安全检查（验证、限流、监控）
3. **零信任**：不信任任何输入（即使是 GitHub API 返回）
4. **安全默认**：默认配置开启所有安全选项
5. **Fail Secure**：错误时拒绝服务而非泄露信息

---

## 5. 部署架构

### 5.1 单机部署（OpenClaw Gateway）

```
/home/admin/.openclaw/workspace/
├── openclaw-github-trending/
│   ├── SKILL.md              # Skill manifest
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── config/
│   │   ├── fetcher/
│   │   ├── ai/
│   │   ├── notifier/
│   │   ├── scheduler/
│   │   └── cli.ts
│   ├── scripts/
│   │   └── index.js          # CLI entry
│   ├── templates/            # 消息模板
│   ├── tests/
│   └── README.md
├── .env                      # 敏感配置（不提交）
└── data/
    ├── github-trending.db   # SQLite 数据库
    └── cache/               # Redis 或文件缓存
```

**运行方式:**
```bash
# 开发
npm run dev

# 构建
npm run build

# 生产（作为 OpenClaw plugin）
node scripts/index.js run --once
# 或 daemon 模式
node scripts/index.js daemon
```

### 5.2 分布式部署（K8s）

```yaml
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: github-trending
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: skill
        image: ghcr.io/openclaw/github-trending:2.0
        envFrom:
        - secretRef:
            name: github-trending-secrets
        - configMapRef:
            name: github-trending-config
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
```

**组件:**
- **Job Pod**：运行 fetcher + ai + notifier
- **Redis**：共享缓存
- **PostgreSQL**：多实例数据持久化
- **Prometheus**：指标收集

### 5.3 监控告警

```yaml
# Prometheus Rule
groups:
- name: github_trending
  rules:
  - alert: HighErrorRate
    expr: rate(github_trending_errors_total[5m]) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: " GitHub Trending 错误率过高"
```

**关键指标:**
- `github_trending_fetch_duration_seconds`
- `github_trending_ai_calls_total`
- `github_trending_notifications_sent_total`
- `github_trending_errors_total`

---

## 6. 配置示例

### 6.1 `.env` 文件

```bash
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=openai/gpt-4o-mini

# Notification
NOTIFY_CHANNEL=telegram
NOTIFY_CHANNEL=feishu
NOTIFY_TARGET=123456789  # chat ID or webhook URL

# Filter
TREND_LANGUAGES=typescript,python,rust,go
TREND_MIN_STARS=100
TREND_MAX_REPOS=5

# Database
DATABASE_URL=sqlite:./data/github-trending.db
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

### 6.2 `config.yaml`（可扩展）

```yaml
github:
  token: ${GITHUB_TOKEN}
  rateLimit: 30
  retries: 3

openrouter:
  apiKey: ${OPENROUTER_API_KEY}
  model: openai/gpt-4o-mini
  maxTokens: 150
  temperature: 0.7

filter:
  languages:
    - typescript
    - python
    - rust
    - go
  minStars: 100
  excludeTopics:
    - "tutorial"
    - "example"
    - "demo"
  minUpdateAgeDays: 7

notification:
  channels:
    - type: telegram
      target: ${TELEGRAM_CHAT_ID}
      template: detailed
    - type: feishu
      target: ${FEISHU_WEBHOOK_URL}
      template: card
  maxRepos: 5
  language: zh

scheduler:
  cron: "0 * * * *"  # 每小时
  timezone: "Asia/Shanghai"

ai:
  summaryStyle: popular
  batchSize: 5
  concurrency: 2
  retryOnFailure: true
```

---

## 7. 演进路线 (Roadmap)

### Phase 1: MVP（当前）
- ✅ 基本数据采集（GitHub Search API）
- ✅ AI 摘要（OpenRouter）
- ✅ 单渠道通知（Telegram）
- ✅ 定时任务（cron）

### Phase 2: 增强（预计 2 周）
- [ ] 多通知渠道（Feishu, Discord, Email）
- [ ] 配置管理 UI（CLI）
- [ ] 历史记录查询
- [ ] 质量过滤规则引擎
- [ ] 监控指标导出（Prometheus）

### Phase 3: 扩展（预计 4 周）
- [ ] 多数据源（GitLab, Hacker News）
- [ ] AI 深度分析（技术栈识别、风险提示）
- [ ] 用户订阅系统（个性化关键词）
- [ ] Web Dashboard（可视化报表）
- [ ] HTTP API（外部集成）

### Phase 4: 企业级（未来）
- [ ] 多租户 SaaS 架构
- [ ] RBAC 权限管理
- [ ] 审计日志
- [ ] 多区域部署（CDN + Edge）
- [ ] 机器学习推荐（基于用户反馈优化推送）

---

## 8. 测试策略

### 8.1 单元测试

```typescript
describe('Fetcher', () => {
  it('should parse trending HTML correctly', async () => {
    const html = fs.readFileSync('tests/fixtures/trending.html', 'utf8');
    const repos = await parser.parse(html);
    expect(repos).toHaveLength(25);
    expect(repos[0].name).toBe('some-repo');
  });
  
  it('should handle GitHub API rate limit', async () => {
    // Mock 403 response
    mockAxios.get.mockRejectedValueOnce({ status: 403 });
    await expect(fetcher.fetchTrending()).rejects.toThrow('rate limit');
  });
});
```

### 8.2 集成测试

```typescript
describe('End-to-End Flow', () => {
  it('should fetch, summarize, and notify', async () => {
    // 1. Mock GitHub API
    mockFetcher.fetchTrending.resolves(mockRepos);
    
    // 2. Mock OpenRouter
    mockAI.generateSummary.resolves('This project is awesome...');
    
    // 3. Mock Notifier
    mockNotifier.send.resolves();
    
    // Run
    await run();
    
    // Verify
    expect(mockNotifier.send).toHaveBeenCalledWith(
      expect.objectContaining({
        repos: expect.any(Array),
      })
    );
  });
});
```

### 8.3 E2E 测试

```typescript
test('full workflow with real APIs (integration)', async () => {
  const result = await exec('node scripts/cli.js run --once');
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('✅ 通知发送成功');
});
```

---

## 9. 验收标准 (Acceptance Criteria)

### 9.1 功能验收

- [ ] 每小时自动运行（可配置 cron）
- [ ] 成功获取 GitHub Trending 数据（至少 5 个 repo）
- [ ] AI 生成准确、有用的摘要（人工抽查 > 80% 满意度）
- [ ] 通知成功推送到至少 1 个渠道（Telegram/Feishu/Discord）
- [ ] 失败时重试 3 次，失败记录到日志
- [ ] 支持配置热重载（无需重启）

### 9.2 性能验收

- [ ] 数据采集 < 30s
- [ ] 单 repo AI 摘要 < 10s（平均）
- [ ] 端到端延迟 < 5 分钟（5 个 repo）
- [ ] 内存占用 < 100MB（常驻）
- [ ] CPU 峰值 < 50%（单核）

### 9.3 安全验收

- [ ] 所有 API 凭证加密存储
- [ ] 无敏感信息泄露到日志
- [ ] 通过 `npm audit` 无高危漏洞
- [ ] 输入验证覆盖 100% 外部输入
- [ ] 速率限制生效（GitHub API 不超限）

### 9.4 可用性验收

- [ ] CLI 帮助文档完整（`--help`）
- [ ] README 包含部署和故障排查指南
- [ ] 错误信息清晰可操作
- [ ] 健康检查 endpoint 返回 200
- [ ] 监控指标完整

---

## 10. 附录

### 10.1 术语表

| 术语 | 定义 |
|------|------|
| **Trending** | GitHub 按热度排名的项目列表 |
| **Stars Delta** | 过去 N 天的 star 增长数 |
| **AI Summary** | 使用大语言模型生成的项目亮点摘要 |
| **Notification Channel** | 消息推送渠道（Telegram、Feishu 等） |
| **Cron** | 定时任务调度表达式 |

### 10.2 相关文档

- [GitHub API 文档](https://docs.github.com/en/rest)
- [OpenRouter API 参考](https://openrouter.ai/docs)
- [OpenClaw Skill 开发指南](../AGENTS.md)
- [HR Agent 架构设计](../skills/hr-agent/SKILL.md)

### 10.3 联系与支持

- **项目仓库**: `/home/admin/.openclaw/workspace/openclaw-github-trending`
- **问题反馈**: 通过 OpenClaw Gateway logs
- **贡献指南**: 见 README.md

---

**文档结束**
