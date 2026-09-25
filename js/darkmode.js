/**
 * darkmode.js - 暗黑模式切换
 * 独立于四时主题的强制暗黑覆盖
 * 记忆用户偏好，localStorage 持久化
 */

(function () {
    'use strict';

    const darkBtn = document.getElementById('darkBtn');
    const html = document.documentElement;
    const STORAGE_KEY = 'lengmeng_dark_mode';

    /**
     * 获取保存的暗黑模式状态
     */
    function getDarkMode() {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch (e) {
            return false;
        }
    }

    /**
     * 保存暗黑模式状态
     */
    function setDarkMode(enabled) {
        try {
            localStorage.setItem(STORAGE_KEY, enabled.toString());
        } catch (e) {}
    }

    /**
     * 应用暗黑模式
     */
    function applyDarkMode(enabled) {
        if (enabled) {
            html.setAttribute('data-dark', 'true');
        } else {
            html.setAttribute('data-dark', 'false');
        }
    }

    /**
     * 切换暗黑模式
     */
    function toggleDarkMode() {
        const current = html.getAttribute('data-dark') === 'true';
        const next = !current;
        applyDarkMode(next);
        setDarkMode(next);

        // 过渡动画
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 800);
    }

    // 初始化：读取保存的状态
    const savedDark = getDarkMode();
    applyDarkMode(savedDark);

    // 绑定按钮
    if (darkBtn) {
        darkBtn.addEventListener('click', toggleDarkMode);
    }

    // 暴露控制
    window.DarkMode = {
        toggle: toggleDarkMode,
        isEnabled: () => html.getAttribute('data-dark') === 'true'
    };
})();
