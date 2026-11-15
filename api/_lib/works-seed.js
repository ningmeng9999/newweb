// api/_lib/works-seed.js
// 项目作品的兜底数据：KV 未配置或为空时使用。
// 新增项目建议走页面上的「+ 添加项目」，数据会写进 KV，不必改这里。

module.exports = [
    { id: 1, title: '亚太地区数学建模竞赛', category: 'data', date: '2024.09', role: '队长', desc: '使用Python Pandas完成80万+条数据集清洗，搭建随机森林预测模型，运用Matplotlib完成多维度数据可视化，输出18页专业分析报告。获国家级三等奖。', tags: ['Python', 'Pandas', '随机森林', 'Matplotlib'], image: './assets/img/page1.jpg', link: '' },
    { id: 2, title: '商务大数据分析竞赛', category: 'data', date: '2024.09-2025.02', role: '项目负责人', desc: '基于Python爬虫+影刀RPA自动化抓取TikTok商品评论、销量、用户画像数据；对海外用户评论做情感正负向分析，用Tableau搭建动态商业看板。获国家级三等奖。', tags: ['Python', '影刀RPA', 'Tableau', '情感分析'], image: './assets/img/page2.jpg', link: '' },
    { id: 3, title: '四时动态个人网站', category: 'web', date: '2026', role: '独立开发', desc: '纯前端个人主页，按时间自动切换四套主题色温，粒子光影动画，侧边栏导航，嵌入菜谱工具与股票行情分析，部署于Vercel。', tags: ['HTML5', 'CSS3', 'JavaScript', 'Vercel'], image: './assets/img/page3.jpg', link: 'index.html' },
    { id: 4, title: 'A股行情分析与选股工具', category: 'web', date: '2026', role: '独立开发', desc: '基于公开行情接口的A股实时行情工具，含大盘指数微走势图、多指标选股策略、自选池盈亏追踪、气泡云图与热力矩形图双视图。', tags: ['JavaScript', 'Canvas', 'K线分析'], image: './assets/img/page4.jpg', link: 'stock.html' },
    { id: 5, title: '亚马逊精品店铺运营', category: 'ecom', date: '2026.04-2026.08', role: '运营助理', desc: '负责亚马逊欧美多站点精品店铺运营，搭建SP广告投放结构，独立孵化3款垂直类目新品，核心链接点击率提升11.5%，店铺月度GMV环比提升13%。', tags: ['亚马逊', 'SP广告', 'Listing优化', '领星ERP'], image: './assets/img/page5.jpg', link: '' },
    { id: 6, title: '亚马逊新品孵化项目', category: 'ecom', date: '2025.11-2026.03', role: '运营助理', desc: '使用Python实现竞品数据自动化采集，按月输出竞品分析与市场机会报告，策划Coupon、限时促销、联盟推广方案，成功孵化2款潜力新品。', tags: ['Python', '竞品分析', '亚马逊', '短视频'], image: './assets/img/page6.jpg', link: '' },
];
