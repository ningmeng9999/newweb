// Vercel Serverless Function - 项目作品数据管理（Vercel KV）
// 支持：GET读取项目列表、POST添加项目、DELETE删除项目（需密码）
const https = require('https');
const { URL } = require('url');

const DELETE_PASSWORD = '031029';
const KV_KEY = 'lengmeng_works_v1';

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(data));
}

function kvConfigured() {
    return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function kvRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const base = process.env.KV_REST_API_URL.replace(/\/$/, '');
        const url = new URL(base + path);
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': 'Bearer ' + process.env.KV_REST_API_TOKEN,
                'Content-Type': 'application/json'
            }
        };
        if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null }); }
                catch (e) { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

// 默认项目数据（KV未配置或为空时使用）
const DEFAULT_WORKS = [
    { id: 1, title: '亚太地区数学建模竞赛', category: 'data', date: '2024.09', role: '队长', desc: '使用Python Pandas完成80万+条数据集清洗，搭建随机森林预测模型，运用Matplotlib完成多维度数据可视化，输出18页专业分析报告。获国家级三等奖。', tags: ['Python', 'Pandas', '随机森林', 'Matplotlib'], image: 'https://picsum.photos/seed/work01/400/200', link: '' },
    { id: 2, title: '商务大数据分析竞赛', category: 'data', date: '2024.09-2025.02', role: '项目负责人', desc: '基于Python爬虫+影刀RPA自动化抓取TikTok商品评论、销量、用户画像数据；对海外用户评论做情感正负向分析，用Tableau搭建动态商业看板。获国家级三等奖。', tags: ['Python', '影刀RPA', 'Tableau', '情感分析'], image: 'https://picsum.photos/seed/work02/400/200', link: '' },
    { id: 3, title: '四时动态个人网站', category: 'web', date: '2026', role: '独立开发', desc: '纯前端科技风个人主页，按时间自动切换四套主题，粒子光影动画，侧边栏导航，嵌入菜谱工具与股票行情分析，部署于Vercel。', tags: ['HTML5', 'CSS3', 'JavaScript', 'Vercel'], image: 'https://picsum.photos/seed/work03/400/200', link: 'index.html' },
    { id: 4, title: 'A股行情分析与选股工具', category: 'web', date: '2026', role: '独立开发', desc: '基于东方财富接口的A股实时行情工具，含大盘指数微缩走势图、多指标选股策略、自选池盈亏追踪、气泡云图与热力矩形图双视图。', tags: ['JavaScript', 'Canvas', 'K线分析'], image: 'https://picsum.photos/seed/work06/400/200', link: 'stock.html' },
    { id: 5, title: '亚马逊精品店铺运营', category: 'ecom', date: '2026.04-2026.08', role: '运营助理', desc: '负责亚马逊欧美多站点精品店铺运营，搭建SP广告投放结构，独立孵化3款垂直类目新品，核心链接点击率提升11.5%，店铺月度GMV环比提升13%。', tags: ['亚马逊', 'SP广告', 'Listing优化', '领星ERP'], image: 'https://picsum.photos/seed/work04/400/200', link: '' },
    { id: 6, title: '亚马逊新品孵化项目', category: 'ecom', date: '2025.11-2026.03', role: '运营助理', desc: '使用Python实现竞品数据自动化采集，按月输出竞品分析与市场机会报告，策划Coupon、限时促销、联盟推广方案，成功孵化2款潜力新品。', tags: ['Python', '竞品分析', '亚马逊', '短视频'], image: 'https://picsum.photos/seed/work05/400/200', link: '' }
];

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') { sendJson(res, 200, {}); return; }

    // 未配置KV：返回默认数据
    if (!kvConfigured()) {
        if (req.method === 'GET') {
            sendJson(res, 200, { ok: true, works: DEFAULT_WORKS, mode: 'default' });
        } else {
            sendJson(res, 200, { ok: false, mode: 'default', message: 'KV未配置，使用默认数据，不支持编辑' });
        }
        return;
    }

    try {
        if (req.method === 'GET') {
            // 读取项目列表
            const result = await kvRequest('GET', '/get/' + KV_KEY);
            let works = DEFAULT_WORKS;
            if (result.status === 200 && result.body && result.body.result) {
                try { works = JSON.parse(result.body.result); } catch(e) {}
            }
            sendJson(res, 200, { ok: true, works, mode: 'vercel-kv' });
        } else if (req.method === 'POST') {
            // 添加项目
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const item = JSON.parse(body);
                    // 读取现有数据
                    const getResult = await kvRequest('GET', '/get/' + KV_KEY);
                    let works = DEFAULT_WORKS;
                    if (getResult.status === 200 && getResult.body && getResult.body.result) {
                        try { works = JSON.parse(getResult.body.result); } catch(e) {}
                    }
                    item.id = Date.now();
                    works.push(item);
                    // 保存
                    await kvRequest('POST', '/set/' + KV_KEY, works);
                    sendJson(res, 200, { ok: true, works, id: item.id });
                } catch(e) {
                    sendJson(res, 400, { ok: false, error: e.message });
                }
            });
        } else if (req.method === 'DELETE') {
            // 删除项目（需密码）
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { id, password } = JSON.parse(body);
                    if (password !== DELETE_PASSWORD) {
                        sendJson(res, 403, { ok: false, error: '密码错误' });
                        return;
                    }
                    // 读取现有数据
                    const getResult = await kvRequest('GET', '/get/' + KV_KEY);
                    let works = DEFAULT_WORKS;
                    if (getResult.status === 200 && getResult.body && getResult.body.result) {
                        try { works = JSON.parse(getResult.body.result); } catch(e) {}
                    }
                    works = works.filter(w => w.id !== id);
                    // 保存
                    await kvRequest('POST', '/set/' + KV_KEY, works);
                    sendJson(res, 200, { ok: true, works });
                } catch(e) {
                    sendJson(res, 400, { ok: false, error: e.message });
                }
            });
        } else {
            sendJson(res, 405, { ok: false, error: 'Method not allowed' });
        }
    } catch (e) {
        sendJson(res, 500, { ok: false, error: e.message });
    }
};