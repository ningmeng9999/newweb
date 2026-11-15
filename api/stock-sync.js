// api/stock-sync.js — 股票自选 / 历史 / 策略的云端同步
// 未配置 KV 时返回 KV_NOT_CONFIGURED，前端自动回退 localStorage
const { sendJson, handlePreflight, readJson } = require('./_lib/http');
const kv = require('./_lib/kv');

const KEY = 'lengmeng_stock_data_v1';

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (!kv.isConfigured()) {
        return sendJson(res, 200, { error: 'KV_NOT_CONFIGURED', message: 'KV 未配置，使用本地存储' });
    }

    try {
        if (req.method === 'GET') {
            const data = await kv.getJson(KEY, null);
            return sendJson(res, 200, { ok: true, data, source: 'kv' });
        }

        if (req.method === 'POST') {
            const payload = await readJson(req);
            const data = {
                favorites: payload.favorites || [],
                history: payload.history || [],
                strategies: payload.strategies || [],
                updatedAt: new Date().toISOString(),
            };
            await kv.setJson(KEY, data);
            return sendJson(res, 200, { ok: true, source: 'kv', savedAt: data.updatedAt });
        }

        return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    } catch (e) {
        return sendJson(res, 500, { error: 'SERVER_ERROR', message: e.message });
    }
};
