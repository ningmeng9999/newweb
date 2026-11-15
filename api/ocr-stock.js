// api/ocr-stock.js — 股票持仓截图 AI 识别（智谱 GLM-4V / 通义千问 VL / OpenAI GPT-4o 依次兜底）
// 在 Vercel 环境变量里配置 ZHIPU_API_KEY / DASHSCOPE_API_KEY / OPENAI_API_KEY 任意一个即可。
const { sendJson, handlePreflight, readJson } = require('./_lib/http');

const PROMPT = `这是一张股票持仓截图。请识别出所有股票，严格按以下JSON数组格式输出，不要输出任何其他文字：
[{"name":"股票名称","code":"股票代码(6开头加sh前缀,0或3开头加sz前缀,如sh600519)","cost":"成本价(数字)","price":"现价(数字)","shares":"持股数量(数字)"}]
数字字段必须是纯数字，识别不出来填0。`;

function providers() {
    const list = [];
    if (process.env.ZHIPU_API_KEY) {
        list.push({
            url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            key: process.env.ZHIPU_API_KEY,
            model: 'glm-4v-flash',
        });
    }
    if (process.env.DASHSCOPE_API_KEY) {
        list.push({
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            key: process.env.DASHSCOPE_API_KEY,
            model: 'qwen-vl-max-latest',
        });
    }
    if (process.env.OPENAI_API_KEY) {
        list.push({
            url: 'https://api.openai.com/v1/chat/completions',
            key: process.env.OPENAI_API_KEY,
            model: 'gpt-4o-mini',
        });
    }
    return list;
}

async function recognize(provider, image) {
    const resp = await fetch(provider.url, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + provider.key,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: provider.model,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: PROMPT },
                        { type: 'image_url', image_url: { url: image } },
                    ],
                },
            ],
            max_tokens: 2000,
            temperature: 0.1,
        }),
        signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) throw new Error(`${provider.model}: ${resp.status} ${(await resp.text()).slice(0, 200)}`);
    const data = await resp.json();
    const content = (data.choices && data.choices[0] && data.choices[0].message.content) || '';
    return { stocks: extractStocks(content), model: provider.model };
}

function extractStocks(text) {
    if (!text) return [];
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '');
    try {
        const parsed = JSON.parse(clean.trim());
        return cleanStocks(Array.isArray(parsed) ? parsed : [parsed]);
    } catch {
        /* 继续尝试正则截取 */
    }
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) {
        try {
            return cleanStocks(JSON.parse(match[0]));
        } catch {
            /* 忽略 */
        }
    }
    return [];
}

function cleanStocks(arr) {
    const result = [];
    for (const item of arr) {
        if (!item || typeof item !== 'object') continue;
        let code = String(item.code || '').trim().toLowerCase().replace(/^[a-z]+/, '');
        if (/^\d{6}$/.test(code)) {
            if (code.startsWith('6')) code = 'sh' + code;
            else if (code.startsWith('0') || code.startsWith('3')) code = 'sz' + code;
            else if (code.startsWith('4') || code.startsWith('8')) code = 'bj' + code;
        }
        result.push({
            name: String(item.name || '').trim(),
            code,
            cost: parseFloat(item.cost) || 0,
            price: parseFloat(item.price) || 0,
            shares: Math.round(parseFloat(item.shares) || 100),
        });
    }
    return result;
}

module.exports = async (req, res) => {
    if (handlePreflight(req, res, 'POST, OPTIONS')) return;
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });

    try {
        const { image } = await readJson(req);
        if (!image) return sendJson(res, 400, { error: '缺少 image 参数' });
        if (typeof image !== 'string' || (!image.startsWith('data:image/') && !image.startsWith('http'))) {
            return sendJson(res, 400, { error: 'image 格式错误，需要 base64 dataURI 或 URL' });
        }

        const list = providers();
        if (!list.length) {
            return sendJson(res, 503, {
                error: '请在 Vercel 环境变量设置 ZHIPU_API_KEY / DASHSCOPE_API_KEY / OPENAI_API_KEY 任一',
            });
        }

        let lastError = null;
        for (const provider of list) {
            try {
                const { stocks, model } = await recognize(provider, image);
                return sendJson(res, 200, { ok: true, stocks, model });
            } catch (e) {
                lastError = e.message;
            }
        }
        return sendJson(res, 500, { error: '所有模型调用失败: ' + lastError });
    } catch (e) {
        return sendJson(res, 500, { error: '服务器错误: ' + e.message });
    }
};
