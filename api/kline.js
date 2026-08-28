// Vercel Serverless Function - K线数据代理（腾讯财经）
const https = require('https');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

module.exports = (req, res) => {
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

    // 腾讯财经日K线API（前复权）
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,,,${days},qfq`;

    const reqProxy = https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://gu.qq.com/'
        },
        timeout: 10000
    }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                const json = JSON.parse(data);
                // 直接透传原始数据，前端自己解析
                sendJson(res, 200, json);
            } catch (e) {
                sendJson(res, 500, { error: '解析失败', raw: data.substring(0, 200) });
            }
        });
    });

    reqProxy.on('error', (err) => {
        sendJson(res, 502, { error: '上游请求失败', detail: err.message });
    });

    reqProxy.on('timeout', () => {
        reqProxy.destroy();
        sendJson(res, 504, { error: '上游超时' });
    });
};
