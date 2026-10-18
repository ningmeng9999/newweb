// api/stock-note.js - 持仓记事本存储
// 使用 Upstash KV REST API，未配置时降级 localStorage

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const KV_URL = process.env.KV_REST_API_URL || 'https://helpful-koala-298503.upstash.io';
    const KV_TOKEN = process.env.KV_REST_API_TOKEN || 'gQAAAAAABI4HAAIgcDE1ZjEyN2E3OGNhNjk0OTk5YWFjZmU2MDI3YTM2MmU5Mw';
    const KEY = 'stock:notes';
    const PASSWORD = process.env.NOTE_PASSWORD || 'lengmeng2024';

    // KV未配置时降级
    if (!KV_URL || !KV_TOKEN) {
        if (req.method === 'GET') return res.json({ok: true, local: true, items: []});
        if (req.method === 'POST') return res.json({ok: true, local: true, msg: '本地模式，数据存localStorage'});
        return res.status(200).json({ok: true, local: true});
    }

    async function kvGet() {
        const r = await fetch(KV_URL + '/' + KEY, {
            headers: {'Authorization': 'Bearer ' + KV_TOKEN}
        });
        if (!r.ok) return [];
        const text = await r.text();
        if (!text || text === 'null') return [];
        try { return JSON.parse(text); } catch(e) { return []; }
    }

    async function kvSet(items) {
        await fetch(KV_URL + '/' + KEY, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + KV_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(items)
        });
    }

    try {
        // GET - 获取全部
        if (req.method === 'GET') {
            const items = await kvGet();
            return res.json({ok: true, local: false, items: items});
        }

        // POST - 保存全部（覆盖）
        if (req.method === 'POST') {
            const {items} = req.body || {};
            if (!Array.isArray(items)) return res.status(400).json({error: 'items必须是数组'});
            await kvSet(items);
            return res.json({ok: true, saved: items.length});
        }

        // DELETE - 删除（需要密码）
        if (req.method === 'DELETE') {
            const password = req.query.password || req.body?.password;
            if (password !== PASSWORD) return res.status(403).json({error: '密码错误'});
            await kvSet([]);
            return res.json({ok: true, deleted: true});
        }

        return res.status(405).json({error: 'Method not allowed'});
    } catch(e) {
        return res.status(500).json({error: '服务器错误: ' + e.message});
    }
}
