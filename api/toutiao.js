// api/toutiao.js - 实时热点话题（多源容错）
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 多数据源，按优先级尝试
    const sources = [
        {
            name: '微博热搜',
            url: 'https://api.vvhan.com/api/hotlist/wbHot',
            parse: (json) => (json.data || []).map((item, i) => ({
                rank: i + 1,
                title: item.title || '',
                hot: item.hot || '热搜',
                url: item.url || '#'
            }))
        },
        {
            name: '知乎热榜',
            url: 'https://api.vvhan.com/api/hotlist/zhihuHot',
            parse: (json) => (json.data || []).map((item, i) => ({
                rank: i + 1,
                title: item.title || '',
                hot: item.hot || '知乎',
                url: item.url || '#'
            }))
        },
        {
            name: '百度热搜',
            url: 'https://api.vvhan.com/api/hotlist/baiduRD',
            parse: (json) => (json.data || []).map((item, i) => ({
                rank: i + 1,
                title: item.title || '',
                hot: item.hot || '百度',
                url: item.url || '#'
            }))
        }
    ];

    for (const source of sources) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            
            const resp = await fetch(source.url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            clearTimeout(timeout);
            
            if (!resp.ok) continue;
            const json = await resp.json();
            const list = source.parse(json).slice(0, 8);
            
            if (list.length) {
                return res.status(200).json({
                    success: true,
                    source: source.name,
                    count: list.length,
                    data: list
                });
            }
        } catch (e) {
            console.error(source.name + ' failed:', e.message);
        }
    }

    // 所有源都失败，返回502让前端知道
    res.status(502).json({
        success: false,
        error: '所有热点源暂时不可用'
    });
};
