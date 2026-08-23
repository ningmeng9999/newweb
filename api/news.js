// Vercel Serverless Function - 财经新闻代理（新浪财经API）
const http = require('http');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const lid = req.query.lid || '2516';
    const num = parseInt(req.query.num) || 30;
    const page = parseInt(req.query.page) || 1;

    const path = '/api/roll/get?pageid=153&lid=' + lid + '&num=' + num + '&page=' + page;

    const options = {
        hostname: 'feed.mix.sina.com.cn',
        path: path,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://finance.sina.com.cn/'
        },
        timeout: 15000
    };

    const reqProxy = http.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
            try {
                const json = JSON.parse(data);
                sendJson(res, 200, json);
            } catch (e) {
                sendJson(res, 500, { error: '解析失败', detail: e.message, raw: data.substring(0, 200) });
            }
        });
    });

    reqProxy.on('error', (err) => {
        sendJson(res, 502, { error: '请求失败', detail: err.message, code: err.code });
    });

    reqProxy.on('timeout', () => {
        reqProxy.destroy();
        sendJson(res, 504, { error: '超时' });
    });

    reqProxy.end();
};
