// api/ocr-stock.js - 股票持仓截图AI识别
// 支持智谱GLM-4V / 通义千问VL / OpenAI GPT-4o

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

    try {
        const {image} = req.body || {};
        if (!image) return res.status(400).json({error: '缺少image参数'});
        if (typeof image !== 'string' || (!image.startsWith('data:image/') && !image.startsWith('http'))) {
            return res.status(400).json({error: 'image格式错误，需要base64 dataURI或URL'});
        }

        // 选择模型
        const providers = [];
        if (process.env.ZHIPU_API_KEY) providers.push({
            url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            key: process.env.ZHIPU_API_KEY,
            model: 'glm-4v-flash'
        });
        if (process.env.DASHSCOPE_API_KEY) providers.push({
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            key: process.env.DASHSCOPE_API_KEY,
            model: 'qwen-vl-max-latest'
        });
        if (process.env.OPENAI_API_KEY) providers.push({
            url: 'https://api.openai.com/v1/chat/completions',
            key: process.env.OPENAI_API_KEY,
            model: 'gpt-4o-mini'
        });

        if (!providers.length) {
            return res.status(503).json({error: '请在Vercel环境变量设置 ZHIPU_API_KEY / DASHSCOPE_API_KEY / OPENAI_API_KEY 任一'});
        }

        const prompt = `这是一张股票持仓截图。请识别出所有股票，严格按以下JSON数组格式输出，不要输出任何其他文字：
[{"name":"股票名称","code":"股票代码(6开头加sh前缀,0或3开头加sz前缀,如sh600519)","cost":"成本价(数字)","price":"现价(数字)","shares":"持股数量(数字)"}]
数字字段必须是纯数字，识别不出来填0。`;

        // 尝试每个provider
        let lastError = null;
        for (const p of providers) {
            try {
                const resp = await fetch(p.url, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + p.key,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: p.model,
                        messages: [{
                            role: 'user',
                            content: [
                                {type: 'text', text: prompt},
                                {type: 'image_url', image_url: {url: image}}
                            ]
                        }],
                        max_tokens: 2000,
                        temperature: 0.1
                    })
                });

                if (!resp.ok) {
                    const errText = await resp.text();
                    lastError = p.model + ': ' + resp.status + ' ' + errText.substring(0, 200);
                    continue;
                }

                const data = await resp.json();
                const content = data.choices?.[0]?.message?.content || '';
                const stocks = extractStocks(content);
                
                return res.json({
                    ok: true,
                    stocks: stocks,
                    model: p.model
                });
            } catch(e) {
                lastError = p.model + ': ' + e.message;
            }
        }

        return res.status(500).json({error: '所有模型调用失败: ' + lastError});
    } catch(e) {
        return res.status(500).json({error: '服务器错误: ' + e.message});
    }
}

// 健壮的JSON提取
function extractStocks(text) {
    if (!text) return [];
    
    // 1. 去掉 ```json ... ``` 包裹
    text = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '');
    
    // 2. 尝试直接parse
    try {
        const parsed = JSON.parse(text.trim());
        return cleanStocks(Array.isArray(parsed) ? parsed : [parsed]);
    } catch(e) {}
    
    // 3. 用正则截取第一个[到最后一个]
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
        try {
            const parsed = JSON.parse(match[0]);
            return cleanStocks(parsed);
        } catch(e) {}
    }
    
    return [];
}

// 清洗数据
function cleanStocks(arr) {
    const result = [];
    for (const item of arr) {
        if (!item || typeof item !== 'object') continue;
        
        let code = String(item.code || '').trim().toLowerCase();
        code = code.replace(/^[a-z]+/, ''); // 去掉已有的前缀
        if (/^\d{6}$/.test(code)) {
            if (code.startsWith('6')) code = 'sh' + code;
            else if (code.startsWith('0') || code.startsWith('3')) code = 'sz' + code;
            else if (code.startsWith('4') || code.startsWith('8')) code = 'bj' + code;
        }
        
        result.push({
            name: String(item.name || '').trim(),
            code: code,
            cost: parseFloat(item.cost) || 0,
            price: parseFloat(item.price) || 0,
            shares: Math.round(parseFloat(item.shares) || 100)
        });
    }
    return result;
}
