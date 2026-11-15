// api/visitor.js — 全站访客计数
// 未配置 KV 时返回 mode:'local'，前端回退 localStorage
const { sendJson, handlePreflight } = require('./_lib/http');
const kv = require('./_lib/kv');

const KEY = 'lengmeng_visitor_count_v1';

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (!kv.isConfigured()) {
        return sendJson(res, 200, { ok: false, mode: 'local', message: 'KV 未配置，使用本地计数' });
    }

    try {
        if (req.method === 'POST') {
            const count = await kv.incr(KEY);
            return sendJson(res, 200, { ok: true, count, mode: 'kv' });
        }
        const count = Number(await kv.getJson(KEY, 0)) || 0;
        return sendJson(res, 200, { ok: true, count, mode: 'kv' });
    } catch (e) {
        return sendJson(res, 500, { ok: false, error: e.message, mode: 'error' });
    }
};
