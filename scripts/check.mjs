#!/usr/bin/env node
/**
 * 项目自检（CI 与本地都能跑）
 * ------------------------------------------------------------
 *   npm run check
 *
 * 1. 所有 JS 语法检查
 * 2. HTML 引用的本地资源是否都存在
 * 3. 是否有重复 id / 遗留的错误路径
 * 4. 页面外壳是否与模板同步
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const notes = [];

function walk(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

/* 1. 语法 */
const scripts = [...walk(join(ROOT, 'assets/js')), ...walk(join(ROOT, 'api')), ...walk(join(ROOT, 'scripts'))].filter(
    (f) => ['.js', '.mjs'].includes(extname(f))
);
for (const file of scripts) {
    try {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (e) {
        problems.push(`语法错误 ${file.replace(ROOT + '/', '')}\n${e.stderr?.toString().split('\n').slice(0, 3).join('\n')}`);
    }
}
notes.push(`JS 语法检查：${scripts.length} 个文件`);

/* 2 & 3. HTML 引用与重复 id */
const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
for (const page of pages) {
    const html = readFileSync(join(ROOT, page), 'utf8');
    // 内联脚本里会有拼接出来的 href（' + url + '），先剔除脚本与样式再扫属性
    const markup = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    const refs = [...markup.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    for (const ref of refs) {
        if (/^(https?:|mailto:|tel:|#|data:|javascript:)/.test(ref)) continue;
        const target = ref.split('#')[0].split('?')[0];
        if (!target) continue;
        if (!existsSync(join(ROOT, target))) problems.push(`${page} → 引用不存在的文件：${ref}`);
        if (target.includes('assets/assets')) problems.push(`${page} → 路径重复：${ref}`);
        if (/\/api\/[a-z-]+\.js/.test(target)) problems.push(`${page} → 接口不要带 .js：${ref}`);
    }

    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) problems.push(`${page} → 重复 id：${[...new Set(dup)].join(', ')}`);
}
notes.push(`HTML 检查：${pages.length} 个页面`);

/* 4. 外壳同步 */
try {
    execFileSync(process.execPath, [join(ROOT, 'scripts/sync-shell.mjs'), '--check'], { stdio: 'pipe' });
    notes.push('页面外壳：已同步');
} catch (e) {
    problems.push(e.stdout?.toString().trim() || '页面外壳未同步，运行 npm run sync');
}

/* 输出 */
console.log(notes.map((n) => `· ${n}`).join('\n'));
if (problems.length) {
    console.error('\n✗ 发现 ' + problems.length + ' 个问题：');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
}
console.log('\n✓ 全部通过');
