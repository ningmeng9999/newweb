// Vercel Serverless Function - 真实全站访客计数（Vercel KV）
// 未配置KV时返回本地估算值，前端回退localStorage
const https = require('https');
const { URL } = require('url');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(data));
}

function kvConfigured() {
    return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

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

    const KEY = 'lengmeng_visitor_count_v1';

    // 未配置KV：返回提示，前端用localStorage
    if (!kvConfigured()) {
        sendJson(res, 200, { ok: false, mode: 'local', message: 'KV未配置，使用本地计数' });
        return;
    }

    try {
        if (req.method === 'POST') {
            // 自增计数（INCR）
            const result = await kvRequest('POST', '/incr/' + KEY);
            let count = 0;
            if (result.status === 200 && result.body) {
                count = parseInt(result.body.result, 10) || 0;
            }
            sendJson(res, 200, { ok: true, count, mode: 'vercel-kv' });
        } else {
            // GET：读取当前计数
            const result = await kvRequest('GET', '/get/' + KEY);
            let count = 0;
            if (result.status === 200 && result.body && result.body.result) {
                count = parseInt(result.body.result, 10) || 0;
            }
            sendJson(res, 200, { ok: true, count, mode: 'vercel-kv' });
        }
    } catch (e) {
        sendJson(res, 500, { ok: false, error: e.message, mode: 'error' });
    }
};
