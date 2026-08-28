// Vercel Serverless Function - 实时行情代理（腾讯财经，GBK解码）
const https = require('https');
const http = require('http');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

// 解析腾讯行情原始字符串
function parseQuote(rawText) {
    const result = {};
    const lines = rawText.split(';');
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
    return result;
}

// 带GBK解码的请求
function fetchGBK(url, useHttps = true) {
    return new Promise((resolve, reject) => {
        const client = useHttps ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://gu.qq.com/'
            },
            timeout: 8000
        }, (response) => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => {
                const buf = Buffer.concat(chunks);
                try {
                    // 尝试GBK解码
                    const decoder = new TextDecoder('gbk');
                    const text = decoder.decode(buf);
                    resolve(text);
                } catch (e) {
                    // 回退UTF-8
                    resolve(buf.toString('utf-8'));
                }
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

    try {
        // 优先HTTPS
        let text;
        try {
            text = await fetchGBK(`https://qt.gtimg.cn/q=${codes}`, true);
        } catch (e) {
            // HTTPS失败回退HTTP
            text = await fetchGBK(`http://qt.gtimg.cn/q=${codes}`, false);
        }
        const result = parseQuote(text);
        if (Object.keys(result).length === 0) {
            sendJson(res, 502, { error: '未解析到行情数据', raw: text.substring(0, 200) });
            return;
        }
        sendJson(res, 200, result);
    } catch (e) {
        sendJson(res, 502, { error: '上游请求失败', detail: e.message });
    }
};
