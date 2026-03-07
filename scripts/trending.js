/**
 * GitHub Trending Notifier (Fixed v1.1.0)
 * 获取 Trending Repos，生成 AI 摘要，推送到指定频道
 * SOP 合规版本 - QA 修复后
 * 
 * 注意：使用 OpenClaw 环境变量（无需 dotenv）
 */

const https = require('https');
const { spawn } = require('child_process');

// ============== 配置与参数解析 ==============

// 解析命令行参数（简单实现）
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');

const CONFIG = {
  githubToken: process.env.GITHUB_TOKEN,
  openrouterKey: process.env.OPENROUTER_API_KEY,
  notifyChannel: process.env.NOTIFY_CHANNEL || 'telegram',
  notifyTarget: process.env.NOTIFY_TARGET,
  maxRepos: parseInt(process.env.MAX_REPOS) || 5,
  openrouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
  dryRun: isDryRun,
  logLevel: process.env.LOG_LEVEL || 'info' // 'debug'|'info'|'warn'|'error'
};

// 日志工具
const log = {
  debug: (...msgs) => { if (CONFIG.logLevel === 'debug') console.debug('[DEBUG]', ...msgs); },
  info: (...msgs) => { if (CONFIG.logLevel !== 'error') console.log('[INFO]', ...msgs); },
  warn: (...msgs) => console.warn('[WARN]', ...msgs),
  error: (...msgs) => console.error('[ERROR]', ...msgs)
};

// 启动验证
function validateConfig() {
  const errors = [];
  if (!CONFIG.dryRun) {
    if (!CONFIG.githubToken) errors.push('GITHUB_TOKEN 未设置');
    if (!CONFIG.openrouterKey) errors.push('OPENROUTER_API_KEY 未设置');
  }
  if (!CONFIG.notifyTarget) errors.push('NOTIFY_TARGET 未设置');
  if (CONFIG.maxRepos < 1 || CONFIG.maxRepos > 20) errors.push('MAX_REPOS 必须是 1-20');
  
  if (errors.length > 0) {
    log.error('配置验证失败：');
    errors.forEach(e => log.error('  -', e));
    if (CONFIG.dryRun) {
      log.warn('Dry-run 模式继续（忽略部分验证）');
      return true;
    }
    return false;
  }
  return true;
}

// ============== 网络工具（带重试） ==============

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function httpsGetWithRetry(url, token, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log.debug(`GET ${url} (attempt ${attempt})`);
      const result = await httpsGet(url, token);
      return result;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      log.warn(`请求失败，${attempt * 2}s 后重试:`, err.message);
      await sleep(attempt * 2000);
    }
  }
}

function httpsGet(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'OpenClaw-HR-Agent',
        'Accept': 'application/vnd.github.v3+json',
        ...(token && { 'Authorization': `token ${token}` })
      },
      timeout: 10000 // 10s
    };
    
    const req = https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON 解析失败: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// ============== 业务逻辑 ==============

