// Vercel Serverless Function - 热门股票排行（多来源）
const https = require('https');
const http = require('http');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function fetchUrl(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': opts.referer || 'https://www.eastmoney.com/',
                ...opts.headers
            },
            timeout: 8000
        }, (response) => {
            const chunks = [];
            response.on('data', c => chunks.push(c));
            response.on('end', () => {
                const buf = Buffer.concat(chunks);
                let text;
                try { text = new TextDecoder('gbk').decode(buf); } catch(e) { text = buf.toString('utf-8'); }
                resolve({ status: response.statusCode, text });
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

// 东方财富A股人气榜
async function fetchEastmoney(size = 30) {
    const url = `https://datacenter-web.eastmoney.com/api/data/v1/get?sortColumns=HUMANVALUE&sortTypes=-1&pageSize=${size}&pageNumber=1&reportName=RPT_RANK_ASHARES_HUMAN&columns=SECUCODE,SECUNAME,NEWPRICE,CHANGEPERCENT,HUMANVALUE&source=WEB&client=WEB`;
    try {
        const { text } = await fetchUrl(url, { referer: 'https://data.eastmoney.com/' });
        const json = JSON.parse(text);
        if (json.result && json.result.data && Array.isArray(json.result.data)) {
            return json.result.data.map(item => {
                const secuCode = item.SECUCODE || '';
                const parts = secuCode.split('.');
                const code = parts.length === 2 ? parts[1].toLowerCase() + parts[0] : secuCode.toLowerCase();
                return {
                    code: code,
                    name: item.SECUNAME || '',
                    price: item.NEWPRICE || 0,
                    changeRate: item.CHANGEPERCENT || 0,
                    hotValue: item.HUMANVALUE || 0,
                    source: '东方财富'
                };
            }).filter(s => s.code && s.name);
        }
    } catch (e) {
        console.warn('东方财富人气榜失败:', e.message);
    }
    return [];
}

// 同花顺热榜
async function fetchTHS(size = 30) {
    const url = `https://dq.10jqka.com.cn/fuyao/hot_list_data/out/hot_list/v1/stock?stock_type=a&type=hour&list_size=${size}`;
    try {
        const { text } = await fetchUrl(url, {
            referer: 'https://www.10jqka.com.cn/',
            headers: { 'hexin-v': 'A', 'Accept': 'application/json' }
        });
        const json = JSON.parse(text);
        if (json.data && json.data.stock_list && Array.isArray(json.data.stock_list)) {
            return json.data.stock_list.map(item => {
                const code = item.code || '';
                const prefix = code.startsWith('6') || code.startsWith('9') ? 'sh' : (code.startsWith('0') || code.startsWith('3') ? 'sz' : 'bj');
                return {
                    code: prefix + code,
                    name: item.name || '',
                    price: item.price || 0,
                    changeRate: item.ud_rate || 0,
                    hotValue: item.hot || item.rank || 0,
                    source: '同花顺'
                };
            }).filter(s => s.code && s.name);
        }
    } catch (e) {
        console.warn('同花顺热榜失败:', e.message);
    }
    return [];
}

// 东方财富热门股票（按涨幅/成交额，作为第二来源）
async function fetchEastmoneyHot(size = 30) {
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${size}&po=1&np=1&fltt=2&invt=2&fid=f6&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f2,f3,f12,f14,f6`;
    try {
        const { text } = await fetchUrl(url, { referer: 'https://quote.eastmoney.com/' });
        const json = JSON.parse(text);
        if (json.data && json.data.diff && Array.isArray(json.data.diff)) {
            return json.data.diff.map(item => {
                const code = item.f12 || '';
                const prefix = code.startsWith('6') || code.startsWith('9') ? 'sh' : (code.startsWith('0') || code.startsWith('3') ? 'sz' : 'bj');
                return {
                    code: prefix + code,
                    name: item.f14 || '',
                    price: item.f2 || 0,
                    changeRate: item.f3 || 0,
                    hotValue: item.f6 || 0,
                    source: '成交额榜'
                };
            }).filter(s => s.code && s.name);
        }
    } catch (e) {
        console.warn('东方财富成交额榜失败:', e.message);
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
        let eastmoney = [], ths = [], amount = [];
        const tasks = [];

        if (source === 'all' || source === 'eastmoney') tasks.push(fetchEastmoney(size).then(r => eastmoney = r));
        if (source === 'all' || source === 'ths') tasks.push(fetchTHS(size).then(r => ths = r));
        if (source === 'all' || source === 'amount') tasks.push(fetchEastmoneyHot(size).then(r => amount = r));

        await Promise.allSettled(tasks);

        let results = [];
        if (source === 'eastmoney') results = eastmoney;
        else if (source === 'ths') results = ths;
        else if (source === 'amount') results = amount;
        else {
            // 综合：合并去重，按热度排序
            const map = new Map();
            [...eastmoney, ...ths, ...amount].forEach(s => {
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
                amount: amount.length
            },
            data: results
        });
    } catch (e) {
        sendJson(res, 500, { success: false, error: e.message, data: [] });
    }
};
