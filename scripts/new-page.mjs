#!/usr/bin/env node
/**
 * 新建页面脚手架
 * ------------------------------------------------------------
 *   node scripts/new-page.mjs stocks "股票观察"
 *   node scripts/new-page.mjs stocks "股票观察" --js    # 同时创建 assets/js/pages/stocks.js
 *
 * 生成后：
 *   1) 在 templates/shell/sidebar.html 里加一条导航
 *   2) node scripts/sync-shell.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [name, title, ...flags] = process.argv.slice(2);

if (!name || !title) {
    console.error('用法：node scripts/new-page.mjs <文件名> "<页面标题>" [--js]');
    process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('文件名只能包含小写字母、数字与连字符，例如 stock-note');
    process.exit(1);
}

const pagePath = join(ROOT, `${name}.html`);
if (existsSync(pagePath)) {
    console.error(`已存在：${name}.html`);
    process.exit(1);
}

const tpl = readFileSync(join(ROOT, 'templates/page.html'), 'utf8');
const html = tpl
    .replaceAll('{{TITLE}}', title)
    .replaceAll('{{NAME}}', name)
    .replaceAll('{{DESC}}', `${title} - LengMeng 的个人站点`);
writeFileSync(pagePath, html, 'utf8');
console.log(`✓ 已创建 ${name}.html`);

if (flags.includes('--js')) {
    const dir = join(ROOT, 'assets/js/pages');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const jsPath = join(dir, `${name}.js`);
    writeFileSync(
        jsPath,
        `// ${title} 页面专属脚本\n// 由 scripts/sync-shell.mjs 自动挂载到 ${name}.html，无需手改 HTML。\n\n(function () {\n    'use strict';\n\n    document.addEventListener('DOMContentLoaded', function () {\n        // 在这里初始化\n    });\n})();\n`,
        'utf8'
    );
    console.log(`✓ 已创建 assets/js/pages/${name}.js`);
}

console.log('\n下一步：');
console.log('  1. 在 templates/shell/sidebar.html 里加一条导航项');
console.log('  2. node scripts/sync-shell.mjs');
