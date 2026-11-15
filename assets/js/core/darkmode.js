/**
 * darkmode.js - 手动暗黑（在四时主题之上再压一层纯黑）
 * 记忆偏好；与 head 内联脚本共用 lengmeng_dark_mode 键
 */

(function () {
    'use strict';

    var root = document.documentElement;
    var KEY = 'lengmeng_dark_mode';

    function stored() {
        try { return localStorage.getItem(KEY) === 'true'; } catch (e) { return false; }
    }

    function apply(on) {
        root.setAttribute('data-dark', on ? 'true' : 'false');
        var btns = document.querySelectorAll('.dark-btn');
        Array.prototype.forEach.call(btns, function (b) {
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.setAttribute('title', on ? '切换为时间主题' : '切换为纯黑暗色');
        });
    }

    function toggle() {
        var next = root.getAttribute('data-dark') !== 'true';
        apply(next);
        try { localStorage.setItem(KEY, next ? 'true' : 'false'); } catch (e) {}
        document.body.classList.add('theme-transition');
        setTimeout(function () { document.body.classList.remove('theme-transition'); }, 600);
        if (window.lmToast) window.lmToast(next ? '已切换：纯黑暗色' : '已切换：跟随时间');
    }

    apply(stored());

    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.dark-btn');
        if (!btn) return;
        e.preventDefault();
        toggle();
    });

    window.DarkMode = {
        toggle: toggle,
        isEnabled: function () { return root.getAttribute('data-dark') === 'true'; }
    };
})();
