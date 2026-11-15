/**
 * 相册/歌单/漫剧封面缩略图生成器（一次性工具）
 * ------------------------------------------------------------
 * 相册的 43 张本地缩略图就是用它从现有图片裁切生成的。
 * 以后换了新照片想重新生成：npm i -D playwright-core && node scripts/generate-thumbs.mjs
 * （需要本机装有 Edge；生成完记得 npm uninstall playwright-core）
 */

import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const pool = readdirSync('assets/img').filter(f => f.endsWith('.webp') && !f.startsWith('album')).map(f => 'assets/img/' + f);

// album: 30 张，尺寸沿用原 picsum 的构图比例
const specs = [
  ...Array.from({ length: 30 }, (_, i) => {
    const [w, h] = [[400, 300], [400, 500], [400, 300], [600, 300], [400, 300], [400, 500]][i % 6];
    return { out: `assets/img/album/life${String(i + 1).padStart(2, '0')}.webp`, w, h, seed: i };
  }),
  ...Array.from({ length: 5 }, (_, i) => ({ out: `assets/img/album/cover${i + 1}.webp`, w: 400, h: 400, seed: 100 + i })),
  ...Array.from({ length: 8 }, (_, i) => ({ out: `assets/img/album/comic${i + 1}.webp`, w: 300, h: 420, seed: 200 + i })),
];

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
const cache = new Map();
let total = 0;

for (const s of specs) {
  const src = pool[s.seed % pool.length];
  if (!cache.has(src)) cache.set(src, 'data:image/webp;base64,' + readFileSync(src).toString('base64'));
  const b64 = await page.evaluate(async ({ dataUrl, w, h, seed }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    // 按目标比例从原图裁一块，位置按 seed 偏移，让 30 张看起来不重复
    const targetRatio = w / h;
    let sw = img.naturalWidth, sh = Math.round(sw / targetRatio);
    if (sh > img.naturalHeight) { sh = img.naturalHeight; sw = Math.round(sh * targetRatio); }
    const maxX = img.naturalWidth - sw, maxY = img.naturalHeight - sh;
    const sx = maxX > 0 ? Math.round((seed * 37) % maxX) : 0;
    const sy = maxY > 0 ? Math.round((seed * 53) % maxY) : 0;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    return canvas.toDataURL('image/webp', 0.72).split(',')[1];
  }, { dataUrl: cache.get(src), w: s.w, h: s.h, seed: s.seed });

  const buf = Buffer.from(b64, 'base64');
  writeFileSync(s.out, buf);
  total += buf.length;
}
await browser.close();
console.log(`${specs.length} 张，合计 ${(total / 1024).toFixed(0)}KB，平均 ${(total / specs.length / 1024).toFixed(0)}KB`);
