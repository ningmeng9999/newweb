/**
 * visitor.js - 访客统计
 * 前端轻量化统计，基于 localStorage 本地持久化
 * 展示累计访问次数
 */

(function () {
    'use strict';

    const visitEl = document.getElementById('visitNum');
    const STORAGE_KEY = 'lengmeng_visit_count';

    /**
     * 获取访问次数
     */
    function getVisitCount() {
        try {
            const count = localStorage.getItem(STORAGE_KEY);
            return count ? parseInt(count, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * 增加并保存访问次数
     */
    function incrementVisit() {
        let count = getVisitCount();
        count++;
        try {
            localStorage.setItem(STORAGE_KEY, count.toString());
        } catch (e) {}
        return count;
    }

    /**
     * 数字动画展示
     */
    function animateCount(target) {
        if (!visitEl) return;

        const duration = 1200;
        const startTime = performance.now();
        const startValue = 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutQuart
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(startValue + (target - startValue) * eased);
            visitEl.textContent = `访问 ${current} 次`;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // 初始化
    const count = incrementVisit();
    animateCount(count);
})();
