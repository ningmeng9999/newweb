// api/_lib/kv.js
// Upstash Redis REST 封装（Vercel 集成后自动注入 KV_REST_API_URL / KV_REST_API_TOKEN）。
// 本文件不保存任何密钥：本地开发通过 .env 注入，线上通过 Vercel 环境变量注入。

const BASE = (process.env.KV_REST_API_URL || '').replace(/\/$/, '');
const TOKEN = process.env.KV_REST_API_TOKEN || '';

function isConfigured() {
    return Boolean(BASE && TOKEN);
}

async function request(method, path, body) {
    const resp = await fetch(BASE + path, {
        method,
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : body,
        signal: AbortSignal.timeout(8000),
    });
    const text = await resp.text();
    let payload = null;
    try {
        payload = text ? JSON.parse(text) : null;
    } catch {
        payload = text;
    }
    if (!resp.ok) {
        const msg = (payload && (payload.error || payload.message)) || `kv ${resp.status}`;
        throw new Error(msg);
    }
    return payload;
}

/** 读取并反序列化 JSON；不存在返回 fallback */
async function getJson(key, fallback = null) {
    const data = await request('GET', `/get/${encodeURIComponent(key)}`);
    const raw = data && data.result;
    if (raw === null || raw === undefined || raw === '') return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

/** 序列化写入 */
async function setJson(key, value) {
    await request('POST', `/set/${encodeURIComponent(key)}`, JSON.stringify(value));
    return value;
}

async function del(key) {
    await request('POST', `/del/${encodeURIComponent(key)}`);
}

/** 自增并返回新值 */
async function incr(key) {
    const data = await request('POST', `/incr/${encodeURIComponent(key)}`);
    return Number(data && data.result) || 0;
}

module.exports = { isConfigured, getJson, setJson, del, incr };
