#!/usr/bin/env node
// OpenClaw GitHub Trending Notifier - Deploy script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT = 'openclaw-github-trending';
const REPO_URL = 'https://github.com/maichanks/openclaw-github-trending.git';
const INSTALL_DIR = path.join(process.env.HOME || '/home/admin', '.openclaw', 'workspace', 'skills', PROJECT);

console.log(`🚀 Deploying ${PROJECT}...`);

// 1. Clone
if (!fs.existsSync(INSTALL_DIR)) {
  console.log('📥 Cloning repository...');
  execSync(`git clone ${REPO_URL} "${INSTALL_DIR}"`, { stdio: 'inherit' });
} else {
  console.log('✅ Already exists, skipping clone');
}

// 2. Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('pnpm install', { cwd: INSTALL_DIR, stdio: 'inherit' });
} catch (e) {
  console.log('pnpm not found, trying npm...');
  execSync('npm install', { cwd: INSTALL_DIR, stdio: 'inherit' });
}

// 3. Copy .env example
const envExample = path.join(INSTALL_DIR, '.env.example');
const envTarget = path.join(INSTALL_DIR, '.env');
if (fs.existsSync(envExample) && !fs.existsSync(envTarget)) {
  console.log('🔧 Creating .env from example...');
  fs.copyFileSync(envExample, envTarget);
  console.log('⚠️ ACTION REQUIRED: Please edit .env:');
  console.log('   - NOTIFY_CHANNEL=feishu (or telegram/discord/slack)');
  console.log('   - NOTIFY_TARGET=ou_OPEN_ID  (your open_id)');
  console.log('   - OPENROUTER_API_KEY=... (optional for AI summaries)');
} else {
  console.log('✅ .env already exists');
}

// 4. Done
console.log('\n✅ Deployment complete!');
console.log('\n📝 Next steps:');
console.log(`   1. Review .env: ${envTarget}`);
console.log(`   2. Test: node ${path.join(INSTALL_DIR, 'src/index.js')}`);
console.log(`   3. Add to cron: openclaw cron add --name "GitHub Trending" --cron "0 9 * * *" --session isolated --message "node ${ path.join(INSTALL_DIR, 'src/index.js') }"`);