async function getTrending() {
  // Dry-run 模式：返回 mock 数据
  if (CONFIG.dryRun) {
    log.debug('Dry-run 模式，使用 mock 数据');
    return [
      {
        full_name: 'openclaw/openclaw',
        description: 'An AI agent platform for automation',
        language: 'TypeScript',
        stargazers_count: 1234,
        forks_count: 567,
        html_url: 'https://github.com/openclaw/openclaw'
      },
      {
        full_name: 'openai/openai-python',
        description: 'The official Python library for the OpenAI API',
        language: 'Python',
        stargazers_count: 9876,
        forks_count: 2345,
        html_url: 'https://github.com/openai/openai-python'
      },
      {
        full_name: 'vercel/next.js',
        description: 'The React Framework for the Web',
        language: 'TypeScript',
        stargazers_count: 15000,
        forks_count: 3200,
        html_url: 'https://github.com/vercel/next.js'
      }
    ].slice(0, CONFIG.maxRepos);
  }
  
  // 生产模式：真实 API
  const since = new Date();
  since.setDate(since.getDate() - 1);
  const dateStr = since.toISOString().split('T')[0];
  
  const query = `created:>=${dateStr} stars:>100 sort:stars-desc`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${CONFIG.maxRepos}&sort=stars&order=desc`;
  
  log.info('搜索 GitHub 热门仓库...');
  const result = await httpsGetWithRetry(url, CONFIG.githubToken);
  return result.items || [];
}

async function generateSummary(repo) {
  // Dry-run 模式：返回 mock 摘要
  if (CONFIG.dryRun) {
    return `这是一个 Dry-run 模拟摘要：${repo.description || '无描述'}。该项目使用 ${repo.language || '未知语言'}，拥有 ${repo.stargazers_count} 星，展示了极强的社区活跃度。代码质量高，文档完善，值得关注。`;
  }
  
  const prompt = `请用中文总结这个 GitHub 项目的亮点（3句话以内）：\n\n项目名称: ${repo.full_name}\n描述: ${repo.description || '无'}\n语言: ${repo.language || 'Unknown'}\n星数: ${repo.stargazers_count}\nFork: ${repo.forks_count}\n\n亮点：`;
  
  try {
    log.debug(`生成摘要: ${repo.full_name}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://openclaw.ai',
        'X-Title': 'OpenClaw HR Agent'
      },
      body: JSON.stringify({
        model: CONFIG.openrouterModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const result = await response.json();
    if (result.choices && result.choices[0] && result.choices[0].message) {
      return result.choices[0].message.content.trim();
    } else {
      throw new Error('API 返回格式错误');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      log.warn(`OpenRouter 超时: ${repo.full_name}`);
    } else {
      log.warn(`AI 摘要失败: ${repo.full_name} - ${err.message}`);
    }
    return 'AI 摘要暂不可用';
  }
}

async function sendNotification(notifications) {
  let message = '🔥 GitHub Trending 今日推荐\n\n';
  
  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    message += `${i+1}. ${n.repo.full_name}\n`;
    message += `   ⭐ ${n.repo.stargazers_count} | 🍴 ${n.repo.forks_count} | ${n.repo.language || 'Unknown'}\n`;
    message += `   📝 ${n.summary}\n`;
    message += `   🔗 ${n.repo.html_url}\n\n`;
  }
  
  if (CONFIG.dryRun) {
    console.log('\n=== DRY-RUN 模式（不发送）===\n');
    console.log(message);
    console.log('=== 结束 ===\n');
    return;
  }
  
  // 检测 OpenClaw 环境
  if (typeof message !== 'undefined' && message.send) {
    // OpenClaw 注入的全局 message 对象
    try {
      await message.send({
        channel: CONFIG.notifyChannel,
        target: CONFIG.notifyTarget,
        message: message
      });
      log.info('通知已发送');
    } catch (err) {
      log.error('发送失败:', err.message);
      throw err;
    }
  } else {
    // 非 OpenClaw 环境，直接输出
    console.log('\n=== 通知内容（未发送）===\n');
    console.log(message);
    console.log('=== 结束 ===\n');
    log.warn('未检测到 OpenClaw 环境，通知仅打印到控制台');
  }
}

// ============== 主流程 ==============

async function main() {
  console.log('🚀 GitHub Trending Notifier v1.1.0 (SOP 合规版)');
  console.log(`   模式: ${CONFIG.dryRun ? 'DRY-RUN' : '生产'}`);
  
  if (!validateConfig()) {
    process.exit(1);
  }
  
  try {
    const repos = await getTrending();
    log.info(`找到 ${repos.length} 个热门仓库`);
    
    if (repos.length === 0) {
      log.warn('无 trending 数据，退出');
      process.exit(0);
    }
    
    const notifications = [];
    for (const repo of repos.slice(0, CONFIG.maxRepos)) {
      log.info(`  [${notifications.length + 1}/${CONFIG.maxRepos}] ${repo.full_name} (⭐${repo.stargazers_count})`);
      const summary = await generateSummary(repo);
      notifications.push({ repo, summary });
      // 避免速率限制
      if (!CONFIG.dryRun && notifications.length < CONFIG.maxRepos) {
        await sleep(1000);
      }
    }
    
    await sendNotification(notifications);
    log.info('✅ 任务完成');
    process.exit(0);
    
  } catch (err) {
    log.error('未处理的错误:', err);
    process.exit(1);
  }
}

// 捕获未处理 rejection
process.on('unhandledRejection', (reason) => {
  log.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

main();
