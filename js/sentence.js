/**
 * sentence.js - 动态语录
 * 首页随机展示科技风文案，定时切换，带淡入淡出效果
 */
(function () {
    'use strict';

    const sentenceEl = document.getElementById('sentenceText');
    if (!sentenceEl) return;

    const SENTENCES = [
        '以数据为炬，赴跨境山海',
        '循光而行，逐梦不止',
        '深耕跨境，静待花开',
        '保持热爱，奔赴下一场山海',
        '数据驱动决策，运营创造价值',
        '迭代自我，无限可能',
        '在数据与市场之间，寻找增长密码',
        '星光不问赶路人，时光不负有心人',
        '每一次选品，都是一次商业洞察',
        '简洁是智慧的灵魂',
        '不积跬步，无以至千里',
        'Stay hungry, stay foolish',
        '用数据说话，用结果证明',
        '跨境无界，运营有道',
        '代码改变世界，热爱成就未来',
        '行而不辍，未来可期',
        '日拱一卒，功不唐捐'
    ];

    let currentIndex = -1;

    function getRandomSentence() {
        let index;
        do {
            index = Math.floor(Math.random() * SENTENCES.length);
        } while (index === currentIndex && SENTENCES.length > 1);
        currentIndex = index;
        return SENTENCES[index];
    }

    function showSentence(animate) {
        const text = getRandomSentence();
        if (animate === false) {
            // 首次直接显示，不做动画
            sentenceEl.textContent = text;
            sentenceEl.style.opacity = '1';
            sentenceEl.style.transform = 'translateY(0)';
            return;
        }
        // 切换时淡出再淡入
        sentenceEl.style.opacity = '0';
        sentenceEl.style.transform = 'translateY(8px)';
        setTimeout(() => {
            sentenceEl.textContent = text;
            sentenceEl.style.opacity = '1';
            sentenceEl.style.transform = 'translateY(0)';
        }, 400);
    }

    // 初始化过渡样式
    sentenceEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

    // 立即显示第一条（无动画，避免"加载看运气"）
    showSentence(false);

    // 页面加载完成后开始定时切换
    if (document.readyState === 'complete') {
        setTimeout(() => setInterval(showSentence, 20000), 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(() => setInterval(showSentence, 20000), 1000);
        });
    }
})();
