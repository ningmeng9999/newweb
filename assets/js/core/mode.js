/**
 * mode.js - 主题模式（三态循环：跟随时间 → 纯黑 → 亮色）
 * 记忆偏好；与 head 内联脚本共用 lm_mode 键
 */

(function () {
    'use strict';

    var root = document.documentElement;
    var KEY = 'lm_mode';
    var MODES = ['auto', 'dark', 'light'];
    var LABEL = { auto: '跟随时间', dark: '纯黑', light: '亮色' };

    function current() {
        var m;
        try { m = localStorage.getItem(KEY); } catch (e) {}
        return MODES.indexOf(m) > -1 ? m : 'auto';
    }

    function refreshLabels() {
        if (window.ThemeManager) {
            window.ThemeManager.applyTheme(window.ThemeManager.getCurrent());
        }
    }

    function apply(mode, animate) {
        if (animate) {
            document.body.classList.add('theme-transition');
            setTimeout(function () { document.body.classList.remove('theme-transition'); }, 600);
        }
        root.setAttribute('data-mode', mode);
        root.setAttribute('data-dark', mode === 'dark' ? 'true' : 'false');

        var btns = document.querySelectorAll('.dark-btn');
        Array.prototype.forEach.call(btns, function (b) {
            b.setAttribute('aria-pressed', mode === 'auto' ? 'false' : 'true');
            b.setAttribute('title', '当前：' + LABEL[mode] + '（点击切换）');
            b.setAttribute('aria-label', '切换主题，当前' + LABEL[mode]);
        });

        refreshLabels();
        document.dispatchEvent(new CustomEvent('modechange', { detail: { mode: mode } }));
    }

    function cycle() {
        var next = MODES[(MODES.indexOf(current()) + 1) % MODES.length];
        try { localStorage.setItem(KEY, next); } catch (e) {}
        apply(next, true);
        if (window.lmToast) window.lmToast('主题：' + LABEL[next]);
    }

    apply(current(), false);

    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.dark-btn');
        if (!btn) return;
        e.preventDefault();
        cycle();
    });

    window.ModeManager = {
        cycle: cycle,
        get: current,
        set: function (m) { if (MODES.indexOf(m) > -1) { try { localStorage.setItem(KEY, m); } catch (e) {} apply(m, true); } },
        isLight: function () { return current() === 'light'; }
    };
})();
