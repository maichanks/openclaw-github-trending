# GitHub Trending Notifier - 架构设计

## 系统概览

```
┌─────────────┐
│   Scheduler  │ (每小时触发)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  GitHub Fetcher  │ (trending API + search)
└──────┬───────────┘
       │
       ▼
┌─────────────────────┐
│   AI Summarizer     │ (OpenRouter GPT-4o-mini)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Formatter         │ (build message)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Notifier          │ (Telegram/Feishu/Discord)
└─────────────────────┘
```

## 技术栈

- **Runtime**: Node.js 20+
- **Package Manager**: npm
- **External APIs**:
  - GitHub REST API v3 (search/repositories)
  - OpenRouter Chat Completions (AI summary)
- **Message Delivery**: OpenClaw `message` tool
- **Scheduling**: OpenClaw cron (hourly)

## 核心模块

### 1. GitHub Fetcher
- 搜索近期创建且 stars > 100 的项目
- 按星数降序排序
- 返回前 N 个（默认 5）

### 2. AI Summarizer
- 调用 OpenRouter `openai/gpt-4o-mini`
- Prompt: "Summarize this repo in 3 sentences focusing on its unique value"
- 超时 10s，失败则返回默认摘要

### 3. Formatter
- 构建美观的消息卡片
- 包含：repo 名、⭐数、语言、摘要、链接

### 4. Notifier
- 通过 OpenClaw `message.send()` 发送
- 目标由环境变量配置

## 数据流
1. Scheduler 触发 → 2. Fetcher 获取列表 → 3. 并行 Summarize → 4. 聚合 → 5. 发送通知

## 错误处理
- GitHub API 失败：重试 3 次，exponential backoff
- OpenRouter 超时：使用默认摘要（项目描述截断）
- 发送失败：记录日志，下次重试

## 性能指标
- 预期执行时间：<30s
- API 调用：GitHub 1次 + OpenRouter N次（并行）
- 内存占用：<50MB

## 扩展点
- 多语言支持（根据用户偏好）
- 自定义过滤规则（按 topic、license）
- 数据库存储历史（可选）

---

**设计者**: Designer-1 (子代理)  
**日期**: 2025-03-08