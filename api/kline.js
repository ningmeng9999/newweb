// Vercel Serverless Function - K线数据代理（腾讯财经）
const https = require('https');
const http = require('http');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://gu.qq.com/'
            },
            timeout: 10000
        }, (response) => {
            const chunks = [];
            response.on('data', c => chunks.push(c));
            response.on('end', () => {
                const buf = Buffer.concat(chunks);
                let text;
                try { text = new TextDecoder('utf-8').decode(buf); } catch(e) { text = buf.toString(); }
                resolve({ status: response.statusCode, text });
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=60');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const code = req.query.code || '';
    const days = Math.min(parseInt(req.query.days) || 60, 250);

    if (!code) {
        sendJson(res, 400, { error: '缺少code参数' });
        return;
    }

    try {
        const httpsUrl = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,,,${days},qfq`;
        let result;
        try {
            result = await fetchUrl(httpsUrl);
        } catch (e) {
            // HTTPS失败回退HTTP
            const httpUrl = httpsUrl.replace('https://', 'http://');
            result = await fetchUrl(httpUrl);
        }
        const json = JSON.parse(result.text);
        sendJson(res, 200, json);
    } catch (e) {
        sendJson(res, 502, { error: 'K线获取失败', detail: e.message, data: {} });
    }
};
