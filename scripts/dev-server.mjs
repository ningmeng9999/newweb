#!/usr/bin/env node
/**
 * 本地开发服务器（零依赖）
 * ------------------------------------------------------------
 *   npm run dev
 *
 * - 静态资源与 Vercel 行为对齐：/about 等价于 /about.html（cleanUrls）
 * - /api/xxx 直接调用 api/xxx.js，无需部署即可调试接口
 * - 自动加载 .env（本地密钥不要提交到仓库）
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import zlib from 'node:zlib';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 4000);

/* ---------------- .env ---------------- */
const envPath = join(ROOT, '.env');
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (m && !line.trim().startsWith('#')) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
    }
    console.log('· 已加载 .env');
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.woff2': 'font/woff2',
};

/* ---------------- API ---------------- */
const apiCache = new Map();

async function loadHandler(file) {
    if (apiCache.has(file)) return apiCache.get(file);
    const mod = await import(pathToFileURL(file).href);
    const handler = mod.default || mod;
    if (typeof handler !== 'function') throw new Error('未导出处理函数');
    apiCache.set(file, handler);
    return handler;
}

/** 把原生 req 包装成 Vercel 风格（补 query / body / 可重复读取的流） */
function wrapRequest(req, raw) {
    const parsed = new URL(req.url, 'http://localhost');
    return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: Object.fromEntries(parsed.searchParams),
        body: (() => {
            try {
                return raw ? JSON.parse(raw) : {};
            } catch {
                return {};
            }
        })(),
        on(event, fn) {
            if (event === 'data' && raw) fn(raw);
            if (event === 'end') fn();
            return this;
        },
        destroy() {},
    };
}

function decorateResponse(res) {
    res.status = (code) => ((res.statusCode = code), res);
    res.json = (obj) => {
        if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(obj));
        return res;
    };
    res.send = (data) => res.end(typeof data === 'string' ? data : JSON.stringify(data));
    return res;
}

async function handleApi(req, res, pathname) {
    const rel = pathname.replace(/^\/api\//, '');
    const file = join(ROOT, 'api', normalize(rel) + '.js');
    if (!file.startsWith(join(ROOT, 'api')) || !existsSync(file)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify({ error: 'API_NOT_FOUND', path: pathname }));
    }
    const raw = await new Promise((resolve) => {
        let buf = '';
        req.on('data', (c) => (buf += c));
        req.on('end', () => resolve(buf));
    });
    try {
        const handler = await loadHandler(file);
        await handler(wrapRequest(req, raw), decorateResponse(res));
    } catch (e) {
        console.error(`[api] ${pathname} →`, e);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: e.message }));
        }
    }
}

/* ---------------- 静态 ---------------- */
async function resolveStatic(pathname) {
    const clean = decodeURIComponent(pathname.split('?')[0]);
    let file = join(ROOT, normalize(clean));
    if (!file.startsWith(ROOT)) return null;
    const candidates = [];
    if (clean.endsWith('/')) candidates.push(join(file, 'index.html'));
    else {
        candidates.push(file);
        if (!extname(file)) candidates.push(file + '.html', join(file, 'index.html'));
    }
    for (const c of candidates) {
        try {
            const s = await stat(c);
            if (s.isFile()) return c;
        } catch {
            /* 继续 */
        }
    }
    return null;
}

const server = http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname.startsWith('/api/')) return handleApi(req, res, pathname);

    const file = await resolveStatic(pathname);
    if (!file) {
        const notFound = join(ROOT, '404.html');
        res.statusCode = 404;
        if (existsSync(notFound)) return createReadStream(notFound).pipe(res.setHeader('Content-Type', 'text/html; charset=utf-8'));
        return res.end('404 Not Found');
    }
    res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');

    // 与 Vercel 对齐：文本资源走 gzip，本地预览速度才接近线上
    const ext = extname(file).toLowerCase();
    const compressible = ['.html', '.css', '.js', '.mjs', '.json', '.svg', '.txt', '.xml'].includes(ext);
    if (compressible && /gzip/.test(req.headers['accept-encoding'] || '')) {
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        return createReadStream(file).pipe(zlib.createGzip({ level: 9 })).pipe(res);
    }
    createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
    console.log(`\n  LengMeng 本地预览  →  http://localhost:${PORT}\n`);
});
