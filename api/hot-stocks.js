// Vercel Serverless Function - 热门股票排行（新浪财经API）
const https = require('https');
const http = require('http');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function fetchUrl(url, useHttps = true) {
    return new Promise((resolve, reject) => {
        const client = useHttps ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://finance.sina.com.cn/'
            },
            timeout: 8000
        }, (response) => {
            const chunks = [];
            response.on('data', c => chunks.push(c));
            response.on('end', () => {
                const buf = Buffer.concat(chunks);
                let text;
                try { text = new TextDecoder('gbk').decode(buf); } catch(e) { text = buf.toString('utf-8'); }
                resolve(text);
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

// 新浪财经排行榜
async function fetchSinaRank(sort, size = 30, label = '') {
    // sort: changepercent(涨跌幅), amount(成交额), turnoverratio(换手率)
    const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=1&num=${size}&sort=${sort}&asc=0&node=hs_a`;
    try {
        let text;
        try {
            text = await fetchUrl(url, true);
        } catch (e) {
            // HTTPS失败回退HTTP
            text = await fetchUrl(url.replace('https://', 'http://'), false);
        }
        // 新浪返回的是JSON数组，可能有JSONP包裹
        text = text.trim();
        if (text.startsWith('var') || text.startsWith('(')) {
            const match = text.match(/\[.*\]/s);
            if (match) text = match[0];
        }
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
            return data.map(item => {
                const symbol = item.symbol || ''; // 如 sh600519
                return {
                    code: symbol.toLowerCase(),
                    name: item.name || '',
                    price: parseFloat(item.trade) || 0,
                    changeRate: parseFloat(item.changepercent) || 0,
                    volume: parseFloat(item.volume) || 0,
                    amount: parseFloat(item.amount) || 0,
                    turnover: parseFloat(item.turnoverratio) || 0,
                    pe: parseFloat(item.per) || 0,
                    pb: parseFloat(item.pb) || 0,
                    hotValue: parseFloat(item[sort]) || 0,
                    source: label
                };
            }).filter(s => s.code && s.name && s.price > 0);
        }
    } catch (e) {
        console.warn(`新浪${label}榜失败:`, e.message);
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
        let changeRank = [], amountRank = [], turnoverRank = [];
        const tasks = [];

        if (source === 'all' || source === 'hot') tasks.push(fetchSinaRank('changepercent', size, '涨幅榜').then(r => changeRank = r));
        if (source === 'all' || source === 'amount') tasks.push(fetchSinaRank('amount', size, '成交额').then(r => amountRank = r));
        if (source === 'all' || source === 'turnover') tasks.push(fetchSinaRank('turnoverratio', size, '换手率').then(r => turnoverRank = r));

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
