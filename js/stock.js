/**
 * stock.js - 股票走势页面逻辑
 * 行情来源：腾讯财经（实时行情+日K线，免费无防盗链）
 * 数据存储：localStorage（无后端）
 */

(function () {
    'use strict';

    // ===== 配置 =====
    // 人气热门榜（综合股吧/雪球/同花顺社区讨论热度排序）
    const HOT_STOCKS = [
        { code: 'sh600519', name: '贵州茅台' },
        { code: 'sz300750', name: '宁德时代' },
        { code: 'sz002594', name: '比亚迪' },
        { code: 'sh688981', name: '中芯国际' },
        { code: 'sh688256', name: '寒武纪' },
        { code: 'sh601138', name: '工业富联' },
        { code: 'sz002475', name: '立讯精密' },
        { code: 'sh600036', name: '招商银行' },
        { code: 'sh601318', name: '中国平安' },
        { code: 'sz300059', name: '东方财富' },
        { code: 'sz300033', name: '同花顺' },
        { code: 'sz002230', name: '科大讯飞' },
        { code: 'sh601360', name: '三六零' },
        { code: 'sh688012', name: '中微公司' },
        { code: 'sh688041', name: '海光信息' },
        { code: 'sz002049', name: '紫光国微' },
        { code: 'sh601012', name: '隆基绿能' },
        { code: 'sh600276', name: '恒瑞医药' },
        { code: 'sh603259', name: '药明康德' },
        { code: 'sz000625', name: '长安汽车' }
    ];

    const SCREEN_POOL = [
        // 消费
        { code: 'sh600519', name: '贵州茅台' }, { code: 'sz000858', name: '五粮液' },
        { code: 'sz000568', name: '泸州老窖' }, { code: 'sh600809', name: '山西汾酒' },
        { code: 'sz002304', name: '洋河股份' }, { code: 'sz000596', name: '古井贡酒' },
        { code: 'sh603369', name: '今世缘' }, { code: 'sh600887', name: '伊利股份' },
        { code: 'sh603288', name: '海天味业' }, { code: 'sh600600', name: '青岛啤酒' },
        { code: 'sz002507', name: '涪陵榨菜' }, { code: 'sh603517', name: '绝味食品' },
        { code: 'sz002557', name: '洽洽食品' }, { code: 'sz002847', name: '盐津铺子' },
        // 金融
        { code: 'sh600036', name: '招商银行' }, { code: 'sh601318', name: '中国平安' },
        { code: 'sz002142', name: '宁波银行' }, { code: 'sh600030', name: '中信证券' },
        { code: 'sz300059', name: '东方财富' }, { code: 'sz300033', name: '同花顺' },
        { code: 'sh600570', name: '恒生电子' },
        // 科技/半导体
        { code: 'sz002475', name: '立讯精密' }, { code: 'sh603501', name: '韦尔股份' },
        { code: 'sh603986', name: '兆易创新' }, { code: 'sh688012', name: '中微公司' },
        { code: 'sh688256', name: '寒武纪' }, { code: 'sh688041', name: '海光信息' },
        { code: 'sh688008', name: '澜起科技' }, { code: 'sz002049', name: '紫光国微' },
        { code: 'sz300661', name: '圣邦股份' }, { code: 'sz300782', name: '卓胜微' },
        { code: 'sz002230', name: '科大讯飞' }, { code: 'sh688111', name: '金山办公' },
        { code: 'sz002410', name: '广联达' }, { code: 'sz300624', name: '万兴科技' },
        // 新能源/汽车
        { code: 'sz300750', name: '宁德时代' }, { code: 'sz002594', name: '比亚迪' },
        { code: 'sz300014', name: '亿纬锂能' }, { code: 'sz002460', name: '赣锋锂业' },
        { code: 'sz002466', name: '天齐锂业' }, { code: 'sz002812', name: '恩捷股份' },
        { code: 'sh601012', name: '隆基绿能' }, { code: 'sz002050', name: '三花智控' },
        { code: 'sh601689', name: '拓普集团' }, { code: 'sh600660', name: '福耀玻璃' },
        { code: 'sz000625', name: '长安汽车' }, { code: 'sh600104', name: '上汽集团' },
        // 机器人概念
        { code: 'sz002747', name: '埃斯顿' }, { code: 'sz300124', name: '汇川技术' },
        { code: 'sh688017', name: '绿的谐波' }, { code: 'sz002472', name: '双环传动' },
        { code: 'sz002896', name: '中大力德' }, { code: 'sh603728', name: '鸣志电器' },
        { code: 'sz002979', name: '雷赛智能' }, { code: 'sz300607', name: '拓斯达' },
        // 医药
        { code: 'sh600276', name: '恒瑞医药' }, { code: 'sh603259', name: '药明康德' },
        { code: 'sz300760', name: '迈瑞医疗' }, { code: 'sz000538', name: '云南白药' },
        { code: 'sz300896', name: '爱美客' }, { code: 'sh688363', name: '华熙生物' },
        // 制造/周期
        { code: 'sh600900', name: '长江电力' }, { code: 'sh601088', name: '中国神华' },
        { code: 'sh601857', name: '中国石油' }, { code: 'sh600028', name: '中国石化' },
        { code: 'sh600031', name: '三一重工' }, { code: 'sz000157', name: '中联重科' },
        { code: 'sh601766', name: '中国中车' }, { code: 'sh600585', name: '海螺水泥' },
        { code: 'sh600309', name: '万华化学' }, { code: 'sh601899', name: '紫金矿业' },
        { code: 'sh600111', name: '北方稀土' },
        // 军工
        { code: 'sh600760', name: '中航沈飞' }, { code: 'sh600893', name: '航发动力' },
        // 地产/家电
        { code: 'sz000002', name: '万科A' }, { code: 'sh600048', name: '保利发展' },
        { code: 'sz000333', name: '美的集团' }, { code: 'sz000651', name: '格力电器' },
        // 通信/传媒
        { code: 'sz000063', name: '中兴通讯' }, { code: 'sh600050', name: '中国联通' },
        { code: 'sz002027', name: '分众传媒' }, { code: 'sz300413', name: '芒果超媒' },
        // 农业/物流
        { code: 'sz002714', name: '牧原股份' }, { code: 'sz300498', name: '温氏股份' },
        { code: 'sz002352', name: '顺丰控股' }, { code: 'sh600009', name: '上海机场' },
        // 其他高价股
        { code: 'sh688169', name: '石头科技' }
    ];

    const MARKET_INDICES = [
        { code: 'sh000001', name: '上证指数' },
        { code: 'sz399001', name: '深证成指' },
        { code: 'sz399006', name: '创业板指' }
    ];

    // 选股条件定义（下拉选择预设范围）
    const SCREEN_CONDITIONS = [
        { key: 'price', label: '股价', type: 'realtime', options: [
            { label: '不限', value: '' },
            { label: '10元以下', min: 0, max: 10 },
            { label: '10-30元', min: 10, max: 30 },
            { label: '30-50元', min: 30, max: 50 },
            { label: '50-100元', min: 50, max: 100 },
            { label: '100-300元', min: 100, max: 300 },
            { label: '300元以上', min: 300, max: 999999 }
        ]},
        { key: 'changeRate', label: '今日涨跌幅', type: 'realtime', options: [
            { label: '不限', value: '' },
            { label: '大于3%', min: 3, max: 999 },
            { label: '大于5%', min: 5, max: 999 },
            { label: '大于7%', min: 7, max: 999 },
            { label: '大于10%', min: 10, max: 999 },
            { label: '小于-3%', min: -999, max: -3 },
            { label: '小于-5%', min: -999, max: -5 }
        ]},
        { key: 'turnover', label: '换手率', type: 'realtime', options: [
            { label: '不限', value: '' },
            { label: '小于1%', min: 0, max: 1 },
            { label: '1%-3%', min: 1, max: 3 },
            { label: '3%-5%', min: 3, max: 5 },
            { label: '5%-10%', min: 5, max: 10 },
            { label: '大于10%', min: 10, max: 999 }
        ]},
        { key: 'totalCap', label: '总市值', type: 'realtime', options: [
            { label: '不限', value: '' },
            { label: '100亿以下', min: 0, max: 100 },
            { label: '100-500亿', min: 100, max: 500 },
            { label: '500-1000亿', min: 500, max: 1000 },
            { label: '1000-5000亿', min: 1000, max: 5000 },
            { label: '5000亿以上', min: 5000, max: 999999 }
        ]},
        { key: 'marketCap', label: '流通市值', type: 'realtime', options: [
            { label: '不限', value: '' },
            { label: '100亿以下', min: 0, max: 100 },
            { label: '100-500亿', min: 100, max: 500 },
            { label: '500-1000亿', min: 500, max: 1000 },
            { label: '1000亿以上', min: 1000, max: 999999 }
        ]},
        { key: 'pe', label: '市盈率(PE)', type: 'realtime', options: [
            { label: '不限', value: '' },
            { label: '亏损(PE<0)', min: -999, max: 0 },
            { label: '0-15倍', min: 0, max: 15 },
            { label: '15-30倍', min: 15, max: 30 },
            { label: '30-50倍', min: 30, max: 50 },
            { label: '50倍以上', min: 50, max: 999999 }
        ]},
        { key: 'pb', label: '市净率(PB)', type: 'realtime', options: [
            { label: '不限', value: '' },
            { label: '小于1(破净)', min: 0, max: 1 },
            { label: '1-3倍', min: 1, max: 3 },
            { label: '3-5倍', min: 3, max: 5 },
            { label: '5-10倍', min: 5, max: 10 },
            { label: '10倍以上', min: 10, max: 999999 }
        ]},
        { key: 'amplitude', label: '振幅', type: 'realtime', options: [
            { label: '不限', value: '' },
            { label: '小于3%', min: 0, max: 3 },
            { label: '3%-5%', min: 3, max: 5 },
            { label: '5%-8%', min: 5, max: 8 },
            { label: '大于8%', min: 8, max: 999 }
        ]},
        { key: 'volumeRatio', label: '量比', type: 'realtime', options: [
            { label: '不限', value: '' },
            { label: '小于0.5', min: 0, max: 0.5 },
            { label: '0.5-1', min: 0.5, max: 1 },
            { label: '1-2', min: 1, max: 2 },
            { label: '2-3', min: 2, max: 3 },
            { label: '大于3', min: 3, max: 999 }
        ]},
        { key: 'change3d', label: '3天涨幅', type: 'kline', options: [
            { label: '不限', value: '' },
            { label: '大于5%', min: 5, max: 999 },
            { label: '大于10%', min: 10, max: 999 },
            { label: '大于20%', min: 20, max: 999 },
            { label: '大于30%', min: 30, max: 999 }
        ]},
        { key: 'change5d', label: '5天涨幅', type: 'kline', options: [
            { label: '不限', value: '' },
            { label: '大于5%', min: 5, max: 999 },
            { label: '大于10%', min: 10, max: 999 },
            { label: '大于20%', min: 20, max: 999 },
            { label: '大于30%', min: 30, max: 999 },
            { label: '大于50%', min: 50, max: 999 }
        ]},
        { key: 'change10d', label: '10天涨幅', type: 'kline', options: [
            { label: '不限', value: '' },
            { label: '大于10%', min: 10, max: 999 },
            { label: '大于20%', min: 20, max: 999 },
            { label: '大于30%', min: 30, max: 999 },
            { label: '大于50%', min: 50, max: 999 }
        ]},
        { key: 'newHigh5', label: '5日新高', type: 'kline', options: [
            { label: '不限', value: '' },
            { label: '创5日新高', value: true }
        ]},
        { key: 'newHigh10', label: '10日新高', type: 'kline', options: [
            { label: '不限', value: '' },
            { label: '创10日新高', value: true }
        ]},
        { key: 'newHigh20', label: '20日新高', type: 'kline', options: [
            { label: '不限', value: '' },
            { label: '创20日新高', value: true }
        ]},
        { key: 'newLow5', label: '5日新低', type: 'kline', options: [
            { label: '不限', value: '' },
            { label: '创5日新低', value: true }
        ]},
        { key: 'newLow10', label: '10日新低', type: 'kline', options: [
            { label: '不限', value: '' },
            { label: '创10日新低', value: true }
        ]},
        { key: 'newLow20', label: '20日新低', type: 'kline', options: [
            { label: '不限', value: '' },
            { label: '创20日新低', value: true }
        ]}
    ];

    const STORAGE_KEY = 'lengmeng_stock_favorites';
    const STRATEGY_KEY = 'lengmeng_stock_strategies';
    const SHARES = 100;
    const REFRESH_INTERVAL = 10000;

    // ===== 全市场行情缓存 =====
    let allStocksCache = null;
    let allStocksCacheTime = 0;
    const ALL_CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

    // 东方财富代码转腾讯格式
    function convertCode(code) {
        if (!code) return '';
        code = String(code).trim();
        // 去掉可能的前缀
        code = code.replace(/^(SH|SZ|BJ|sh|sz|bj)/, '');
        if (code.startsWith('6') || code.startsWith('9')) return 'sh' + code;
        if (code.startsWith('0') || code.startsWith('3') || code.startsWith('2')) return 'sz' + code;
        if (code.startsWith('8') || code.startsWith('4')) return 'bj' + code;
        return '';
    }

    // JSONP请求（避免CORS问题）
    function jsonp(url, timeout) {
        return new Promise((resolve, reject) => {
            const cbName = 'jsonp_cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const script = document.createElement('script');
            let timer = null;
            let done = false;
            const cleanup = () => {
                if (timer) clearTimeout(timer);
                try { delete window[cbName]; } catch(e) { window[cbName] = null; }
                if (script.parentNode) script.parentNode.removeChild(script);
            };
            const finish = (err, data) => {
                if (done) return;
                done = true;
                cleanup();
                if (err) reject(err);
                else resolve(data);
            };
            window[cbName] = (data) => {
                finish(null, data);
            };
            // 东方财富标准回调参数 cb
            const sep = url.indexOf('?') >= 0 ? '&' : '?';
            script.src = url + sep + 'cb=' + cbName;
            script.onerror = () => {
                finish(new Error('JSONP脚本加载失败（网络或跨域）'));
            };
            timer = setTimeout(() => {
                finish(new Error('JSONP超时（' + (timeout || 15000) + 'ms）'));
            }, timeout || 15000);
            document.head.appendChild(script);
        });
    }

    // 获取单页A股行情（直接请求新浪财经API，支持CORS，不需要后端代理）
    async function fetchAStockPage(pn, retries) {
        retries = retries || 0;
        const url = 'https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=' + pn + '&num=100&sort=changepercent&asc=0&node=hs_a';
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const rawList = await res.json();
            if (!Array.isArray(rawList)) throw new Error('返回格式错误');
            const list = rawList.map(item => {
                const rawCode = String(item.code || '').trim();
                return {
                    code: rawCode,
                    rawCode: rawCode,
                    name: item.name || '',
                    price: parseFloat(item.trade) || 0,
                    changeRate: parseFloat(item.changepercent) || 0,
                    change: parseFloat(item.pricechange) || 0,
                    volume: parseFloat(item.volume) || 0,
                    amount: parseFloat(item.amount) || 0,
                    amplitude: 0,
                    turnover: parseFloat(item.turnoverratio) || 0,
                    pe: parseFloat(item.per) || 0,
                    volumeRatio: 0,
                    high: parseFloat(item.high) || 0,
                    low: parseFloat(item.low) || 0,
                    open: parseFloat(item.open) || 0,
                    prevClose: parseFloat(item.settlement) || 0,
                    totalCap: (parseFloat(item.mktcap) || 0) / 10000,
                    marketCap: (parseFloat(item.nmc) || 0) / 10000,
                    pb: parseFloat(item.pb) || 0
                };
            }).filter(s => s.code && s.name);
            return { total: -1, list: list };
        } catch (e) {
            console.warn('[stock] 第' + pn + '页加载失败(第' + (retries+1) + '次):', e.message);
            if (retries < 3) {
                await new Promise(r => setTimeout(r, 500 * (retries + 1)));
                return fetchAStockPage(pn, retries + 1);
            }
            console.warn('[stock] 第' + pn + '页最终失败:', e.message);
            return { total: 0, list: [] };
        }
    }

    // 分页获取全市场A股行情（新浪接口，不返回总数，根据返回数量判断）
    async function fetchAllAStocks(onProgress) {
        if (allStocksCache && Date.now() - allStocksCacheTime < ALL_CACHE_DURATION) {
            if (onProgress) onProgress('cached', allStocksCache.length);
            return allStocksCache;
        }
        const startTime = Date.now();
        const all = [];
        const MAX_PAGES = 80; // 最多80页，约8000只股票

        // 第一页：重试直到成功（最多5次）
        let first = null;
        let firstRetry = 0;
        while (!first || !first.list || first.list.length === 0) {
            firstRetry++;
            if (firstRetry > 5) {
                const errMsg = '第一页加载失败，已重试5次。请检查网络或稍后重试。';
                console.error('[stock]', errMsg);
                if (loadAllText) loadAllText.textContent = '❌ ' + errMsg + '（已用' + ((Date.now()-startTime)/1000).toFixed(0) + 's）';
                throw new Error(errMsg);
            }
            if (firstRetry > 1) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                if (loadAllText) loadAllText.textContent = '第一页加载失败，第' + firstRetry + '次重试...（已用' + elapsed + 's）';
                await new Promise(r => setTimeout(r, 1000));
            }
            first = await fetchAStockPage(1, firstRetry - 1);
        }

        all.push.apply(all, first.list);
        let currentPage = 1;
        const failedPages = [];

        // 如果第一页返回少于100条，说明只有一页
        if (first.list.length < 100) {
            allStocksCache = all;
            allStocksCacheTime = Date.now();
            const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
            if (loadAllText) loadAllText.textContent = '✅ 加载完成：' + all.length + ' 只A股 · 耗时' + totalTime + 's';
            return all;
        }

        // 后续页：并发3，直到返回少于100条或达到最大页数
        const concurrency = 3;
        let hasMore = true;
        while (hasMore && currentPage < MAX_PAGES) {
            const batch = [];
            const pageNumbers = [];
            for (let i = 0; i < concurrency && currentPage < MAX_PAGES; i++) {
                currentPage++;
                batch.push(fetchAStockPage(currentPage));
                pageNumbers.push(currentPage);
            }
            const results = await Promise.all(batch);
            results.forEach((r, idx) => {
                if (r.list && r.list.length > 0) {
                    all.push.apply(all, r.list);
                    if (r.list.length < 100) {
                        hasMore = false; // 最后一页
                    }
                } else {
                    failedPages.push(pageNumbers[idx]);
                }
            });
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
            if (loadAllText) {
                loadAllText.textContent = '已获取 ' + all.length + ' 只（第' + currentPage + '页）· 已用' + elapsed + 's';
            }
            if (onProgress) onProgress(currentPage, MAX_PAGES, all.length);
        }

        // 重试失败的页（最多2轮）
        for (let retryRound = 1; retryRound <= 2 && failedPages.length > 0; retryRound++) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
            if (loadAllText) loadAllText.textContent = '正在重试 ' + failedPages.length + ' 个失败页（第' + retryRound + '轮）· 已用' + elapsed + 's';
            await new Promise(r => setTimeout(r, 1000));
            const stillFailed = [];
            for (let i = 0; i < failedPages.length; i += concurrency) {
                const batch = failedPages.slice(i, i + concurrency).map(p => fetchAStockPage(p));
                const results = await Promise.all(batch);
                results.forEach((r, idx) => {
                    if (r.list && r.list.length > 0) {
                        all.push.apply(all, r.list);
                    } else {
                        stillFailed.push(failedPages[i + idx]);
                    }
                });
            }
            failedPages.length = 0;
            failedPages.push.apply(failedPages, stillFailed);
        }

        allStocksCache = all;
        allStocksCacheTime = Date.now();
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

        if (failedPages.length > 0) {
            console.warn('[stock] ' + failedPages.length + ' 页最终加载失败:', failedPages);
            if (loadAllText) loadAllText.textContent = '⚠️ 加载完成：' + all.length + ' 只（' + failedPages.length + '页失败）· 耗时' + totalTime + 's';
        } else {
            if (loadAllText) loadAllText.textContent = '✅ 加载完成：' + all.length + ' 只A股 · 耗时' + totalTime + 's';
        }
        return all;
    }

    // ===== 状态 =====
    let favorites = [];
    let strategies = [];
    let quotes = {};
    let marketQuotes = {};
    let klineCache = {};
    let refreshTimer = null;
    let isRefreshing = false;
    let activeStrategyId = null;
    let viewMode = 'bubble';
    let currentView = 'hot'; // 'hot' 热门榜 | 'search' 搜索结果 | 'strategy' 策略结果
    let lastSearchKeyword = '';
    let strategyResults = []; // 当前策略筛选结果
    let currentStrategyName = '';
    let hotStocks = []; // 动态热门榜数据
    let hotSource = 'all'; // 热门榜来源: all/eastmoney/ths/xueqiu
    let hotLoading = false;

    // ===== DOM =====
    const hotGrid = document.getElementById('hotGrid');
    const stockTbody = document.getElementById('stockTbody');
    const cloudCanvas = document.getElementById('cloudCanvas');
    const totalCountEl = document.getElementById('totalCount');
    const totalValueEl = document.getElementById('totalValue');
    const totalPnlEl = document.getElementById('totalPnl');
    const totalPnlRateEl = document.getElementById('totalPnlRate');
    const updateTimeEl = document.getElementById('updateTime');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const marketBar = document.getElementById('marketBar');
    const strategyList = document.getElementById('strategyList');
    const screenResult = document.getElementById('screenResult');
    const createStrategyBtn = document.getElementById('createStrategyBtn');
    const loadAllBtn = document.getElementById('loadAllBtn');
    const loadAllProgress = document.getElementById('loadAllProgress');
    const loadAllBar = document.getElementById('loadAllBar');
    const loadAllText = document.getElementById('loadAllText');
    const strategyModal = document.getElementById('strategyModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const saveStrategyBtn = document.getElementById('saveStrategyBtn');
    const strategyNameInput = document.getElementById('strategyNameInput');
    const conditionContainer = document.getElementById('conditionContainer');
    const stockSearch = document.getElementById('stockSearch');
    const searchBtn = document.getElementById('searchBtn');
    const searchResultSection = document.getElementById('searchResultSection');
    const searchResultTitle = document.getElementById('searchResultTitle');
    const searchResultTip = document.getElementById('searchResultTip');
    const searchResultGrid = document.getElementById('searchResultGrid');
    const searchProgress = document.getElementById('searchProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const hotSectionTitle = document.getElementById('hotSectionTitle');
    const hotSectionTip = document.getElementById('hotSectionTip');

    if (!hotGrid) return;

    // ===== 本地存储 =====
    function loadFavorites() {
        try { favorites = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch (e) { favorites = []; }
    }
    function saveFavorites() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); }
        catch (e) { console.error('存储失败', e); }
    }
    function loadStrategies() {
        try { strategies = JSON.parse(localStorage.getItem(STRATEGY_KEY)) || []; }
        catch (e) { strategies = []; }
    }
    function saveStrategies() {
        try { localStorage.setItem(STRATEGY_KEY, JSON.stringify(strategies)); }
        catch (e) { console.error('策略存储失败', e); }
    }

    // ===== 腾讯实时行情API（JSONP） =====
    function fetchQuotes(stockList) {
        return new Promise((resolve, reject) => {
            if (!stockList || !stockList.length) { resolve({}); return; }
            const codes = stockList.map(s => s.code || s).join(',');
            const script = document.createElement('script');
            const url = `https://qt.gtimg.cn/q=${codes}`;
            const timeout = setTimeout(() => { cleanup(); reject(new Error('超时')); }, 8000);
            function cleanup() {
                clearTimeout(timeout);
                if (script.parentNode) script.parentNode.removeChild(script);
            }
            script.onload = () => {
                clearTimeout(timeout);
                const result = {};
                stockList.forEach(stock => {
                    const code = stock.code || stock;
                    const raw = window['v_' + code];
                    if (raw && typeof raw === 'string') {
                        const f = raw.split('~');
                        if (f.length > 40) {
                            result[code] = {
                                name: f[1], code: f[2],
                                price: parseFloat(f[3]), prevClose: parseFloat(f[4]),
                                open: parseFloat(f[5]), volume: parseFloat(f[6]),
                                high: parseFloat(f[33]) || 0, low: parseFloat(f[34]) || 0,
                                amount: parseFloat(f[37]) || 0, turnover: parseFloat(f[38]) || 0,
                                pe: parseFloat(f[39]) || 0, amplitude: parseFloat(f[43]) || 0,
                                marketCap: parseFloat(f[44]) || 0, totalCap: parseFloat(f[45]) || 0,
                                pb: parseFloat(f[46]) || 0, volumeRatio: parseFloat(f[49]) || 0,
                                change: parseFloat(f[31]) || 0, changeRate: parseFloat(f[32]) || 0
                            };
                        }
                    }
                    try { delete window['v_' + code]; } catch (e) { window['v_' + code] = undefined; }
                });
                cleanup();
                resolve(result);
            };
            script.onerror = () => { cleanup(); reject(new Error('失败')); };
            script.src = url;
            document.head.appendChild(script);
        });
    }

    // ===== 腾讯K线API（fetch，支持CORS） =====
    async function fetchKline(code, days = 25) {
        if (klineCache[code]) return klineCache[code];
        try {
            const res = await fetch(`https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,,,${days},qfq`);
            const data = await res.json();
            const node = data.data && data.data[code];
            const kline = (node && (node.qfqday || node.day)) || [];
            klineCache[code] = kline;
            return kline;
        } catch (e) {
            console.warn('K线获取失败:', code, e.message);
            return [];
        }
    }

    // ===== 获取动态热门榜 =====
    async function fetchHotStocks(source = 'all', size = 30) {
        if (hotLoading) return hotStocks;
        hotLoading = true;
        try {
            const res = await fetch(`./api/hot-stocks?source=${source}&size=${size}`, { cache: 'no-store' });
            const json = await res.json();
            if (json.success && json.data && json.data.length) {
                hotStocks = json.data.map(s => ({
                    code: s.code,
                    name: s.name,
                    hotValue: s.hotValue || 0,
                    source: s.source || (s.sources ? s.sources.join('/') : '综合')
                }));
                // 同时获取这些股票的实时行情
                const codes = hotStocks.map(s => ({ code: s.code }));
                try {
                    const quotesData = await fetchQuotes(codes);
                    quotes = { ...quotes, ...quotesData };
                } catch (e) {
                    console.warn('热门榜行情获取失败:', e.message);
                }
                return hotStocks;
            }
        } catch (e) {
            console.warn('热门榜API失败，使用内置数据:', e.message);
        } finally {
            hotLoading = false;
        }
        // 失败时回退到内置数据
        hotStocks = HOT_STOCKS.slice();
        return hotStocks;
    }

    // ===== K线图弹窗 =====
    let klineModal = null, klineCanvas = null, klineCtx = null;
    let currentKlineCode = '', currentKlineData = [];

    function initKlineModal() {
        klineModal = document.getElementById('klineModal');
        klineCanvas = document.getElementById('klineCanvas');
        if (klineCanvas) klineCtx = klineCanvas.getContext('2d');
        const closeBtn = document.getElementById('klineCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', closeKlineModal);
        if (klineModal) {
            klineModal.addEventListener('click', (e) => {
                if (e.target === klineModal) closeKlineModal();
            });
        }
        ['ma5Check', 'ma10Check', 'ma30Check'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => drawKlineChart());
        });
    }

    function openKlineModal(code, name) {
        if (!klineModal) initKlineModal();
        currentKlineCode = code;
        document.getElementById('klineTitle').textContent = name + ' (' + code.toUpperCase() + ') 日K线';
        document.getElementById('klineInfo').textContent = '加载中...';
        klineModal.classList.add('show');
        loadAndDrawKline(code);
    }

    function closeKlineModal() {
        if (klineModal) klineModal.classList.remove('show');
    }

    async function loadAndDrawKline(code) {
        const kline = await fetchKline(code, 60);
        currentKlineData = kline;
        if (!kline.length) {
            document.getElementById('klineInfo').textContent = '暂无K线数据';
            return;
        }
        const latest = kline[kline.length - 1];
        const prev = kline.length > 1 ? kline[kline.length - 2] : null;
        const close = parseFloat(latest[2]);
        const prevClose = prev ? parseFloat(prev[2]) : close;
        const change = ((close - prevClose) / prevClose * 100).toFixed(2);
        const dir = close >= prevClose ? 'up' : 'down';
        document.getElementById('klineInfo').innerHTML =
            `<span>最新: ¥${close.toFixed(2)}</span>` +
            `<span class="pnl-${dir}">${close >= prevClose ? '+' : ''}${change}%</span>` +
            `<span>最高: ¥${parseFloat(latest[3]).toFixed(2)}</span>` +
            `<span>最低: ¥${parseFloat(latest[4]).toFixed(2)}</span>` +
            `<span>日期: ${latest[0]}</span>` +
            `<span>共${kline.length}个交易日</span>`;
        drawKlineChart();
    }

    function calcMA(kline, period) {
        const ma = [];
        for (let i = 0; i < kline.length; i++) {
            if (i < period - 1) { ma.push(null); continue; }
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) sum += parseFloat(kline[j][2]);
            ma.push(sum / period);
        }
        return ma;
    }

    function drawKlineChart() {
        if (!klineCtx || !currentKlineData.length) return;
        const canvas = klineCanvas;
        const W = canvas.width, H = canvas.height;
        const ctx = klineCtx;
        ctx.clearRect(0, 0, W, H);

        const kline = currentKlineData;
        const padL = 50, padR = 20, padT = 20, padB = 40;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        // 计算价格范围
        let minP = Infinity, maxP = -Infinity;
        kline.forEach(k => {
            const h = parseFloat(k[3]), l = parseFloat(k[4]);
            if (h > maxP) maxP = h;
            if (l < minP) minP = l;
        });
        // 包含均线
        const ma5 = calcMA(kline, 5);
        const ma10 = calcMA(kline, 10);
        const ma30 = calcMA(kline, 30);
        [ma5, ma10, ma30].forEach(ma => {
            ma.forEach(v => { if (v !== null) { if (v > maxP) maxP = v; if (v < minP) minP = v; } });
        });
        const range = maxP - minP || 1;
        minP -= range * 0.05;
        maxP += range * 0.05;

        const yScale = (price) => padT + (maxP - price) / (maxP - minP) * chartH;
        const barW = Math.max(2, chartW / kline.length * 0.7);
        const gap = chartW / kline.length;

        // 绘制网格和Y轴标签
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = padT + chartH * i / 4;
            const price = maxP - (maxP - minP) * i / 4;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            ctx.fillText(price.toFixed(2), padL - 5, y + 4);
        }

        // 绘制K线
        kline.forEach((k, i) => {
            const x = padL + gap * i + gap / 2;
            const open = parseFloat(k[1]);
            const close = parseFloat(k[2]);
            const high = parseFloat(k[3]);
            const low = parseFloat(k[4]);
            const isUp = close >= open;
            ctx.strokeStyle = isUp ? '#ef4444' : '#22c55e';
            ctx.fillStyle = isUp ? '#ef4444' : '#22c55e';
            // 影线
            ctx.beginPath();
            ctx.moveTo(x, yScale(high));
            ctx.lineTo(x, yScale(low));
            ctx.stroke();
            // 实体
            const bodyTop = yScale(Math.max(open, close));
            const bodyH = Math.max(1, Math.abs(yScale(open) - yScale(close)));
            ctx.fillRect(x - barW / 2, bodyTop, barW, bodyH);
        });

        // 绘制均线
        const showMA5 = document.getElementById('ma5Check')?.checked;
        const showMA10 = document.getElementById('ma10Check')?.checked;
        const showMA30 = document.getElementById('ma30Check')?.checked;

        function drawMA(ma, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            let started = false;
            ma.forEach((v, i) => {
                if (v === null) return;
                const x = padL + gap * i + gap / 2;
                const y = yScale(v);
                if (!started) { ctx.moveTo(x, y); started = true; }
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }
        if (showMA5) drawMA(ma5, '#fbbf24');
        if (showMA10) drawMA(ma10, '#60a5fa');
        if (showMA30) drawMA(ma30, '#c084fc');

        // X轴日期标签
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        const labelCount = Math.min(6, kline.length);
        for (let i = 0; i < labelCount; i++) {
            const idx = Math.floor(i * (kline.length - 1) / (labelCount - 1));
            const x = padL + gap * idx + gap / 2;
            ctx.fillText(kline[idx][0].slice(5), x, H - padB + 20);
        }
    }

    // 计算阶段涨幅
    function calcPeriodChange(kline, days) {
        if (!kline || kline.length < days + 1) return null;
        const todayClose = parseFloat(kline[kline.length - 1][2]);
        const pastClose = parseFloat(kline[kline.length - 1 - days][2]);
        if (!pastClose) return null;
        return ((todayClose - pastClose) / pastClose) * 100;
    }

    // 是否创N日新高
    function isNewHigh(kline, days) {
        if (!kline || kline.length < days) return false;
        const recent = kline.slice(-days);
        const todayHigh = parseFloat(recent[recent.length - 1][3]);
        const maxHigh = Math.max(...recent.map(k => parseFloat(k[3])));
        return todayHigh >= maxHigh;
    }

    // 是否创N日新低
    function isNewLow(kline, days) {
        if (!kline || kline.length < days) return false;
        const recent = kline.slice(-days);
        const todayLow = parseFloat(recent[recent.length - 1][4]);
        const minLow = Math.min(...recent.map(k => parseFloat(k[4])));
        return todayLow <= minLow;
    }

    // ===== 计算涨跌 =====
    function calcChange(quote) {
        if (!quote || !quote.prevClose || !quote.price) return { change: 0, rate: 0, dir: 'flat' };
        const change = quote.price - quote.prevClose;
        const rate = (change / quote.prevClose) * 100;
        let dir = 'flat';
        if (change > 0.001) dir = 'up';
        else if (change < -0.001) dir = 'down';
        return { change, rate, dir };
    }

    // ===== 渲染大盘指标（含微缩走势图） =====
    function renderMarketBar() {
        if (!marketBar) return;
        marketBar.innerHTML = '';
        MARKET_INDICES.forEach(idx => {
            const q = marketQuotes[idx.code];
            let point = '--', change = '--', rate = '--', dir = 'flat';
            if (q) {
                point = q.price.toFixed(2);
                const c = calcChange(q);
                change = (c.change >= 0 ? '+' : '') + c.change.toFixed(2);
                rate = (c.rate >= 0 ? '+' : '') + c.rate.toFixed(2) + '%';
                dir = c.dir;
            }
            const item = document.createElement('div');
            item.className = `market-item ${dir}`;
            item.innerHTML = `
                <div class="market-top">
                    <span class="market-name">${idx.name}</span>
                    <span class="market-change">${change} ${rate}</span>
                </div>
                <div class="market-bottom">
                    <span class="market-point">${point}</span>
                    <canvas class="market-spark" width="100" height="36" data-code="${idx.code}"></canvas>
                </div>
            `;
            marketBar.appendChild(item);
        });
        // 绘制微缩走势图
        MARKET_INDICES.forEach(idx => drawMarketSpark(idx.code));
    }

    // 绘制指数微缩走势图
    async function drawMarketSpark(code) {
        const canvas = document.querySelector(`.market-spark[data-code="${code}"]`);
        if (!canvas) return;
        const kline = await fetchKline(code, 20);
        if (!kline || kline.length < 2) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const closes = kline.map(k => parseFloat(k[2]));
        const min = Math.min(...closes), max = Math.max(...closes);
        const range = max - min || 1;
        const isUp = closes[closes.length - 1] >= closes[0];
        const color = isUp ? '#ef4444' : '#22c55e';

        // 折线
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        closes.forEach((v, i) => {
            const x = (i / (closes.length - 1)) * W;
            const y = H - ((v - min) / range) * (H - 4) - 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 渐变填充
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, color + '40');
        grad.addColorStop(1, color + '05');
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // ===== 股票搜索 =====
    let searchTimer = null;

    function showProgress(percent, text) {
        if (!searchProgress) return;
        searchProgress.style.display = 'block';
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressText) progressText.textContent = text;
    }
    function hideProgress() {
        if (searchProgress) searchProgress.style.display = 'none';
    }

    function renderStockCards(list) {
        hotGrid.innerHTML = '';
        if (!list.length) {
            hotGrid.innerHTML = '<div class="screen-empty" style="grid-column:1/-1">未找到匹配的股票</div>';
            return;
        }
        list.slice(0, 20).forEach(stock => {
            const q = stock.price !== undefined ? stock : (quotes[stock.code] || stock);
            const dir = q.changeRate >= 0 ? 'up' : 'down';
            const inFav = favorites.some(f => f.code === stock.code);
            const card = document.createElement('div');
            card.className = 'hot-card';
            card.innerHTML = `
                <div class="hot-card-header">
                    <span class="hot-name">${q.name}</span>
                    <span class="hot-code">${stock.code.toUpperCase()}</span>
                </div>
                <div class="hot-card-price">
                    <span class="price-num">¥${q.price ? q.price.toFixed(2) : '--'}</span>
                    <span class="price-change pnl-${dir}">${dir==='up'?'+':''}${q.changeRate ? q.changeRate.toFixed(2) : '0.00'}%</span>
                </div>
                <div class="hot-card-meta">
                    <span>换手:${q.turnover ? q.turnover.toFixed(2) : '--'}%</span>
                    <span>PE:${q.pe ? q.pe.toFixed(1) : '--'}</span>
                </div>
                <button class="hot-add-btn ${inFav?'added':''}" data-code="${stock.code}" data-name="${q.name}">${inFav?'✓ 已加':'+ 自选'}</button>
            `;
            hotGrid.appendChild(card);
        });
        hotGrid.querySelectorAll('.hot-add-btn:not(.added)').forEach(btn => {
            btn.addEventListener('click', async () => {
                const before = favorites.length;
                await addToFavorites(btn.dataset.code, btn.dataset.name);
                if (favorites.length > before) {
                    btn.textContent = '✓ 已加';
                    btn.classList.add('added');
                }
            });
        });
    }

    // 策略结果卡片展示
    function renderStrategyCards(list) {
        if (!hotGrid) return;
        if (hotSectionTitle) {
            hotSectionTitle.textContent = '策略：' + currentStrategyName;
        }
        if (hotSectionTip) {
            hotSectionTip.textContent = '共 ' + list.length + ' 只符合条件 · 可在搜索框中进一步筛选';
        }
        // 更新搜索框placeholder
        if (stockSearch) {
            stockSearch.placeholder = '在 ' + list.length + ' 只策略结果中搜索（清空恢复热门榜）';
        }
        renderStockCards(list);
        // 添加恢复热门榜按钮
        if (hotSectionTip && !document.getElementById('backToHotBtn')) {
            const btn = document.createElement('button');
            btn.id = 'backToHotBtn';
            btn.className = 'search-btn';
            btn.style.marginLeft = '0.5rem';
            btn.style.padding = '0.2rem 0.8rem';
            btn.style.fontSize = '0.75rem';
            btn.textContent = '恢复热门榜';
            btn.addEventListener('click', () => {
                currentView = 'hot';
                currentStrategyName = '';
                strategyResults = [];
                activeStrategyId = null;
                if (stockSearch) stockSearch.value = '';
                if (hotSectionTitle) hotSectionTitle.textContent = '人气热门榜';
                if (hotSectionTip) hotSectionTip.textContent = '综合股吧/雪球/社区热度 · 点击「+自选」加入，默认买入100股';
                if (stockSearch) stockSearch.placeholder = '输入股票名称或代码，回车搜索（如：茅台、600519）';
                renderStrategyList();
                const list = hotStocks.length ? hotStocks : HOT_STOCKS;
                renderStockCards(list);
            });
            hotSectionTip.appendChild(btn);
        }
    }

    // 渲染搜索结果卡片到独立板块
    function renderSearchCards(list) {
        if (!searchResultGrid) return;
        searchResultGrid.innerHTML = '';
        if (!list.length) {
            searchResultGrid.innerHTML = '<div class="screen-empty" style="grid-column:1/-1">未找到匹配的股票</div>';
            return;
        }
        list.slice(0, 20).forEach(stock => {
            const q = stock.price !== undefined ? stock : (quotes[stock.code] || stock);
            const dir = q.changeRate >= 0 ? 'up' : 'down';
            const inFav = favorites.some(f => f.code === stock.code);
            const card = document.createElement('div');
            card.className = 'hot-card';
            card.innerHTML = `
                <div class="hot-card-header">
                    <span class="hot-name">${q.name}</span>
                    <span class="hot-code">${stock.code.toUpperCase()}</span>
                </div>
                <div class="hot-card-price">
                    <span class="price-num">¥${q.price ? q.price.toFixed(2) : '--'}</span>
                    <span class="price-change pnl-${dir}">${dir==='up'?'+':''}${q.changeRate ? q.changeRate.toFixed(2) : '0.00'}%</span>
                </div>
                <div class="hot-card-meta">
                    <span>换手:${q.turnover ? q.turnover.toFixed(2) : '--'}%</span>
                    <span>PE:${q.pe ? q.pe.toFixed(1) : '--'}</span>
                </div>
                <button class="hot-add-btn ${inFav?'added':''}" data-code="${stock.code}" data-name="${q.name}">${inFav?'✓ 已加':'+ 自选'}</button>
            `;
            searchResultGrid.appendChild(card);
        });
        searchResultGrid.querySelectorAll('.hot-add-btn:not(.added)').forEach(btn => {
            btn.addEventListener('click', async () => {
                const before = favorites.length;
                await addToFavorites(btn.dataset.code, btn.dataset.name);
                if (favorites.length > before) {
                    btn.textContent = '✓ 已加';
                    btn.classList.add('added');
                }
            });
        });
    }

    async function doSearch(keyword) {
        if (!keyword || !keyword.trim()) {
            // 清空搜索：隐藏搜索结果板块
            if (searchResultSection) searchResultSection.style.display = 'none';
            lastSearchKeyword = '';
            hideProgress();
            return;
        }
        keyword = keyword.trim();
        lastSearchKeyword = keyword;

        // 显示搜索结果板块
        if (searchResultSection) searchResultSection.style.display = 'block';
        if (searchResultTitle) searchResultTitle.textContent = '搜索：' + keyword;
        if (searchResultTip) searchResultTip.textContent = '';

        keyword = keyword.toLowerCase();
        showProgress(10, '正在搜索...');

        // 优先用全市场缓存
        if (allStocksCache && allStocksCache.length) {
            showProgress(80, '匹配中...');
            const matched = allStocksCache.filter(s =>
                s.name.toLowerCase().includes(keyword) ||
                s.code.includes(keyword) ||
                s.rawCode.includes(keyword)
            );
            if (searchResultTip) searchResultTip.textContent = '找到 ' + matched.length + ' 只';
            showProgress(100, '找到 ' + matched.length + ' 只');
            hideProgress();
            renderSearchCards(matched);
            return;
        }

        // 全市场未加载，只搜热门池（87只），并提示用户手动加载
        const quickPool = [];
        const added = new Set();
        [...HOT_STOCKS, ...SCREEN_POOL, ...favorites].forEach(s => {
            if (!added.has(s.code)) {
                added.add(s.code);
                const q = quotes[s.code];
                quickPool.push(q ? { ...s, ...q } : s);
            }
        });
        const quickMatched = quickPool.filter(s =>
            (s.name && s.name.toLowerCase().includes(keyword)) ||
            (s.code && s.code.includes(keyword))
        );
        if (searchResultTip) {
            searchResultTip.textContent = '热门池找到 ' + quickMatched.length + ' 只（全市场数据未加载，点击「加载全市场数据」获取更全结果）';
        }
        showProgress(100, '热门池找到 ' + quickMatched.length + ' 只');
        hideProgress();
        renderSearchCards(quickMatched);
    }

    function initSearch() {
        if (!stockSearch) return;
        const safeSearch = (val) => {
            doSearch(val).catch(err => {
                console.error('搜索异常:', err);
                hideProgress();
                if (hotGrid) hotGrid.innerHTML = '<div class="screen-empty" style="grid-column:1/-1">搜索出错，请重试</div>';
            });
        };
        // 回车搜索
        stockSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimer);
                safeSearch(stockSearch.value);
            }
        });
        // 搜索按钮
        if (searchBtn) {
            searchBtn.addEventListener('click', () => safeSearch(stockSearch.value));
        }
        // 清空时恢复热门榜
        stockSearch.addEventListener('input', () => {
            if (!stockSearch.value.trim()) {
                clearTimeout(searchTimer);
                safeSearch('');
            }
        });
    }

    // ===== 渲染热门股票 =====
    function renderHotStocks() {
        hotGrid.innerHTML = '';
        HOT_STOCKS.forEach(stock => {
            const quote = quotes[stock.code];
            const { rate, dir } = calcChange(quote);
            const inFav = favorites.some(f => f.code === stock.code);
            const card = document.createElement('div');
            card.className = `hot-card ${inFav ? 'in-fav' : ''}`;
            card.innerHTML = `
                <div class="hot-name">${stock.name}</div>
                <div class="hot-code">${stock.code.toUpperCase()}</div>
                <div class="hot-price ${dir}">${quote ? quote.price.toFixed(2) : '--'}</div>
                <div class="hot-change ${dir}">${quote ? (dir === 'up' ? '+' : '') + rate.toFixed(2) + '%' : '--'}</div>
                <button class="hot-add-btn ${inFav ? 'added' : ''}" data-code="${stock.code}" data-name="${stock.name}">
                    ${inFav ? '✓ 已在自选' : '+ 加入自选'}
                </button>
            `;
            hotGrid.appendChild(card);
        });
        hotGrid.querySelectorAll('.hot-add-btn:not(.added)').forEach(btn => {
            btn.addEventListener('click', () => addToFavorites(btn.dataset.code, btn.dataset.name));
        });
    }

    // ===== 自选股操作 =====
    async function addToFavorites(code, name) {
        if (favorites.some(f => f.code === code)) return;
        // 确保有实时行情
        let quote = quotes[code];
        if (!quote) {
            try {
                const result = await fetchQuotes([{ code }]);
                quote = result[code];
                if (quote) quotes[code] = quote;
            } catch (e) {
                console.warn('获取行情失败，使用0作为买入价', e);
            }
        }
        const buyPrice = quote ? quote.price : 0;
        if (buyPrice <= 0) {
            alert('获取该股票实时行情失败，请稍后重试或检查网络');
            return;
        }
        const today = new Date().toISOString().slice(0, 10);
        favorites.push({ code, name, buyPrice, addDate: today });
        saveFavorites();
        renderAll();
    }

    function removeFromFavorites(code) {
        favorites = favorites.filter(f => f.code !== code);
        saveFavorites();
        renderAll();
    }

    function renderFavorites() {
        if (!favorites.length) {
            stockTbody.innerHTML = '<tr class="empty-row"><td colspan="11">暂无自选股，从上方热门股票中添加</td></tr>';
            return;
        }
        stockTbody.innerHTML = '';
        favorites.forEach(fav => {
            const quote = quotes[fav.code];
            const price = quote ? quote.price : fav.buyPrice;
            const { rate, dir } = calcChange(quote);
            const pnl = (price - fav.buyPrice) * SHARES;
            const pnlRate = fav.buyPrice ? ((price - fav.buyPrice) / fav.buyPrice) * 100 : 0;
            const pnlDir = pnl > 0.01 ? 'up' : (pnl < -0.01 ? 'down' : 'flat');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong class="stock-name-link" data-code="${fav.code}" data-name="${fav.name}" style="cursor:pointer;color:var(--accent,#00d4ff);text-decoration:underline">${fav.name}</strong></td>
                <td>${fav.code.toUpperCase()}</td>
                <td>${fav.addDate}</td>
                <td>¥${fav.buyPrice.toFixed(2)}</td>
                <td>¥${price.toFixed(2)}</td>
                <td class="pnl-${dir}">${quote ? (dir === 'up' ? '+' : '') + rate.toFixed(2) + '%' : '--'}</td>
                <td>${SHARES}</td>
                <td class="pnl-${pnlDir}">${pnl >= 0 ? '+' : ''}¥${pnl.toFixed(2)}</td>
                <td class="pnl-${pnlDir}">${pnl >= 0 ? '+' : ''}${pnlRate.toFixed(2)}%</td>
                <td><button class="kline-btn" data-code="${fav.code}" data-name="${fav.name}">📈 走势</button></td>
                <td><button class="del-btn" data-code="${fav.code}">移除</button></td>
            `;
            stockTbody.appendChild(tr);
        });
        stockTbody.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('确定移除该自选股？')) removeFromFavorites(btn.dataset.code);
            });
        });
        stockTbody.querySelectorAll('.kline-btn, .stock-name-link').forEach(btn => {
            btn.addEventListener('click', () => openKlineModal(btn.dataset.code, btn.dataset.name));
        });
    }

    // ===== 概览 =====
    function updateOverview() {
        const count = favorites.length;
        let totalCost = 0, totalValue = 0;
        favorites.forEach(fav => {
            const quote = quotes[fav.code];
            const price = quote ? quote.price : fav.buyPrice;
            totalCost += fav.buyPrice * SHARES;
            totalValue += price * SHARES;
        });
        const totalPnl = totalValue - totalCost;
        const totalPnlRate = totalCost ? (totalPnl / totalCost) * 100 : 0;
        const pnlDir = totalPnl > 0.01 ? 'up' : (totalPnl < -0.01 ? 'down' : 'flat');
        totalCountEl.textContent = count;
        totalValueEl.textContent = `¥${totalValue.toFixed(2)}`;
        totalPnlEl.textContent = `${totalPnl >= 0 ? '+' : ''}¥${totalPnl.toFixed(2)}`;
        totalPnlEl.className = `overview-value ${pnlDir}`;
        totalPnlRateEl.textContent = `${totalPnlRate >= 0 ? '+' : ''}${totalPnlRate.toFixed(2)}%`;
        totalPnlRateEl.className = `overview-value ${pnlDir}`;
        const now = new Date();
        updateTimeEl.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    }

    // ===== 盈利云图 =====
    function renderCloud() {
        if (!cloudCanvas) return;
        if (viewMode === 'heatmap') {
            renderHeatmap();
            return;
        }
        const ctx = cloudCanvas.getContext('2d');
        const W = cloudCanvas.width, H = cloudCanvas.height;
        ctx.clearRect(0, 0, W, H);
        if (!favorites.length) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('添加自选股后显示盈利云图', W / 2, H / 2);
            return;
        }
        const padL = 60, padR = 30, padT = 30, padB = 50;
        const plotW = W - padL - padR, plotH = H - padT - padB;
        let maxRate = 5, minRate = -5, maxValue = 0;
        const bubbles = favorites.map(fav => {
            const quote = quotes[fav.code];
            const price = quote ? quote.price : fav.buyPrice;
            const rate = fav.buyPrice ? ((price - fav.buyPrice) / fav.buyPrice) * 100 : 0;
            const value = price * SHARES;
            maxRate = Math.max(maxRate, rate);
            minRate = Math.min(minRate, rate);
            maxValue = Math.max(maxValue, value);
            return { ...fav, price, rate, value };
        });
        const rateRange = Math.max(Math.abs(maxRate), Math.abs(minRate), 5);
        maxRate = rateRange; minRate = -rateRange;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const x = padL + (plotW / 4) * i;
            ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
        }
        const zeroX = padL + plotW / 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(zeroX, padT); ctx.lineTo(zeroX, padT + plotH); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i <= 4; i++) {
            const x = padL + (plotW / 4) * i;
            const rate = minRate + (maxRate - minRate) * (i / 4);
            ctx.fillText(rate.toFixed(1) + '%', x, padT + plotH + 20);
        }
        ctx.fillText('收益率 →', padL + plotW / 2, padT + plotH + 40);
        const bubbleData = [];
        bubbles.forEach((b, i) => {
            const x = padL + ((b.rate - minRate) / (maxRate - minRate)) * plotW;
            const y = padT + 30 + (plotH - 60) * ((i * 0.7 + 0.15) % 1);
            const radius = 12 + (b.value / (maxValue || 1)) * 28;
            const color = b.rate > 0.01 ? '239,68,68' : (b.rate < -0.01 ? '34,197,94' : '150,150,150');
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
            grad.addColorStop(0, `rgba(${color},0.7)`);
            grad.addColorStop(1, `rgba(${color},0.2)`);
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(${color},0.8)`;
            ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(b.name, x, y + 4);
            bubbleData.push({ x, y, radius, data: b });
        });
        let tooltip = cloudCanvas.parentElement.querySelector('.cloud-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'cloud-tooltip';
            cloudCanvas.parentElement.appendChild(tooltip);
        }
        cloudCanvas.onmousemove = (e) => {
            const rect = cloudCanvas.getBoundingClientRect();
            const scaleX = cloudCanvas.width / rect.width;
            const scaleY = cloudCanvas.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;
            let hovered = null;
            for (const b of bubbleData) {
                const dist = Math.sqrt((mx - b.x) ** 2 + (my - b.y) ** 2);
                if (dist <= b.radius) { hovered = b; break; }
            }
            if (hovered) {
                const d = hovered.data;
                const pnl = (d.price - d.buyPrice) * SHARES;
                tooltip.innerHTML = `
                    <strong>${d.name}</strong> (${d.code.toUpperCase()})<br>
                    买入价: ¥${d.buyPrice.toFixed(2)} | 现价: ¥${d.price.toFixed(2)}<br>
                    持仓: ${SHARES}股 | 市值: ¥${d.value.toFixed(2)}<br>
                    盈亏: <span style="color:${pnl>=0?'#ef4444':'#22c55e'}">${pnl>=0?'+':''}¥${pnl.toFixed(2)} (${d.rate>=0?'+':''}${d.rate.toFixed(2)}%)</span>
                `;
                tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
                tooltip.classList.add('show');
            } else {
                tooltip.classList.remove('show');
            }
        };
        cloudCanvas.onmouseleave = () => tooltip.classList.remove('show');
    }

    // ===== Treemap 布局算法 =====
    function layoutTreemap(items, x, y, w, h) {
        if (!items.length) return;
        if (items.length === 1) {
            items[0].rect = { x, y, w, h };
            return;
        }
        const total = items.reduce((s, i) => s + i.value, 0);
        let half = 0, splitIdx = 0;
        for (let i = 0; i < items.length; i++) {
            half += items[i].value;
            if (half >= total / 2) { splitIdx = i + 1; break; }
        }
        if (splitIdx === 0) splitIdx = 1;
        const leftItems = items.slice(0, splitIdx);
        const rightItems = items.slice(splitIdx);
        const leftValue = leftItems.reduce((s, i) => s + i.value, 0);
        const ratio = leftValue / total;

        if (w >= h) {
            const leftW = w * ratio;
            layoutTreemap(leftItems, x, y, leftW, h);
            layoutTreemap(rightItems, x + leftW, y, w - leftW, h);
        } else {
            const topH = h * ratio;
            layoutTreemap(leftItems, x, y, w, topH);
            layoutTreemap(rightItems, x, y + topH, w, h - topH);
        }
    }

    // ===== 热力矩形图 =====
    let heatmapItems = []; // 用于hover检测

    function renderHeatmap() {
        const ctx = cloudCanvas.getContext('2d');
        const W = cloudCanvas.width, H = cloudCanvas.height;
        ctx.clearRect(0, 0, W, H);
        heatmapItems = [];

        if (!favorites.length) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('添加自选股后显示热力矩形图', W / 2, H / 2);
            return;
        }

        // 准备数据
        const items = favorites.map(fav => {
            const quote = quotes[fav.code];
            const price = quote ? quote.price : fav.buyPrice;
            const rate = fav.buyPrice ? ((price - fav.buyPrice) / fav.buyPrice) * 100 : 0;
            const value = Math.max(price * SHARES, 1); // 矩形面积用市值
            return { ...fav, price, rate, value };
        }).sort((a, b) => b.value - a.value);

        const pad = 4;
        layoutTreemap(items, pad, pad, W - pad * 2, H - pad * 2);

        items.forEach(item => {
            const r = item.rect;
            if (!r) return;
            const gap = 2;
            const rx = r.x + gap, ry = r.y + gap;
            const rw = r.w - gap * 2, rh = r.h - gap * 2;

            // 颜色：红涨绿跌
            let color;
            if (item.rate > 0.01) {
                const intensity = Math.min(item.rate / 10, 1);
                color = `rgba(239, 68, 68, ${0.5 + intensity * 0.4})`;
            } else if (item.rate < -0.01) {
                const intensity = Math.min(Math.abs(item.rate) / 10, 1);
                color = `rgba(34, 197, 94, ${0.5 + intensity * 0.4})`;
            } else {
                color = 'rgba(120, 120, 120, 0.5)';
            }

            // 绘制矩形
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(rx, ry, rw, rh, 4);
            ctx.fill();

            // 边框
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 文字（矩形足够大才显示）
            if (rw > 50 && rh > 30) {
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                const cx = rx + rw / 2, cy = ry + rh / 2;

                if (rh > 50) {
                    // 大矩形：显示名称、现价、涨跌幅
                    ctx.font = 'bold 13px sans-serif';
                    ctx.fillText(item.name, cx, cy - 14);
                    ctx.font = '11px sans-serif';
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.fillText(`¥${item.price.toFixed(2)}`, cx, cy + 4);
                    ctx.fillStyle = item.rate >= 0 ? '#fca5a5' : '#86efac';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(`${item.rate >= 0 ? '+' : ''}${item.rate.toFixed(2)}%`, cx, cy + 20);
                } else {
                    // 小矩形：只显示名称
                    ctx.font = 'bold 11px sans-serif';
                    ctx.fillText(item.name, cx, cy + 4);
                }
            }

            heatmapItems.push({ rect: { x: rx, y: ry, w: rw, h: rh }, data: item });
        });

        // hover 提示
        let tooltip = cloudCanvas.parentElement.querySelector('.cloud-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'cloud-tooltip';
            cloudCanvas.parentElement.appendChild(tooltip);
        }

        cloudCanvas.onmousemove = (e) => {
            const rect = cloudCanvas.getBoundingClientRect();
            const scaleX = cloudCanvas.width / rect.width;
            const scaleY = cloudCanvas.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;
            let hovered = null;
            for (const item of heatmapItems) {
                const r = item.rect;
                if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                    hovered = item;
                    break;
                }
            }
            if (hovered) {
                const d = hovered.data;
                const pnl = (d.price - d.buyPrice) * SHARES;
                tooltip.innerHTML = `
                    <strong>${d.name}</strong> (${d.code.toUpperCase()})<br>
                    买入价: ¥${d.buyPrice.toFixed(2)} | 现价: ¥${d.price.toFixed(2)}<br>
                    持仓: ${SHARES}股 | 市值: ¥${d.value.toFixed(2)}<br>
                    盈亏: <span style="color:${pnl>=0?'#ef4444':'#22c55e'}">${pnl>=0?'+':''}¥${pnl.toFixed(2)} (${d.rate>=0?'+':''}${d.rate.toFixed(2)}%)</span>
                `;
                tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
                tooltip.classList.add('show');
            } else {
                tooltip.classList.remove('show');
            }
        };
        cloudCanvas.onmouseleave = () => tooltip.classList.remove('show');
    }

    // ===== 选股策略 =====
    function renderStrategyList() {
        if (!strategyList) return;
        strategyList.innerHTML = '';
        if (!strategies.length) {
            strategyList.innerHTML = '<div class="strategy-empty">暂无选股策略，点击「新建策略」创建</div>';
            return;
        }
        strategies.forEach(strat => {
            const item = document.createElement('div');
            item.className = `strategy-item ${activeStrategyId === strat.id ? 'active' : ''}`;
            item.dataset.id = strat.id;
            const condCount = Object.keys(strat.conditions).length;
            item.innerHTML = `
                <span class="strategy-item-name">${strat.name}</span>
                <div class="strategy-item-actions">
                    <span class="strategy-item-btn" style="cursor:default;color:var(--text-muted)">${condCount}条件</span>
                    <button class="strategy-item-btn delete" data-id="${strat.id}">×</button>
                </div>
            `;
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete')) return;
                applyStrategy(strat.id);
            });
            strategyList.appendChild(item);
        });
        strategyList.querySelectorAll('.strategy-item-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('确定删除该策略？')) {
                    strategies = strategies.filter(s => s.id !== btn.dataset.id);
                    if (activeStrategyId === btn.dataset.id) activeStrategyId = null;
                    saveStrategies();
                    renderStrategyList();
                    if (!activeStrategyId) clearScreenResult();
                }
            });
        });
    }

    function applyStrategy(id) {
        const strat = strategies.find(s => s.id === id);
        if (!strat) return;
        activeStrategyId = id;
        currentStrategyName = strat.name;
        renderStrategyList();
        runScreen(strat.conditions, strat.name);
    }

    // 判断策略是否需要K线数据
    function strategyNeedsKline(conditions) {
        return SCREEN_CONDITIONS.some(c => c.type === 'kline' && conditions[c.key]);
    }

    // 实时条件筛选
    function filterByRealtime(conditions, stockList) {
        const pool = stockList || SCREEN_POOL;
        return pool.filter(stock => {
            // 全市场行情对象直接有字段，腾讯行情从quotes取
            const q = stock.price !== undefined ? stock : quotes[stock.code];
            if (!q) return false;
            for (const key in conditions) {
                const cond = conditions[key];
                const condDef = SCREEN_CONDITIONS.find(c => c.key === key);
                if (!condDef || condDef.type !== 'realtime') continue;
                const val = q[key];
                if (val === undefined || val === null || isNaN(val)) return false;
                if (cond.min !== undefined && val < cond.min) return false;
                if (cond.max !== undefined && val > cond.max) return false;
            }
            return true;
        });
    }

    // K线条件筛选
    async function filterByKline(stocks, conditions) {
        // 批量获取K线
        await Promise.all(stocks.map(s => fetchKline(s.code, 25)));
        return stocks.filter(stock => {
            const kline = klineCache[stock.code];
            if (!kline || !kline.length) return false;
            for (const key in conditions) {
                const cond = conditions[key];
                if (key === 'change3d') {
                    const v = calcPeriodChange(kline, 3);
                    if (v === null) return false;
                    if (cond.min !== undefined && v < cond.min) return false;
                    if (cond.max !== undefined && v > cond.max) return false;
                } else if (key === 'change5d') {
                    const v = calcPeriodChange(kline, 5);
                    if (v === null) return false;
                    if (cond.min !== undefined && v < cond.min) return false;
                    if (cond.max !== undefined && v > cond.max) return false;
                } else if (key === 'change10d') {
                    const v = calcPeriodChange(kline, 10);
                    if (v === null) return false;
                    if (cond.min !== undefined && v < cond.min) return false;
                    if (cond.max !== undefined && v > cond.max) return false;
                } else if (key === 'newHigh5') {
                    if (!isNewHigh(kline, 5)) return false;
                } else if (key === 'newHigh10') {
                    if (!isNewHigh(kline, 10)) return false;
                } else if (key === 'newHigh20') {
                    if (!isNewHigh(kline, 20)) return false;
                } else if (key === 'newLow5') {
                    if (!isNewLow(kline, 5)) return false;
                } else if (key === 'newLow10') {
                    if (!isNewLow(kline, 10)) return false;
                } else if (key === 'newLow20') {
                    if (!isNewLow(kline, 20)) return false;
                }
            }
            return true;
        });
    }

    async function runScreen(conditions, strategyName) {
        if (!screenResult) return;
        strategyName = strategyName || currentStrategyName || '选股策略';
        currentStrategyName = strategyName;

        // 检查全市场数据是否已加载
        const cacheReady = allStocksCache && allStocksCache.length > 0 && Date.now() - allStocksCacheTime < ALL_CACHE_DURATION;
        if (!cacheReady) {
            screenResult.innerHTML = '<div class="screen-empty" style="padding:2rem 1rem">' +
                '<div style="font-size:1.1rem;margin-bottom:0.5rem">⚠️ 全市场数据未加载</div>' +
                '<div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem">请先点击上方「加载全市场数据」按钮，加载完成后再应用选股策略</div>' +
                '</div>';
            return;
        }

        const startTime = Date.now();
        let totalPages = 56; // 预估总页数

        // 进度条HTML
        screenResult.innerHTML = '<div class="screen-loading" style="height:auto;padding:2rem 1rem;gap:0.8rem">' +
            '<div style="font-size:0.95rem;color:var(--text-primary)">正在加载全市场行情并筛选...</div>' +
            '<div class="loading-bar" style="width:280px"><div class="loading-bar-fill" id="screenBar" style="width:0%"></div></div>' +
            '<div id="screenProgress" style="font-size:0.8rem;color:var(--text-muted)">准备中...</div>' +
            '</div>';

        const bar = document.getElementById('screenBar');
        const prog = document.getElementById('screenProgress');

        function updateProgress(cur, total, count) {
            if (cur === 'cached') {
                if (bar) bar.style.width = '90%';
                if (prog) prog.textContent = '使用缓存数据（' + count + ' 只）· 正在筛选...';
                return;
            }
            if (total) totalPages = total;
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const pct = total ? Math.round(cur / total * 100) : Math.round(cur / totalPages * 100);
            let remain = '--';
            if (cur > 2 && total) {
                const perPage = (Date.now() - startTime) / cur / 1000;
                remain = (perPage * (total - cur)).toFixed(0);
            }
            if (bar) bar.style.width = pct + '%';
            if (prog) prog.textContent = '已获取 ' + count + ' 只（' + cur + '/' + (total || totalPages) + '页）· 已用 ' + elapsed + 's' + (remain !== '--' ? ' · 预计剩余 ' + remain + 's' : '');
        }

        // 获取全市场行情
        const allStocks = await fetchAllAStocks(updateProgress);

        // 确保进度条至少可见500ms（缓存秒回时用户能看到）
        const elapsedMs = Date.now() - startTime;
        if (elapsedMs < 500) {
            await new Promise(r => setTimeout(r, 500 - elapsedMs));
        }

        if (!allStocks || !allStocks.length) {
            screenResult.innerHTML = '<div class="screen-empty">全市场行情加载失败，请刷新重试</div>';
            return;
        }

        // 实时条件筛选
        if (bar) bar.style.width = '92%';
        if (prog) prog.textContent = '正在筛选 ' + allStocks.length + ' 只股票...';
        let results = filterByRealtime(conditions, allStocks);

        // K线条件筛选
        if (strategyNeedsKline(conditions) && results.length) {
            if (bar) bar.style.width = '96%';
            if (prog) prog.textContent = '正在获取 ' + results.length + ' 只股票的K线数据...';
            results = await filterByKline(results, conditions);
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        screenResult.innerHTML = '<div class="screen-summary">全市场筛选：<strong>' + results.length + '</strong> 只股票符合条件（共扫描 ' + allStocks.length + ' 只A股，耗时 ' + totalTime + 's）</div>';
        renderScreenResults(results);
    }

    function renderScreenResults(results) {
        strategyResults = results;

        if (!results.length) {
            screenResult.innerHTML += '<div class="screen-empty">没有符合条件的股票，试试调整筛选条件</div>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'screen-table';
        table.innerHTML = '<thead><tr><th>名称</th><th>代码</th><th>现价</th><th>涨跌幅</th><th>PE</th><th>PB</th><th>换手率</th><th>总市值</th><th>操作</th></tr></thead><tbody></tbody>';
        const tbody = table.querySelector('tbody');
        results.forEach(stock => {
            const q = stock.price !== undefined ? stock : quotes[stock.code];
            if (!q) return;
            const dir = q.changeRate >= 0 ? 'up' : 'down';
            const inFav = favorites.some(f => f.code === stock.code);
            const tr = document.createElement('tr');
            tr.innerHTML = '<td><strong>' + q.name + '</strong></td>' +
                '<td>' + stock.code.toUpperCase() + '</td>' +
                '<td>¥' + q.price.toFixed(2) + '</td>' +
                '<td class="pnl-' + dir + '">' + (dir==='up'?'+':'') + q.changeRate.toFixed(2) + '%</td>' +
                '<td>' + (q.pe ? q.pe.toFixed(1) : '--') + '</td>' +
                '<td>' + (q.pb ? q.pb.toFixed(2) : '--') + '</td>' +
                '<td>' + q.turnover.toFixed(2) + '%</td>' +
                '<td>' + q.totalCap.toFixed(0) + '亿</td>' +
                '<td><button class="hot-add-btn ' + (inFav?'added':'') + '" data-code="' + stock.code + '" data-name="' + q.name + '">' + (inFav?'✓ 已加':'+ 自选') + '</button></td>';
            tbody.appendChild(tr);
        });
        screenResult.appendChild(table);
        screenResult.querySelectorAll('.hot-add-btn:not(.added)').forEach(btn => {
            btn.addEventListener('click', () => addToFavorites(btn.dataset.code, btn.dataset.name));
        });
    }

    function clearScreenResult() {
        if (screenResult) screenResult.innerHTML = '<div class="screen-placeholder">选择或创建选股策略后，在此显示筛选结果</div>';
    }

    // 策略弹窗 - 渲染下拉条件
    function openStrategyModal() {
        if (!strategyModal) return;
        strategyNameInput.value = '';
        conditionContainer.innerHTML = '';
        SCREEN_CONDITIONS.forEach(cond => {
            const row = document.createElement('div');
            row.className = 'condition-row';
            let optionsHtml = cond.options.map(opt => {
                const encoded = opt.value === '' ? '' : encodeURIComponent(JSON.stringify({min:opt.min, max:opt.max, value:opt.value}));
                return `<option value="${encoded}">${opt.label}</option>`;
            }).join('');
            row.innerHTML = `
                <label class="condition-label">${cond.label}</label>
                <select class="condition-select" data-key="${cond.key}" data-type="${cond.type}">
                    ${optionsHtml}
                </select>
            `;
            conditionContainer.appendChild(row);
        });
        strategyModal.classList.add('show');
    }

    function closeStrategyModal() {
        if (strategyModal) strategyModal.classList.remove('show');
    }

    function saveStrategy() {
        const name = strategyNameInput.value.trim();
        if (!name) { alert('请输入策略名称'); return; }
        const conditions = {};
        conditionContainer.querySelectorAll('.condition-select').forEach(sel => {
            const val = sel.value;
            if (val !== '') {
                const parsed = JSON.parse(decodeURIComponent(val));
                conditions[sel.dataset.key] = {
                    min: parsed.min,
                    max: parsed.max,
                    value: parsed.value
                };
            }
        });
        if (!Object.keys(conditions).length) { alert('请至少选择一个筛选条件'); return; }
        strategies.push({
            id: 'strat_' + Date.now(),
            name,
            conditions,
            createdAt: new Date().toISOString()
        });
        saveStrategies();
        renderStrategyList();
        closeStrategyModal();
    }

    // ===== 刷新行情 =====
    async function refreshAll() {
        if (isRefreshing) return;
        isRefreshing = true;
        if (refreshBtn) refreshBtn.classList.add('loading');
        const allCodes = new Set();
        HOT_STOCKS.forEach(s => allCodes.add(s.code));
        SCREEN_POOL.forEach(s => allCodes.add(s.code));
        favorites.forEach(f => allCodes.add(f.code));
        const stockList = Array.from(allCodes).map(code => ({ code }));
        try {
            const [newQuotes, newMarket] = await Promise.all([
                fetchQuotes(stockList),
                fetchQuotes(MARKET_INDICES)
            ]);
            quotes = { ...quotes, ...newQuotes };
            marketQuotes = { ...marketQuotes, ...newMarket };
            // 清除K线缓存，让下次选股重新获取
            klineCache = {};
            renderAll();
            if (activeStrategyId) {
                const strat = strategies.find(s => s.id === activeStrategyId);
                if (strat) runScreen(strat.conditions, strat.name);
            }
        } catch (err) {
            console.warn('行情刷新失败:', err.message);
        } finally {
            isRefreshing = false;
            if (refreshBtn) refreshBtn.classList.remove('loading');
        }
    }

    function renderAll() {
        renderMarketBar();
        // 热门榜统一用renderStockCards样式（含换手/PE），currentView为hot时才渲染
        if (currentView === 'hot') {
            const list = hotStocks.length ? hotStocks : HOT_STOCKS;
            renderStockCards(list);
        }
        else if (currentView === 'strategy' && strategyResults.length) renderStockCards(strategyResults);
        renderFavorites();
        renderCloud();
        updateOverview();
    }

    // ===== 导出/导入 =====
    function exportData() {
        const data = { exportTime: new Date().toISOString(), favorites, strategies };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock_data_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.favorites && Array.isArray(data.favorites)) {
                    if (confirm(`导入 ${data.favorites.length} 只自选股${data.strategies ? '、' + data.strategies.length + '个策略' : ''}？将覆盖当前数据。`)) {
                        favorites = data.favorites;
                        if (data.strategies) strategies = data.strategies;
                        saveFavorites();
                        saveStrategies();
                        renderStrategyList();
                        refreshAll();
                    }
                } else { alert('文件格式不正确'); }
            } catch (err) { alert('导入失败：' + err.message); }
        };
        reader.readAsText(file);
    }

    // ===== 事件绑定 =====
    if (refreshBtn) refreshBtn.addEventListener('click', refreshAll);
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (importBtn) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', (e) => {
        if (e.target.files[0]) importData(e.target.files[0]);
        importFile.value = '';
    });
    if (createStrategyBtn) createStrategyBtn.addEventListener('click', openStrategyModal);
    if (loadAllBtn) loadAllBtn.addEventListener('click', loadAllMarketData);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeStrategyModal);
    if (saveStrategyBtn) saveStrategyBtn.addEventListener('click', saveStrategy);
    if (strategyModal) {
        strategyModal.addEventListener('click', (e) => {
            if (e.target === strategyModal) closeStrategyModal();
        });
    }

    // 视图切换（气泡图 / 热力图）
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            viewMode = btn.dataset.view;
            renderCloud();
        });
    });

    // ===== 初始化 =====
    loadFavorites();
    loadStrategies();
    renderStrategyList();
    clearScreenResult();
    renderAll(); // 先用内置数据渲染
    initSearch();
    initKlineModal();
    refreshAll();

    // 异步加载动态热门榜
    (async function initHotStocks() {
        if (hotSectionTip) hotSectionTip.textContent = '正在加载实时热门榜...';
        await fetchHotStocks('all', 30);
        if (currentView === 'hot') renderAll();
        if (hotSectionTip) {
            const srcInfo = hotStocks.length ? `已加载 ${hotStocks.length} 只热门股 · 来源：东方财富/同花顺/雪球 · ` : '';
            hotSectionTip.textContent = srcInfo + '点击「+自选」加入，默认买入100股';
        }
    })();

    // 每5分钟刷新一次热门榜
    setInterval(() => {
        if (document.hidden) return;
        fetchHotStocks('all', 30).then(() => {
            if (currentView === 'hot') renderAll();
        });
    }, 5 * 60 * 1000);

    // 热门榜来源切换
    document.querySelectorAll('.hot-source-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.hot-source-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            hotSource = btn.dataset.source;
            if (hotSectionTip) hotSectionTip.textContent = '正在加载' + btn.textContent + '热门榜...';
            await fetchHotStocks(hotSource, 30);
            if (currentView === 'hot') renderAll();
            if (hotSectionTip) {
                hotSectionTip.textContent = `来源：${btn.textContent} · 共 ${hotStocks.length} 只 · 点击「+自选」加入，默认买入100股`;
            }
        });
    });

    // 更新加载按钮状态
    function updateLoadAllBtn() {
        if (!loadAllBtn) return;
        if (allStocksCache && allStocksCache.length && Date.now() - allStocksCacheTime < ALL_CACHE_DURATION) {
            loadAllBtn.textContent = '已加载（' + allStocksCache.length + '只），点击刷新';
            loadAllBtn.style.background = 'linear-gradient(135deg,#00cc88,#009966)';
        } else {
            loadAllBtn.textContent = '加载全市场数据';
            loadAllBtn.style.background = 'linear-gradient(135deg,#00d4ff,#0099cc)';
        }
    }

    // 手动加载全市场数据
    let allStocksLoading = false;
    async function loadAllMarketData() {
        if (allStocksLoading) return;
        allStocksLoading = true;
        if (loadAllBtn) {
            loadAllBtn.textContent = '加载中...';
            loadAllBtn.disabled = true;
        }
        // 显示按钮附近的进度条
        if (loadAllProgress) loadAllProgress.style.display = 'block';
        if (loadAllBar) loadAllBar.style.width = '0%';
        if (loadAllText) loadAllText.textContent = '准备中...';
        // 强制刷新缓存
        allStocksCache = null;
        allStocksCacheTime = 0;

        const startTime = Date.now();

        try {
            const all = await fetchAllAStocks((cur, total, count) => {
                if (cur === 'cached') return;
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                const pct = total ? Math.round(cur / total * 100) : 0;
                let remain = '--';
                if (cur > 2 && total) {
                    const perPage = (Date.now() - startTime) / cur / 1000;
                    remain = (perPage * (total - cur)).toFixed(0);
                }
                if (loadAllBar) loadAllBar.style.width = pct + '%';
                if (loadAllText) loadAllText.textContent = '已获取 ' + count + ' 只（' + cur + '/' + total + '页）· 已用 ' + elapsed + 's' + (remain !== '--' ? ' · 预计剩余 ' + remain + 's' : '');
                if (loadAllBtn) loadAllBtn.textContent = '加载中... ' + pct + '%';
            });

            const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
            if (loadAllBar) loadAllBar.style.width = '100%';
            if (loadAllText) loadAllText.textContent = '加载完成：' + all.length + ' 只A股（耗时 ' + totalTime + 's）· 现在可以使用选股策略和全市场搜索';
        } catch (e) {
            console.error('全市场加载失败:', e);
            if (loadAllText) loadAllText.textContent = '加载失败：' + e.message + '，请重试';
        } finally {
            allStocksLoading = false;
            if (loadAllBtn) loadAllBtn.disabled = false;
            updateLoadAllBtn();
            // 3秒后隐藏进度条
            setTimeout(() => {
                if (loadAllProgress && !allStocksLoading) loadAllProgress.style.display = 'none';
            }, 3000);
        }
    }

    // 初始化按钮状态
    updateLoadAllBtn();

    refreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(refreshTimer);
        } else {
            refreshAll();
            refreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
        }
    });

})();
