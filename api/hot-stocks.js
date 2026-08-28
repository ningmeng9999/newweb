// Vercel Serverless Function - 热门股票排行（东方财富人气榜 + 同花顺热榜）
const http = require('http');
const https = require('https');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function httpGet(url, options = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': options.referer || 'https://www.eastmoney.com/',
                ...options.headers
            },
            timeout: 10000
        }, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve({ status: response.statusCode, data }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

// 东方财富A股人气榜
async function fetchEastmoneyHot(size = 30) {
    const url = `https://datacenter.eastmoney.com/securities/api/data/v1/get?type=RPT_RANK_ASHARES_HUMAN&sty=SECUCODE,SECUNAME,NEWPRICE,CHANGEPERCENT,HUMANVALUE,UPDATE_DATE&p=1&ps=${size}&source=HSF10&client=PC`;
    try {
        const { data } = await httpGet(url, { referer: 'https://data.eastmoney.com/' });
        const json = JSON.parse(data);
        if (json.result && json.result.data && Array.isArray(json.result.data)) {
            return json.result.data.map(item => ({
                code: item.SECUCODE ? item.SECUCODE.replace('.', '').toLowerCase() : '',
                name: item.SECUNAME || '',
                price: item.NEWPRICE || 0,
                changeRate: item.CHANGEPERCENT || 0,
                hotValue: item.HUMANVALUE || 0,
                source: '东方财富'
            })).filter(s => s.code);
        }
    } catch (e) {
        console.warn('东方财富人气榜失败:', e.message);
    }
    return [];
}

// 同花顺热榜（通过网页API）
async function fetchTHSHot(size = 30) {
    // 同花顺热榜API - 10jqka
    const url = `https://dq.10jqka.com.cn/fuyao/hot_list_data/out/hot_list/v1/stock?stock_type=a&type=hour&list_size=${size}`;
    try {
        const { data } = await httpGet(url, {
            referer: 'https://www.10jqka.com.cn/',
            headers: { 'hexin-v': 'A' }
        });
        const json = JSON.parse(data);
        if (json.data && json.data.stock_list && Array.isArray(json.data.stock_list)) {
            return json.data.stock_list.map(item => ({
                code: item.code ? (item.code.startsWith('6') || item.code.startsWith('9') ? 'sh' : 'sz') + item.code : '',
                name: item.name || '',
                price: item.price || 0,
                changeRate: item.ud_rate || 0,
                hotValue: item.hot || 0,
                source: '同花顺'
            })).filter(s => s.code);
        }
    } catch (e) {
        console.warn('同花顺热榜失败:', e.message);
    }
    return [];
}

// 雪球热门讨论股票
async function fetchXueqiuHot(size = 20) {
    // 雪球热门股票 - 需要cookie，这里用公开的热门话题接口
    const url = 'https://xueqiu.com/statuses/hot/listV2.json?since_id=-1&max_id=-1&size=' + size;
    try {
        const { data } = await httpGet(url, { referer: 'https://xueqiu.com/' });
        const json = JSON.parse(data);
        if (json.items && Array.isArray(json.items)) {
            const stocks = [];
            json.items.forEach(item => {
                if (item.target && item.target.symbol) {
                    const sym = item.target.symbol;
                    if (sym.startsWith('SH') || sym.startsWith('SZ')) {
                        stocks.push({
                            code: sym.toLowerCase(),
                            name: item.target.name || '',
                            price: 0,
                            changeRate: 0,
                            hotValue: item.target.view_count || item.target.reply_count || 0,
                            source: '雪球'
                        });
                    }
                }
            });
            return stocks;
        }
    } catch (e) {
        console.warn('雪球热门失败:', e.message);
    }
    return [];
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

    const source = (req.query.source || 'all').toLowerCase();
    const size = Math.min(parseInt(req.query.size) || 30, 50);

    try {
        let results = [];
        let eastmoney = [], ths = [], xueqiu = [];

        // 并行获取多个来源
        const tasks = [];
        if (source === 'all' || source === 'eastmoney') tasks.push(fetchEastmoneyHot(size).then(r => eastmoney = r));
        if (source === 'all' || source === 'ths') tasks.push(fetchTHSHot(size).then(r => ths = r));
        if (source === 'all' || source === 'xueqiu') tasks.push(fetchXueqiuHot(size).then(r => xueqiu = r));

        await Promise.allSettled(tasks);

        if (source === 'eastmoney') results = eastmoney;
        else if (source === 'ths') results = ths;
        else if (source === 'xueqiu') results = xueqiu;
        else {
            // 合并去重，按热度排序
            const map = new Map();
            [...eastmoney, ...ths, ...xueqiu].forEach(s => {
                if (!map.has(s.code)) {
                    map.set(s.code, { ...s, sources: [s.source] });
                } else {
                    const existing = map.get(s.code);
                    existing.hotValue = Math.max(existing.hotValue, s.hotValue);
                    if (!existing.sources.includes(s.source)) existing.sources.push(s.source);
                }
            });
            results = Array.from(map.values()).sort((a, b) => b.hotValue - a.hotValue).slice(0, size);
        }

        sendJson(res, 200, {
            success: true,
            source: source,
            count: results.length,
            sources_used: {
                eastmoney: eastmoney.length,
                ths: ths.length,
                xueqiu: xueqiu.length
            },
            data: results
        });
    } catch (e) {
        sendJson(res, 500, { success: false, error: e.message, data: [] });
    }
};
