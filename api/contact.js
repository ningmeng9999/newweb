// api/contact.js - 站点联系表单
// 依赖环境变量（Vercel Project Settings → Environment Variables）：
//   SMTP_USER   发件邮箱，例如 xxx@qq.com
//   SMTP_PASS   邮箱 SMTP 授权码（不是登录密码）
//   CONTACT_TO  收件邮箱，缺省等于 SMTP_USER
// 未配置时返回 501，前端会自动回退到 mailto:。

const nodemailer = require('nodemailer');

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 3;
const hits = new Map();

function limited(ip) {
    const now = Date.now();
    const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
    arr.push(now);
    hits.set(ip, arr);
    if (hits.size > 500) hits.clear();
    return arr.length > MAX_PER_WINDOW;
}

function clean(s, max) {
    return String(s == null ? '' : s).trim().slice(0, max);
}

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ ok: false, error: 'Method not allowed' });
        return;
    }

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const to = process.env.CONTACT_TO || user;

    if (!user || !pass) {
        res.status(501).json({ ok: false, error: 'MAIL_NOT_CONFIGURED' });
        return;
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    // 蜜罐：机器人填了隐藏字段就直接丢弃
    if (body.company) {
        res.status(200).json({ ok: true });
        return;
    }

    const name = clean(body.name, 60);
    const email = clean(body.email, 120);
    const message = clean(body.message, 4000);

    if (!name || !email || !message) {
        res.status(400).json({ ok: false, error: '缺少必填项' });
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ ok: false, error: '邮箱格式不正确' });
        return;
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (limited(ip)) {
        res.status(429).json({ ok: false, error: '发送太频繁，请稍后再试' });
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.qq.com',
            port: 465,
            secure: true,
            auth: { user, pass }
        });

        await transporter.sendMail({
            from: `"LengMeng 站点留言" <${user}>`,
            to,
            replyTo: email,
            subject: `[站点留言] ${name}`,
            text: `${message}\n\n——\n${name} / ${email}`,
            html: `
                <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.7;color:#111">
                    <p style="color:#666;font-size:12px;margin:0 0 12px">来自 lengmeng.online 的留言</p>
                    <p style="white-space:pre-wrap;margin:0 0 18px">${escapeHtml(message)}</p>
                    <hr style="border:none;border-top:1px solid #eee">
                    <p style="font-size:13px;color:#444;margin:10px 0 0">
                        ${escapeHtml(name)} · <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
                    </p>
                </div>
            `
        });

        res.status(200).json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
};
