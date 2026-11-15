/**
 * main.js - 全局初始化
 * 加载层 / 实时时钟 / 控制台签名 / 页面进入动效
 */

(function () {
    'use strict';

    /* ============================================================
       加载层
       ============================================================ */
    function initLoading() {
        var box = document.getElementById('loadingBox');
        if (!box) return;

        function hide(delay) {
            setTimeout(function () {
                box.classList.add('hide');
                setTimeout(function () {
                    if (box.parentNode) box.parentNode.removeChild(box);
                }, 700);
            }, delay || 0);
        }

        // 本次会话已看过，直接跳过
        var seen = false;
        try { seen = sessionStorage.getItem('lm_seen') === '1'; } catch (e) {}

        if (seen) {
            if (box.parentNode) box.parentNode.removeChild(box);
            return;
        }
        try { sessionStorage.setItem('lm_seen', '1'); } catch (e) {}

        // DOM 一就绪就撤，不等图片 / iframe（音乐页内嵌播放器、菜谱页 iframe 会把 load 拖到好几秒后）
        function dismiss() { hide(120); }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', dismiss, { once: true });
        } else {
            dismiss();
        }
        // 兜底：无论如何不超过 900ms
        setTimeout(function () { hide(0); }, 900);
    }

    /* ============================================================
       实时时钟
       ============================================================ */
    function initClock() {
        var timeEl = document.getElementById('currentTime');
        var dateEl = document.getElementById('currentDate');
        if (!timeEl && !dateEl) return;

        var WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

        function pad(n) { return n < 10 ? '0' + n : String(n); }

        function update() {
            var now = new Date();
            if (timeEl) {
                timeEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
            }
            if (dateEl) {
                dateEl.textContent = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + WEEK[now.getDay()];
            }
        }

        update();
        setInterval(update, 1000);
    }

    /* ============================================================
       年份
       ============================================================ */
    function initYear() {
        var els = document.querySelectorAll('[data-year]');
        var y = new Date().getFullYear();
        Array.prototype.forEach.call(els, function (el) { el.textContent = y; });
    }

    /* ============================================================
       控制台签名
       ============================================================ */
    function initConsole() {
        try {
            console.log(
                '%c LengMeng %c Personal Site ',
                'background:#edeff2;color:#08090b;padding:3px 7px;border-radius:3px 0 0 3px;font-weight:600;letter-spacing:.06em;',
                'background:#1a1d22;color:#c9cfd8;padding:3px 7px;border-radius:0 3px 3px 0;letter-spacing:.06em;'
            );
            console.log('%clengmeng.online', 'color:#74b3a8;font-size:13px;letter-spacing:.08em;');
        } catch (e) {}
    }

    /* ============================================================
       进入动效
       ============================================================ */
    function initEnter() {
        if (document.documentElement.classList.contains('page-enter')) return;
        document.documentElement.classList.add('page-enter');
        setTimeout(function () {
            document.documentElement.classList.remove('page-enter');
        }, 600);
    }

    function boot() {
        initLoading();
        initClock();
        initYear();
        initConsole();
        initEnter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
