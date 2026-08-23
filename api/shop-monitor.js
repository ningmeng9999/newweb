// Vercel Serverless Function: 亚马逊店铺异常监控
// 每天中国时间0点（UTC 16:00）由Cron触发，也可手动POST触发
const axios = require('axios');
const aws4 = require('aws4');
const nodemailer = require('nodemailer');

// ========== SP-API 配置（从环境变量读取，也可由前端传入） ==========
const CONFIG = {
    clientId: process.env.SP_API_CLIENT_ID,
    clientSecret: process.env.SP_API_CLIENT_SECRET,
    refreshToken: process.env.SP_API_REFRESH_TOKEN,
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.SP_API_REGION || 'us',
    // 邮箱配置
    emailFrom: process.env.EMAIL_FROM,
    emailAuth: process.env.EMAIL_AUTH,
    emailTo: process.env.EMAIL_TO,
    // 阈值
    stockThreshold: parseInt(process.env.STOCK_THRESHOLD || '7'),
    bsrThreshold: parseInt(process.env.BSR_THRESHOLD || '500'),
    odrThreshold: parseFloat(process.env.ODR_THRESHOLD || '1'),
    lateThreshold: parseFloat(process.env.LATE_THRESHOLD || '4')
};

// SP-API端点
const SP_API_ENDPOINTS = {
    us: 'https://sellingpartnerapi-na.amazon.com',
    eu: 'https://sellingpartnerapi-eu.amazon.com',
    fe: 'https://sellingpartnerapi-fe.amazon.com'
};
const LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';

// ========== 工具函数 ==========
async function getLwaToken() {
    const res = await axios.post(LWA_TOKEN_URL, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: CONFIG.refreshToken,
        client_id: CONFIG.clientId,
        client_secret: CONFIG.clientSecret
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return res.data.access_token;
}

async function callSpApi(path, method = 'GET', body = null) {
    const accessToken = await getLwaToken();
    const endpoint = SP_API_ENDPOINTS[CONFIG.region];
    const url = new URL(endpoint + path);

    const opts = aws4.sign({
        host: url.host,
        method,
        path: url.pathname + url.search,
        headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    }, {
        accessKeyId: CONFIG.awsAccessKey,
        secretAccessKey: CONFIG.awsSecretKey
    });

    const res = await axios({
        method,
        url: endpoint + path,
        headers: opts.headers,
        data: body || undefined,
        timeout: 30000
    });
    return res.data;
}

// ========== 异常检测 ==========
async function checkReviews() {
    // 获取Feedback和商品评价
    // SP-API: GET /fba/outbound-shipment/v1/shipments (获取订单)
    // GET /reviews/2021-03-31/records (获取评价，需授权)
    // 这里简化处理，实际需根据API文档调用
    const alerts = [];
    try {
        // 示例：获取最近的Feedback
        // const data = await callSpApi('/fba/outbound-shipment/v1/shipments?createdAfter=...');
        // 检测1星2星评价...
    } catch (e) {
        console.error('检查差评失败:', e.message);
    }
    return alerts;
}

async function checkStock() {
    const alerts = [];
    try {
        // SP-API: GET /fba/inventory/v1/summaries (库存摘要)
        // const data = await callSpApi('/fba/inventory/v1/summaries?details=true');
        // 检测可售天数低于阈值的商品
    } catch (e) {
        console.error('检查库存失败:', e.message);
    }
    return alerts;
}

async function checkBsr() {
    const alerts = [];
    try {
        // SP-API: GET /catalog/2022-04-01/items (获取商品信息，含SalesRank)
        // 需要对比历史BSR数据（存在KV或数据库）
    } catch (e) {
        console.error('检查BSR失败:', e.message);
    }
    return alerts;
}

async function checkPerformance() {
    const alerts = [];
    try {
        // SP-API: GET /fba/outbound-shipment/v1/shipments (计算迟发率)
        // GET /orders/v0/orders (计算ODR)
        // 账号绩效API: GET /seller/v1/account (部分指标)
    } catch (e) {
        console.error('检查绩效失败:', e.message);
    }
    return alerts;
}

// ========== 邮件通知 ==========
async function sendAlertEmail(alerts) {
    if (!CONFIG.emailFrom || !CONFIG.emailAuth || !CONFIG.emailTo) return;
    if (alerts.length === 0) return;

    const transporter = nodemailer.createTransport({
        host: 'smtp.qq.com', port: 465, secure: true,
        auth: { user: CONFIG.emailFrom, pass: CONFIG.emailAuth }
    });

    const typeNames = { review: '差评/Feedback', stock: '库存断货', bsr: 'BSR暴跌', perf: '绩效警告' };
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#ff6b6b;">⚠️ 亚马逊店铺异常警告</h2>
            <p>检测时间：${new Date().toLocaleString('zh-CN')}</p>
            <p>共检测到 <strong style="color:#ff6b6b;">${alerts.length}</strong> 项异常：</p>
            ${alerts.map(a => `
                <div style="border-left:4px solid #ff6b6b;padding:10px 14px;margin:10px 0;background:#fff5f5;">
                    <strong>${typeNames[a.type] || a.type}：${a.title}</strong>
                    <p style="color:#666;margin:6px 0;">${a.desc}</p>
                    <p style="color:#999;font-size:12px;">${a.time}</p>
                </div>
            `).join('')}
            <p style="color:#999;font-size:12px;margin-top:20px;">此邮件由亚马逊异常监控系统自动发送</p>
        </div>
    `;

    await transporter.sendMail({
        from: `"亚马逊异常监控" <${CONFIG.emailFrom}>`,
        to: CONFIG.emailTo,
        subject: `【异常警告】亚马逊店铺检测到${alerts.length}项异常`,
        html
    });
}

// ========== 主函数 ==========
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    // GET请求：返回当前状态（无存储时返回空）
    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            alerts: [],
            checkedAt: null,
            message: '暂无异常记录，点击立即检查或等待定时任务（每日0点）'
        });
    }

    // 支持前端传入配置覆盖环境变量
    if (req.body && req.body.config) {
        Object.assign(CONFIG, req.body.config);
    }

    try {
        console.log('开始亚马逊异常检查...');

        // 并行检测4类异常
        const [reviewAlerts, stockAlerts, bsrAlerts, perfAlerts] = await Promise.all([
            checkReviews(),
            checkStock(),
            checkBsr(),
            checkPerformance()
        ]);

        const allAlerts = [...reviewAlerts, ...stockAlerts, ...bsrAlerts, ...perfAlerts];
        const now = new Date().toLocaleString('zh-CN');
        allAlerts.forEach(a => { a.time = now; a.status = 'pending'; a.id = Date.now() + Math.random(); });

        console.log(`检测完成，共${allAlerts.length}项异常`);

        // 发送邮件
        if (allAlerts.length > 0) {
            try { await sendAlertEmail(allAlerts); } catch (e) { console.error('邮件发送失败:', e.message); }
        }

        res.status(200).json({
            success: true,
            checkedAt: now,
            newAlerts: allAlerts,
            counts: {
                review: reviewAlerts.length,
                stock: stockAlerts.length,
                bsr: bsrAlerts.length,
                perf: perfAlerts.length
            }
        });
    } catch (e) {
        console.error('监控检查失败:', e);
        res.status(500).json({ success: false, error: e.message });
    }
};
