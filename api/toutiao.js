// Vercel Serverless Function: 百度热搜热榜代理
const https = require('https');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const url = 'https://top.baidu.com/api/board?platform=pc&tab=realtime';

    const req2 = https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://top.baidu.com/',
            'Accept': 'application/json, text/plain, */*'
        },
        timeout: 10000
    }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            try {
                const json = JSON.parse(data);
                const rawList = json.data && json.data.cards && json.data.cards[0] && json.data.cards[0].content ? json.data.cards[0].content : [];
                
                // 国际关键词过滤
                const intlKeywords = ['美国','日本','韩国','欧洲','欧盟','英国','法国','德国','俄罗斯','乌克兰','以色列','巴勒斯坦','印度','越南','泰国','新加坡','澳大利亚','加拿大','巴西','阿根廷','墨西哥','南非','埃及','沙特','伊朗','伊拉克','阿富汗','巴基斯坦','联合国','北约','G7','G20','美联储','白宫','五角大楼','克里姆林宫','国际','全球','海外','外媒','美元','欧元','日元','原油','黄金','比特币'];
                
                const list = rawList.map((item, idx) => ({
                    rank: idx + 1,
                    title: item.word || '',
                    desc: item.desc || '',
                    hot: item.hotScore || '',
                    url: item.url || item.rawUrl || ('https://www.baidu.com/s?wd=' + encodeURIComponent(item.word || '')),
                    image: item.img || '',
                    tag: item.hotTag || '',
                    isInternational: intlKeywords.some(k => (item.word || '').includes(k))
                }));

                res.status(200).json({ 
                    success: true, 
                    source: '百度热搜',
                    count: list.length, 
                    data: list 
                });
            } catch (e) {
                res.status(500).json({ success: false, error: '解析失败', detail: e.message, raw: data.substring(0, 200) });
            }
        });
    });

    req2.on('error', (e) => {
        res.status(500).json({ success: false, error: '请求失败', detail: e.message });
    });

    req2.on('timeout', () => {
        req2.destroy();
        res.status(504).json({ success: false, error: '请求超时' });
    });
};
