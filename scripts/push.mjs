#!/usr/bin/env node
/**
 * 一键同步到 GitHub
 * ------------------------------------------------------------
 * 用法：
 *   npm run push                 自动生成提交信息
 *   npm run push -- "改了什么"    自定义提交信息
 *
 * 做的事情：暂存全部改动 → 有改动就提交 → 推送到 origin/main
 * 首次推送前需要登录一次 GitHub（凭据会被系统记住，之后不再询问）
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));

function run(cmd, { silent = false } = {}) {
    try {
        return execSync(cmd, { cwd, encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
    } catch (err) {
        if (silent) return null;
        process.exit(err.status || 1);
    }
}

const message = process.argv.slice(2).join(' ').trim() || `更新站点内容 ${new Date().toLocaleString('zh-CN')}`;

console.log('▸ 检查改动…');
run('git add -A');

// git diff --cached --quiet 返回 0 表示暂存区没有改动
const hasChanges = run('git diff --cached --quiet', { silent: true }) === null;

if (hasChanges) {
    console.log(`▸ 提交：${message}`);
    run(`git commit -q -m ${JSON.stringify(message)}`);
} else {
    console.log('▸ 没有新改动，跳过提交');
}

console.log('▸ 推送到 GitHub…');
run('git push origin main');

console.log('\n✓ 完成。Vercel 会在 1 分钟内自动重新部署。');
