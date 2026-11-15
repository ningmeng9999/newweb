// api/toutiao.js — 实时热点话题（多源容错）
const { sendJson, handlePreflight, fetchJson } = require('./_lib/http');

const SOURCES = [
    {
        name: '微博热搜',
        url: 'https://api.vvhan.com/api/hotlist/wbHot',
        fallbackTag: '热搜',
    },
    {
        name: '知乎热榜',
        url: 'https://api.vvhan.com/api/hotlist/zhihuHot',
        fallbackTag: '知乎',
    },
    {
        name: '百度热搜',
        url: 'https://api.vvhan.com/api/hotlist/baiduRD',
        fallbackTag: '百度',
    },
];

function parse(json, fallbackTag) {
    return (json && json.data ? json.data : []).map((item, i) => ({
        rank: i + 1,
        title: item.title || '',
        hot: item.hot || fallbackTag,
        url: item.url || '#',
    }));
}

module.exports = async (req, res) => {
    if (handlePreflight(req, res, 'GET, OPTIONS')) return;

    for (const source of SOURCES) {
        try {
            const json = await fetchJson(source.url, { timeout: 6000 });
            const list = parse(json, source.fallbackTag).slice(0, 8);
            if (list.length) {
                return sendJson(
                    res,
                    200,
                    { success: true, source: source.name, count: list.length, data: list },
                    { 'Cache-Control': 's-maxage=120, stale-while-revalidate=600' }
                );
            }
        } catch (e) {
            console.error(`${source.name} failed: ${e.message}`);
        }
    }

    return sendJson(res, 502, { success: false, error: '所有热点源暂时不可用' });
};
