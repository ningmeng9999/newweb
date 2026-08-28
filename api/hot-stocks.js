// Vercel Serverless Function - 热门股票排行（东方财富多维度排序）
const https = require('https');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function fetchUrl(url, referer = 'https://quote.eastmoney.com/') {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': referer
            },
            timeout: 8000
        }, (response) => {
            const chunks = [];
            response.on('data', c => chunks.push(c));
            response.on('end', () => {
                const buf = Buffer.concat(chunks);
                let text;
                try { text = new TextDecoder('utf-8').decode(buf); } catch(e) { text = buf.toString(); }
                resolve(text);
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

// 东方财富clist通用接口，按不同字段排序
async function fetchEastmoneyRank(fid, size = 30, label = '') {
    // fid: f3=涨跌幅, f6=成交额, f8=换手率, f5=成交量
    const fs = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23'; // 沪深A股
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${size}&po=1&np=1&fltt=2&invt=2&fid=${fid}&fs=${encodeURIComponent(fs)}&fields=f2,f3,f5,f6,f8,f12,f14,f15,f16,f17,f18`;
    try {
        const text = await fetchUrl(url);
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
                    volume: item.f5 || 0,
                    amount: item.f6 || 0,
                    turnover: item.f8 || 0,
                    hotValue: item[fid] || 0,
                    source: label
                };
            }).filter(s => s.code && s.name && s.price > 0);
        }
    } catch (e) {
        console.warn(`东方财富${label}榜失败:`, e.message);
    }
    return [];
}

// 东方财富人气榜（股吧热度，备用接口）
async function fetchGubaHot(size = 30) {
    try {
        const url = `https://guba.eastmoney.com/rank/`;
        // 股吧人气榜是动态渲染的，用API替代
        // 用涨幅榜+成交量模拟人气
        const result = await fetchEastmoneyRank('f5', size, '人气榜');
        return result;
    } catch (e) {
        return [];
    }
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
        let changeRank = [], amountRank = [], turnoverRank = [];
        const tasks = [];

        // 三个维度：涨幅、成交额、换手率
        if (source === 'all' || source === 'hot') tasks.push(fetchEastmoneyRank('f3', size, '涨幅榜').then(r => changeRank = r));
        if (source === 'all' || source === 'amount') tasks.push(fetchEastmoneyRank('f6', size, '成交额').then(r => amountRank = r));
        if (source === 'all' || source === 'turnover') tasks.push(fetchEastmoneyRank('f8', size, '换手率').then(r => turnoverRank = r));

        await Promise.allSettled(tasks);

        let results = [];
        if (source === 'hot') results = changeRank;
        else if (source === 'amount') results = amountRank;
        else if (source === 'turnover') results = turnoverRank;
        else {
            // 综合：合并去重，按成交额+涨幅综合排序
            const map = new Map();
            [...changeRank, ...amountRank, ...turnoverRank].forEach((s, idx) => {
                if (!map.has(s.code)) {
                    map.set(s.code, { ...s, sources: [s.source], rankScore: 0 });
                }
                const existing = map.get(s.code);
                existing.rankScore += (size - idx);
                if (!existing.sources.includes(s.source)) existing.sources.push(s.source);
            });
            results = Array.from(map.values()).sort((a, b) => b.rankScore - a.rankScore).slice(0, size);
        }

        sendJson(res, 200, {
            success: true,
            source: source,
            count: results.length,
            sources_used: {
                涨幅榜: changeRank.length,
                成交额: amountRank.length,
                换手率: turnoverRank.length
            },
            data: results
        });
    } catch (e) {
        sendJson(res, 500, { success: false, error: e.message, data: [] });
    }
};
