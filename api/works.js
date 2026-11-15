// api/works.js — 项目作品数据（读写 KV，未配置时返回兜底数据）
const { sendJson, handlePreflight, readJson } = require('./_lib/http');
const kv = require('./_lib/kv');
const SEED = require('./_lib/works-seed');

const KEY = 'lengmeng_works_v1';

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (!kv.isConfigured()) {
        if (req.method === 'GET') {
            return sendJson(res, 200, { ok: true, works: SEED, mode: 'default' });
        }
        return sendJson(res, 200, {
            ok: false,
            mode: 'default',
            message: 'KV 未配置，当前为只读模式（在 Vercel 项目里接入 Upstash Redis 即可启用编辑）',
        });
    }

    try {
        if (req.method === 'GET') {
            const works = await kv.getJson(KEY, SEED);
            return sendJson(res, 200, { ok: true, works, mode: 'kv' });
        }

        if (req.method === 'POST') {
            const item = await readJson(req);
            if (!item.title) return sendJson(res, 400, { ok: false, error: '缺少标题' });
            const works = await kv.getJson(KEY, SEED);
            item.id = Date.now();
            works.push(item);
            await kv.setJson(KEY, works);
            return sendJson(res, 200, { ok: true, works, id: item.id });
        }

        if (req.method === 'DELETE') {
            const { id, password } = await readJson(req);
            const expected = process.env.WORKS_DELETE_PASSWORD || '031029';
            if (password !== expected) return sendJson(res, 403, { ok: false, error: '密码错误' });
            const works = await kv.getJson(KEY, SEED);
            const next = works.filter((w) => w.id !== id);
            await kv.setJson(KEY, next);
            return sendJson(res, 200, { ok: true, works: next });
        }

        return sendJson(res, 405, { ok: false, error: 'method not allowed' });
    } catch (e) {
        return sendJson(res, 500, { ok: false, error: e.message });
    }
};
