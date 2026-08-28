// Vercel Serverless Function - 实时行情代理（腾讯财经）
const https = require('https');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const codes = (req.query.codes || '').trim();
    if (!codes) {
        sendJson(res, 400, { error: '缺少codes参数' });
        return;
    }

    // 腾讯财经实时行情（用http请求，服务端不受混合内容限制）
    const url = `http://qt.gtimg.cn/q=${codes}`;

    const reqProxy = https.get(url.replace('http://', 'https://'), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://gu.qq.com/'
        },
        timeout: 8000
    }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                // 腾讯返回的是 v_sh600519="1~贵州茅台~..." 格式
                const result = {};
                const lines = data.split(';');
                lines.forEach(line => {
                    const match = line.match(/v_(\w+)="([^"]*)"/);
                    if (match) {
                        const code = match[1];
                        const raw = match[2];
                        const f = raw.split('~');
                        if (f.length > 40) {
                            result[code] = {
                                name: f[1], code: f[2],
                                price: parseFloat(f[3]), prevClose: parseFloat(f[4]),
                                open: parseFloat(f[5]), volume: parseFloat(f[6]),
                                high: parseFloat(f[33]) || 0, low: parseFloat(f[34]) || 0,
                                amount: parseFloat(f[37]) || 0, turnover: parseFloat(f[38]) || 0,
                                pe: parseFloat(f[39]) || 0, amplitude: parseFloat(f[43]) || 0,
                                marketCap: parseFloat(f[44]) || 0, totalCap: parseFloat(f[45]) || 0,
                                pb: parseFloat(f[46]) || 0, volumeRatio: parseFloat(f[49]) || 0,
                                change: parseFloat(f[31]) || 0, changeRate: parseFloat(f[32]) || 0
                            };
                        }
                    }
                });
                sendJson(res, 200, result);
            } catch (e) {
                sendJson(res, 500, { error: '解析失败', raw: data.substring(0, 200) });
            }
        });
    });

    reqProxy.on('error', (err) => {
        // HTTPS失败时尝试HTTP
        const http = require('http');
        const reqFallback = http.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 8000
        }, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const result = {};
                    const lines = data.split(';');
                    lines.forEach(line => {
                        const match = line.match(/v_(\w+)="([^"]*)"/);
                        if (match) {
                            const code = match[1];
                            const raw = match[2];
                            const f = raw.split('~');
                            if (f.length > 40) {
                                result[code] = {
                                    name: f[1], code: f[2],
                                    price: parseFloat(f[3]), prevClose: parseFloat(f[4]),
                                    open: parseFloat(f[5]), volume: parseFloat(f[6]),
                                    high: parseFloat(f[33]) || 0, low: parseFloat(f[34]) || 0,
                                    amount: parseFloat(f[37]) || 0, turnover: parseFloat(f[38]) || 0,
                                    pe: parseFloat(f[39]) || 0, change: parseFloat(f[31]) || 0,
                                    changeRate: parseFloat(f[32]) || 0
                                };
                            }
                        }
                    });
                    sendJson(res, 200, result);
                } catch (e) {
                    sendJson(res, 500, { error: '解析失败', detail: e.message });
                }
            });
        });
        reqFallback.on('error', (err2) => {
            sendJson(res, 502, { error: '上游请求失败', detail: err.message });
        });
        reqFallback.on('timeout', () => { reqFallback.destroy(); sendJson(res, 504, { error: '超时' }); });
    });

    reqProxy.on('timeout', () => { reqProxy.destroy(); });
};
