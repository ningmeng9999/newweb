/**
 * visitor.js - 访客计数
 * 线上走 /api/visitor（KV 计数），未配置或本地开发时回退 localStorage
 */

(function () {
    'use strict';

    var el = document.getElementById('visitNum');
    if (!el) return;

    var COUNT_KEY = 'lm_visit_count';
    var SESSION_KEY = 'lm_visit_session';

    function localGet() {
        try { return parseInt(localStorage.getItem(COUNT_KEY), 10) || 0; } catch (e) { return 0; }
    }
    function localSet(n) {
        try { localStorage.setItem(COUNT_KEY, String(n)); } catch (e) {}
    }

    function render(n) {
        el.textContent = '访问 ' + Number(n).toLocaleString('en-US');
    }

    function animateTo(target) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            render(target);
            return;
        }
        var start = performance.now();
        var from = 0;
        var dur = 1000;
        function tick(now) {
            var p = Math.min((now - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            render(Math.round(from + (target - from) * eased));
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function finish(count) {
        animateTo(Math.max(count, 1));
    }

    var isLocalDev = location.protocol === 'file:' ||
        /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

    function fallback() {
        var seen = false;
        try { seen = !!sessionStorage.getItem(SESSION_KEY); } catch (e) {}
        var n = localGet();
        if (!seen) {
            n += 1;
            localSet(n);
            try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
        }
        finish(n);
    }

    if (isLocalDev) {
        fallback();
        return;
    }

    var seenBefore = false;
    try { seenBefore = !!sessionStorage.getItem(SESSION_KEY); } catch (e) {}

    fetch('/api/visitor', {
        method: seenBefore ? 'GET' : 'POST',
        cache: 'no-store'
    })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function (data) {
            if (data && data.ok && typeof data.count === 'number') {
                try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
                finish(data.count);
            } else {
                fallback();
            }
        })
        .catch(fallback);
})();
