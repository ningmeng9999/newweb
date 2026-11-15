/**
 * theme.js - 四时主题（按本地时间自动切换）
 * 00–06 深空 / 06–12 宣纸 / 12–18 冷白 / 18–24 墨黑
 */

(function () {
    'use strict';

    var root = document.documentElement;
    var LABELS = {
        dawn: '深空 · 凌晨',
        morning: '宣纸 · 上午',
        afternoon: '冷白 · 下午',
        night: '墨黑 · 夜晚'
    };
    var SHORT = {
        dawn: '深空',
        morning: '宣纸',
        afternoon: '冷白',
        night: '墨黑'
    };

    function themeOf(hour) {
        if (hour >= 0 && hour < 6) return 'dawn';
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'night';
    }

    function syncLabels(theme) {
        var full = document.querySelectorAll('[data-theme-label]');
        Array.prototype.forEach.call(full, function (el) {
            el.textContent = LABELS[theme] || theme;
        });
        var shortEl = document.getElementById('themeLabel');
        if (shortEl) shortEl.textContent = SHORT[theme] || theme;

        var dot = document.querySelector('[data-theme-dot]');
        if (dot) dot.setAttribute('data-theme', theme);
    }

    function apply(theme, animate) {
        if (root.getAttribute('data-theme') === theme) {
            syncLabels(theme);
            return;
        }
        if (animate) {
            document.body.classList.add('theme-transition');
            setTimeout(function () {
                document.body.classList.remove('theme-transition');
            }, 600);
        }
        root.setAttribute('data-theme', theme);
        syncLabels(theme);
        try { localStorage.setItem('lm_theme', theme); } catch (e) {}
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
    }

    function init() {
        apply(themeOf(new Date().getHours()), false);
        // 每分钟校正一次，跨过整点自动换肤
        setInterval(function () {
            apply(themeOf(new Date().getHours()), true);
        }, 60000);
    }

    init();

    window.ThemeManager = {
        getThemeByHour: themeOf,
        applyTheme: apply,
        getCurrent: function () { return root.getAttribute('data-theme'); }
    };
})();
