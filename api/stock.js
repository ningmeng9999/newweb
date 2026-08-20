// Vercel Serverless Function - 股票行情代理（新浪财经API）
// 兼容纯Node.js和Vercel环境
const http = require('http');

// 兼容方法：res.status().json() 在纯Node.js中不存在
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

module.exports = (req, res) => {
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 100;

    // 新浪财经沪深A股列表接口
    const path = '/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=' + page + '&num=' + size + '&sort=changepercent&asc=0&node=hs_a&symbol=&_s_r_a=page';

    const options = {
        hostname: 'vip.stock.finance.sina.com.cn',
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
                // 新浪返回的是JSON数组
                const list = JSON.parse(data);
                if (!Array.isArray(list)) {
                    sendJson(res, 500, { error: '返回格式不是数组', raw: data.substring(0, 300) });
                    return;
                }
                // 转换为东方财富格式，兼容前端代码
                const converted = list.map(item => ({
                    f12: item.code || '',
                    f14: item.name || '',
                    f2: parseFloat(item.trade) || 0,
                    f3: parseFloat(item.changepercent) || 0,
                    f4: parseFloat(item.pricechange) || 0,
                    f5: parseFloat(item.volume) || 0,
                    f6: parseFloat(item.amount) || 0,
                    f7: 0,
                    f8: parseFloat(item.turnoverratio) || 0,
                    f9: parseFloat(item.per) || 0,
                    f10: 0,
                    f15: parseFloat(item.high) || 0,
                    f16: parseFloat(item.low) || 0,
                    f17: parseFloat(item.open) || 0,
                    f18: parseFloat(item.settlement) || 0,
                    f20: (parseFloat(item.mktcap) || 0) * 10000,
                    f21: (parseFloat(item.nmc) || 0) * 10000,
                    f23: parseFloat(item.pb) || 0
                }));
                sendJson(res, 200, { rc: 0, data: { total: -1, diff: converted } });
            } catch (e) {
                sendJson(res, 500, { error: '数据解析失败', detail: e.message, raw: data.substring(0, 300) });
            }
        });
    });

    reqProxy.on('error', (err) => {
        sendJson(res, 502, { error: '上游API请求失败', detail: err.message, code: err.code });
    });

    reqProxy.on('timeout', () => {
        reqProxy.destroy();
        sendJson(res, 504, { error: '上游API超时（15秒）' });
    });

    reqProxy.end();
};
