// api/stock-note.js — 持仓笔记（整体覆盖式存储，未配置 KV 时前端走 localStorage）
const { sendJson, handlePreflight, readJson } = require('./_lib/http');
const kv = require('./_lib/kv');

const KEY = 'stock:notes';

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (!kv.isConfigured()) {
        if (req.method === 'GET') return sendJson(res, 200, { ok: true, local: true, items: [] });
        return sendJson(res, 200, { ok: true, local: true, msg: '本地模式，数据存 localStorage' });
    }

    try {
        if (req.method === 'GET') {
            const items = await kv.getJson(KEY, []);
            return sendJson(res, 200, { ok: true, local: false, items: Array.isArray(items) ? items : [] });
        }

        if (req.method === 'POST') {
            const { items } = await readJson(req);
            if (!Array.isArray(items)) return sendJson(res, 400, { error: 'items 必须是数组' });
            await kv.setJson(KEY, items);
            return sendJson(res, 200, { ok: true, saved: items.length });
        }

        if (req.method === 'DELETE') {
            const url = new URL(req.url, 'http://localhost');
            const password = url.searchParams.get('password');
            const expected = process.env.NOTE_PASSWORD || 'lengmeng2024';
            if (password !== expected) return sendJson(res, 403, { error: '密码错误' });
            await kv.setJson(KEY, []);
            return sendJson(res, 200, { ok: true, deleted: true });
        }

        return sendJson(res, 405, { error: 'method not allowed' });
    } catch (e) {
        return sendJson(res, 500, { error: '服务器错误: ' + e.message });
    }
};
