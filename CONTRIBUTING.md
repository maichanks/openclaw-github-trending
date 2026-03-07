# Contributing Guide - GitHub Trending Notifier

🤝 **欢迎贡献！感谢您帮助改进本项目。**

---

## 📋 目录

1. [如何贡献](#如何贡献)
2. [开发环境搭建](#开发环境搭建)
3. [代码规范](#代码规范)
4. [提交 Pull Request](#提交-pull-request)
5. [测试指南](#测试指南)
6. [Issue 报告规范](#issue-报告规范)
7. [文档贡献](#文档贡献)
8. [行为准则](#行为准则)

---

## 如何贡献

我们欢迎以下类型的贡献：

- 🐛 **Bug 修复** - 发现问题并提供解决方案
- ✨ **新功能** - 添加新功能或改进现有功能
- 📖 **文档改进** - 修复错别字、补充说明、翻译文档
- 🔧 **代码优化** - 提升性能、改善代码结构
- 🧪 **测试用例** - 增加单元测试或集成测试
- 💡 **建议反馈** - 提出新想法或改进建议

---

## 开发环境搭建

### 1. Fork 和 Clone

```bash
# 1. Fork 本仓库（在 GitHub 网页点击 Fork）

# 2. Clone 您的 fork
git clone https://github.com/YOUR-USERNAME/openclaw-github-trending.git
cd openclaw-github-trending

# 3. 添加上游仓库
git remote add upstream https://github.com/openclaw/openclaw-github-trending.git
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
# 复制示例环境变量文件（如有）
cp .env.example .env

# 编辑 .env，填入您的真实配置
# GITHUB_TOKEN=
# OPENROUTER_API_KEY=
# NOTIFY_CHANNEL=
# NOTIFY_TARGET=
```

**获取测试 Token：**
- GitHub: https://github.com/settings/tokens (选择 `public_repo`)
- OpenRouter: https://openrouter.ai/keys

### 4. 运行测试

```bash
# 基础运行
npm start

# 或
node scripts/trending.js
```

预期看到：
```
🚀 开始获取 GitHub Trending...
✅ 找到 N 个热门仓库
...
✅ Trending 通知完成
```

如果看到 `📢 通知内容:` 说明通知已准备好，渠道配置正确后会发送。

---

## 代码规范

### 一般原则

- **简洁明了**：代码应易于理解，避免过度设计
- **一致风格**：遵循项目现有代码风格
- **错误处理**：每个外部调用都应有 try-catch
- **日志输出**：使用 `console.log` 输出流程信息，`console.error` 输出错误

### 具体规范

#### 缩进与格式化
```javascript
// 使用 2 空格缩进（与项目保持一致）
function example() {
  if (condition) {
    doSomething();
  }
}
```

#### 命名约定
```javascript
// 变量/函数：lowerCamelCase
const githubToken = '';
function getTrending() { }

// 常量：UPPER_SNAKE_CASE
const API_BASE = 'https://api.github.com';

// 类：PascalCase
class TrendingNotifier { }
```

#### 注释
```javascript
// 单行注释，简洁说明
const query = `created:>=${dateStr} stars:>100`;

/*
 * 多行注释，用于复杂逻辑说明
 * 函数功能
 * 参数说明
 * 返回值
 */
function complexLogic(input) {
  // ...
}
```

#### 错误处理
```javascript
try {
  const result = await fetch(url);
  return result.json();
} catch (err) {
  console.error('❌ 获取数据失败:', err.message);
  // 返回降级数据或抛出错误
  return null;
}
```

#### 日志格式
```javascript
console.log('🚀 开始流程...');      // 开始
console.log('✅ 步骤完成');         // 成功
console.log('⚠️  警告信息');         // 警告
console.error('❌ 错误信息');        // 错误
console.log('  ├ 子步骤...');       // 子步骤（带缩进）
```

---

## 提交 Pull Request

### 1. 创建特性分支

```bash
# 从主分支创建新分支
git checkout -b feature/amazing-feature

# 或修复 bug
git checkout -b fix/issue-123
```

分支命名规范：
- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构
- `test/xxx` - 添加测试

### 2. 提交更改

```bash
# 查看改动
git status
git diff

# 添加文件
git add scripts/trending.js
git add README.md

# 提交（使用清晰的提交信息）
git commit -m "feat: add support for custom search query

- Add LANGUAGE_FILTER environment variable
- Update documentation with examples
- Fix maxRepos environment variable parsing"
```

**提交信息格式**（建议使用 Conventional Commits）：

```
类型(范围): 简短描述

详细描述（可选）
```

常用类型：
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更改
- `refactor` - 代码重构
- `test` - 添加测试
- `chore` - 构建/工具更改

### 3. 推送分支

```bash
git push origin feature/amazing-feature
```

### 4. 开启 Pull Request

1. 访问 GitHub 仓库页面
2. 点击 "Compare & pull request"
3. 填写 PR 模板：

```markdown
## 📝 变更描述

- 简要描述做了什么
- 关联的 Issue 编号（如有）

## 🧪 测试方法

- 如何测试这个变更
- 预期行为

## ✅ 检查清单

- [ ] 代码遵循项目规范
- [ ] 已本地测试通过
- [ ] 文档已更新（如需要）
- [ ] 无新增安全问题

## 📸 截图/日志

（如有 UI 变更或关键日志，请附上）
```

### 5. 代码审查

- 等待维护者审查
- 根据反馈进行修改
- 添加必要的测试
- 确保 CI 通过（如有）

### 6. 合并

维护者会合并您的 PR。恭喜！

---

## 测试指南

### 手动测试

```bash
# 1. 完整运行测试
node scripts/trending.js

# 2. 分段测试
# - 测试 GitHub API
node -e "import('./scripts/trending.js').then(m => m.getTrending()).then(console.log)"

# - 测试 AI 摘要
node -e "import('./scripts/trending.js').then(m => m.generateSummary({full_name:'test/repo', description:'Test', language:'JS', stargazers_count:100, forks_count:10})).then(console.log)"

# - 测试通知（不实际发送）
node scripts/trending.js 2>&1 | grep "📢"
```

### 环境测试矩阵

| 测试场景 | 配置 | 预期结果 |
|----------|------|----------|
| 所有配置正确 | 正确 Token + 渠道 | ✅ 完整运行，通知发送 |
| 无 GITHUB_TOKEN | - | ❌ 启动失败，提示缺少配置 |
| GitHub Token 无效 | 错误的 Token | ❌ GitHub API 失败，降级处理 |
| OpenRouter 失败 | 正确的 GitHub，错误的 OpenRouter | ⚠️ 通知发送，但摘要为降级文本 |
| 渠道配置错误 | 正确的 API，错误的 NOTIFY_TARGET | ⚠️ 控制台输出通知内容（降级） |

### 回归测试

每次修改后运行：

```bash
# 连续运行 3 次，确保稳定性
for i in 1 2 3; do
  echo "=== Run $i ==="
  node scripts/trending.js || echo "❌ Run $i failed"
  sleep 2
done
```

---

## Issue 报告规范

### 报告前检查

- [ ] 是否已搜索现有 Issues？（避免重复）
- [ ] 是否已尝试 README 和 TROUBLESHOOTING 中的解决方案？
- [ ] 是否提供了足够的信息？

### Issue 模板

```markdown
## 🐛 Bug 描述

清晰描述问题现象。

## 🔄 复现步骤

1. 
2. 
3. 

## 📊 预期行为

描述期望的结果。

## 🖥️ 环境信息

- Node.js 版本: (`node --version`)
- 操作系统: 
- 脚本版本/Commit: 
- 配置（脱敏后）:
  - GITHUB_TOKEN: ghp_xxx...[隐藏]
  - OPENROUTER_API_KEY: sk-or...[隐藏]
  - NOTIFY_CHANNEL: 
  - MAX_REPOS: 

## 📋 日志

```bash
# 粘贴相关日志，务必脱敏
```

## 📸 截图

（如有 UI 问题或错误界面，请附上）

## 💡 附加信息

任何其他相关信息。
```

---

## 文档贡献

文档是项目的重要组成部分！欢迎改进：

- **README.md** - 用户主文档
- **API.md** - API 参考
- **TROUBLESHOOTING.md** - 故障排除
- **CONTRIBUTING.md** - 贡献指南（本文件）

### 文档编辑规范

- 使用清晰的 Markdown 格式
- 包含代码示例（可运行的）
- 截图需添加 alt 文本
- 表格需对齐且易读
- 中英文统一（项目使用中文为主）

提交 PR 时选择 `docs/` 类型分支。

---

## 行为准则

我们致力于创建一个友好、尊重的社区环境：

- **尊重他人** - 礼貌对待所有人，无论身份背景
- **建设性反馈** - 提出批评时聚焦于代码，而非个人
- **包容性** - 欢迎不同观点和经验
- **专业精神** - 遇到分歧时寻求共识

违反行为准则的行为可能被拒绝贡献或移除社区权限。

---

## 特别感谢

感谢所有为本项目做出贡献的开发者！

查看 [ Contributors ](https://github.com/openclaw/openclaw-github-trending/graphs/contributors) 页面了解详情。

---

## 许可证

贡献代码即表示您同意将您的贡献按项目的 [MIT License](./LICENSE) 许可。

---

**有问题？** 请随时开启 [Discussion](https://github.com/openclaw/openclaw-github-trending/discussions) 或提交 Issue。

**祝贡献愉快！** 🎉
