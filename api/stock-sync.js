// Vercel Serverless Function - 股票数据云端同步（Vercel KV）
// 需在Vercel控制台创建KV数据库，自动注入环境变量：
//   KV_REST_API_URL, KV_REST_API_TOKEN
// 未配置时返回明确错误，前端自动回退localStorage
const https = require('https');
const { URL } = require('url');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// 检查KV是否配置
function kvConfigured() {
    return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// 调用KV REST API
function kvRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const base = process.env.KV_REST_API_URL.replace(/\/$/, '');
        const url = new URL(base + path);
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': 'Bearer ' + process.env.KV_REST_API_TOKEN,
                'Content-Type': 'application/json'
            }
        };
        if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null }); }
                catch (e) { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') { sendJson(res, 200, {}); return; }

    if (!kvConfigured()) {
        sendJson(res, 200, { error: 'KV_NOT_CONFIGURED', message: 'Vercel KV未配置，使用本地存储' });
        return;
    }

    const KEY = 'lengmeng_stock_data_v1';

    try {
        if (req.method === 'GET') {
            const result = await kvRequest('GET', '/get/' + KEY);
            if (result.status === 200 && result.body && result.body.result) {
                const data = JSON.parse(result.body.result);
                sendJson(res, 200, { ok: true, data, source: 'vercel-kv' });
            } else {
                sendJson(res, 200, { ok: true, data: null, source: 'vercel-kv' });
            }
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', async () => {
                try {
                    const payload = JSON.parse(body || '{}');
                    const dataStr = JSON.stringify({
                        favorites: payload.favorites || [],
                        history: payload.history || [],
                        strategies: payload.strategies || [],
                        updatedAt: new Date().toISOString()
                    });
                    const result = await kvRequest('POST', '/set/' + KEY, dataStr);
                    if (result.status === 200) {
                        sendJson(res, 200, { ok: true, source: 'vercel-kv', savedAt: new Date().toISOString() });
                    } else {
                        sendJson(res, 500, { error: 'KV_WRITE_FAILED', status: result.status });
                    }
                } catch (e) {
                    sendJson(res, 400, { error: 'INVALID_JSON', message: e.message });
                }
            });
        } else {
            sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
        }
    } catch (e) {
        sendJson(res, 500, { error: 'SERVER_ERROR', message: e.message });
    }
};
