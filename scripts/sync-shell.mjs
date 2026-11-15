#!/usr/bin/env node
/**
 * 页面外壳同步器
 * ------------------------------------------------------------
 * 全站 13 个页面共用同一份侧边栏与脚本清单，避免"改一处漏十二处"。
 * 唯一数据源：templates/shell/sidebar.html、templates/shell/scripts.html
 *
 * 用法：
 *   node scripts/sync-shell.mjs          写入所有页面
 *   node scripts/sync-shell.mjs --check  只校验（CI 用），不一致则退出码 1
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const sidebar = readFileSync(join(ROOT, 'templates/shell/sidebar.html'), 'utf8').trimEnd();
const scripts = readFileSync(join(ROOT, 'templates/shell/scripts.html'), 'utf8').trimEnd();

/** 页面专属脚本：存在 assets/js/pages/<页面名>.js 就自动挂载，无需改 13 个页面 */
function pageScript(page) {
    const rel = `assets/js/pages/${page}.js`;
    return existsSync(join(ROOT, rel))
        ? `<script src="./${rel}"></script>\n    <!-- shell:scripts:end -->`
        : '<!-- shell:scripts:end -->';
}

const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
let dirty = 0;

for (const file of pages) {
    const path = join(ROOT, file);
    const page = basename(file, '.html');
    const src = readFileSync(path, 'utf8');
    let out = src;

    out = out.replace(
        /(<!-- shell:sidebar:start[^>]*-->\n)[\s\S]*?(\n[ \t]*<!-- shell:sidebar:end -->)/,
        (_m, a, b) => a + sidebar + b
    );

    out = out.replace(
        /([ \t]*<!-- shell:scripts:start[^>]*-->\n)[\s\S]*?([ \t]*<!-- shell:scripts:end -->)/,
        (_m, a) => a + scripts + '\n    ' + pageScript(page)
    );

    if (out !== src) {
        dirty++;
        if (CHECK) console.log(`✗ 待同步：${file}`);
        else {
            writeFileSync(path, out, 'utf8');
            console.log(`✓ 已同步：${file}`);
        }
    }
}

if (CHECK && dirty) {
    console.error(`\n${dirty} 个页面外壳与模板不一致，请运行：node scripts/sync-shell.mjs`);
    process.exit(1);
}
console.log(dirty ? '' : '所有页面外壳已是最新');
