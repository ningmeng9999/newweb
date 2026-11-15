// api/_lib/http.js
// 统一的响应 / CORS / 请求体解析。所有 API 共用，避免每个文件重复实现。
// 注意：_lib 目录以 _ 开头，Vercel 不会把它当作独立函数部署。

const CORS_METHODS = 'GET, POST, DELETE, OPTIONS';

function applyCors(res, methods = CORS_METHODS) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * @param {import('http').ServerResponse} res
 * @param {number} status
 * @param {any} data
 * @param {Record<string,string>} [headers]
 */
function sendJson(res, status, data, headers = {}) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.end(JSON.stringify(data));
}

/** OPTIONS 预检；返回 true 表示已处理完毕 */
function handlePreflight(req, res, methods) {
    applyCors(res, methods);
    if (req.method === 'OPTIONS') {
        sendJson(res, 200, { ok: true });
        return true;
    }
    return false;
}

/** 读取并解析 JSON 请求体（空体返回 {}） */
function readJson(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (chunk) => {
            raw += chunk;
            if (raw.length > 1e6) {
                reject(new Error('payload too large'));
                req.destroy();
            }
        });
        req.on('end', () => {
            if (!raw) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch (e) {
                reject(new Error('invalid json'));
            }
        });
        req.on('error', reject);
    });
}

/** 带超时的上游请求（对外部行情/新闻接口统一封装） */
async function fetchJson(url, { timeout = 8000, headers = {} } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const resp = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0', ...headers },
        });
        if (!resp.ok) throw new Error(`upstream ${resp.status}`);
        return await resp.json();
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { applyCors, sendJson, handlePreflight, readJson, fetchJson };
