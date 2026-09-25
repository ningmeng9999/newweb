// Vercel Serverless Function: 发送邮件（QQ邮箱SMTP）
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const { to, subject, text, html, from, auth } = req.body || {};

    if (!to || !subject || !from || !auth) {
        return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.qq.com',
            port: 465,
            secure: true,
            auth: { user: from, pass: auth }
        });

        await transporter.sendMail({
            from: `"亚马逊异常监控" <${from}>`,
            to,
            subject,
            text: text || '',
            html: html || text || ''
        });

        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};
