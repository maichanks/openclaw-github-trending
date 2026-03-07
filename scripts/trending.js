#!/usr/bin/env node

/**
 * GitHub Trending Notifier
 * 获取 Trending Repos，生成 AI 摘要，推送到指定频道
 */

require('dotenv').config();

const https = require('https');
const { spawn } = require('child_process');

const CONFIG = {
  githubToken: process.env.GITHUB_TOKEN,
  openrouterKey: process.env.OPENROUTER_API_KEY,
  notifyChannel: process.env.NOTIFY_CHANNEL || 'telegram',
  notifyTarget: process.env.NOTIFY_TARGET,
  maxRepos: 5,
  openrouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
};

// 工具：HTTPS GET
function httpsGet(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'OpenClaw-HR-Agent',
        'Accept': 'application/vnd.github.v3+json',
        ...(token && { 'Authorization': `token ${token}` })
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// 1. 获取 Trending（使用搜索 API，按 stars 排序，时间范围 daily）
async function getTrending() {
  const since = new Date();
  since.setDate(since.getDate() - 1);
  const dateStr = since.toISOString().split('T')[0];
  
  // 搜索近期 stars 增长最快的 repo
  const query = `created:>=${dateStr} stars:>100 sort:stars-desc`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${CONFIG.maxRepos}`;
  
  try {
    const result = await httpsGet(url, CONFIG.githubToken);
    return result.items;
  } catch (err) {
    console.error('❌ 获取 trending 失败:', err.message);
    return [];
  }
}

// 2. AI 生成摘要
async function generateSummary(repo) {
  const prompt = `请用中文总结这个 GitHub 项目的亮点（3句话以内）：\n\n项目名称: ${repo.full_name}\n描述: ${repo.description || '无'}\n语言: ${repo.language || 'Unknown'}\n星数: ${repo.stargazers_count}\nFork: ${repo.forks_count}\n\n亮点：`;
  
  try {
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
        max_tokens: 150
      })
    });
    
    const result = await response.json();
    if (result.choices && result.choices[0]) {
      return result.choices[0].message.content.trim();
    } else {
      throw new Error('No choices');
    }
  } catch (err) {
    console.error('❌ AI 生成摘要失败:', err.message);
    return 'AI 摘要暂不可用';
  }
}

// 3. 发送通知（通过 OpenClaw message 工具）
async function sendNotification(notifications) {
  // 构建消息
  let message = '🔥 GitHub Trending 今日推荐\n\n';
  
  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    message += `${i+1}. ${n.repo.full_name}\n`;
    message += `   ⭐ ${n.repo.stargazers_count} | 🍴 ${n.repo.forks_count} | ${n.repo.language || 'Unknown'}\n`;
    message += `   📝 ${n.summary}\n`;
    message += `   🔗 ${n.repo.html_url}\n\n`;
  }
  
  // 通过 OpenClaw message 工具发送
  // 使用全局 message 函数（由 OpenClaw 注入）
  if (typeof message !== 'undefined' && message.send) {
    await message.send({
      channel: CONFIG.notifyChannel,
      target: CONFIG.notifyTarget,
      message: message
    });
  } else {
    console.log('📢 通知内容:\n', message);
  }
}

// 主流程
async function main() {
  console.log('🚀 开始获取 GitHub Trending...');
  
  if (!CONFIG.githubToken) {
    console.error('❌ 缺少 GITHUB_TOKEN');
    process.exit(1);
  }
  
  const repos = await getTrending();
  console.log(`✅ 找到 ${repos.length} 个热门仓库`);
  
  if (repos.length === 0) {
    console.log('⚠️ 无 trending 数据');
    process.exit(0);
  }
  
  // 为每个 repo 生成摘要
  const notifications = [];
  for (const repo of repos.slice(0, CONFIG.maxRepos)) {
    console.log(`  ├ ${repo.full_name} (⭐ ${repo.stargazers_count})`);
    const summary = await generateSummary(repo);
    notifications.push({ repo, summary });
    // 避免速率限制
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // 发送通知
  await sendNotification(notifications);
  
  console.log('✅ Trending 通知完成');
}

main().catch(err => {
  console.error('❌ 出错:', err);
  process.exit(1);
});
