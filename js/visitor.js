/**
 * visitor.js - 真实全站访客统计
 * 优先Vercel KV云端计数，未配置/失败时回退localStorage本地计数
 */
(function () {
    'use strict';

    const visitEl = document.getElementById('visitNum');
    const STORAGE_KEY = 'lengmeng_visit_count';
    const SESSION_KEY = 'lengmeng_visit_session';

    function getLocalCount() {
        try { return parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0; }
        catch (e) { return 0; }
    }
    function setLocalCount(n) {
        try { localStorage.setItem(STORAGE_KEY, n.toString()); } catch (e) {}
    }

    function animateCount(target) {
        if (!visitEl) return;
        const duration = 1200;
        const startTime = performance.now();
        function update(now) {
            const p = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            visitEl.textContent = '访问 ' + Math.floor(target * eased).toLocaleString() + ' 次';
            if (p < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    async function init() {
        const isLocal = location.protocol === 'file:' || location.hostname === 'localhost';
        let count = 0;
        let useCloud = false;

        if (!isLocal) {
            try {
                // 每会话只自增一次，避免刷新刷量
                const visited = sessionStorage.getItem(SESSION_KEY);
                const method = visited ? 'GET' : 'POST';
                const res = await fetch('./api/visitor', {
                    method: method,
                    cache: 'no-store'
                });
                const data = await res.json();
                if (data.ok && typeof data.count === 'number') {
                    count = data.count;
                    useCloud = true;
                    sessionStorage.setItem(SESSION_KEY, '1');
                }
            } catch (e) {
                console.warn('云端计数失败，回退本地:', e.message);
            }
        }

        if (!useCloud) {
            // 本地回退：每会话自增一次
            const visited = sessionStorage.getItem(SESSION_KEY);
            count = getLocalCount();
            if (!visited) {
                count++;
                setLocalCount(count);
                sessionStorage.setItem(SESSION_KEY, '1');
            }
        }

        animateCount(Math.max(count, 1));
    }

    if (visitEl) init();
})();
