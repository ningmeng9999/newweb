/**
 * theme.js - 四时动态换肤核心逻辑
 * 根据本地时间自动切换主题：凌晨/上午/下午/夜晚
 * 支持实时监听，到达节点自动切换，带无缝过渡动画
 */

(function () {
    'use strict';

    const html = document.documentElement;
    const THEME_LABELS = {
        dawn: '深空模式',
        morning: '晨光模式',
        afternoon: '白昼模式',
        night: '夜间模式'
    };

    /**
     * 根据小时数判断当前主题
     * 00:00-06:00 凌晨 dawn
     * 06:00-12:00 上午 morning
     * 12:00-18:00 下午 afternoon
     * 18:00-24:00 夜晚 night
     */
    function getThemeByHour(hour) {
        if (hour >= 0 && hour < 6) return 'dawn';
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'night';
    }

    /**
     * 应用主题
     */
    function applyTheme(theme, withTransition) {
        const current = html.getAttribute('data-theme');
        if (current === theme) return;

        if (withTransition) {
            document.body.classList.add('theme-transition');
            setTimeout(() => {
                document.body.classList.remove('theme-transition');
            }, 800);
        }

        html.setAttribute('data-theme', theme);

        // 更新主题标签（如果页面有该元素）
        const labelEl = document.getElementById('themeLabel');
        if (labelEl) {
            labelEl.textContent = THEME_LABELS[theme] || theme;
        }

        // 存储当前主题（供调试/同步）
        try {
            localStorage.setItem('currentTheme', theme);
        } catch (e) {}
    }

    /**
     * 初始化主题
     */
    function initTheme() {
        const now = new Date();
        const theme = getThemeByHour(now.getHours());
        applyTheme(theme, false);
    }

    /**
     * 定时检查主题切换
     * 每分钟检查一次，精确到小时节点
     */
    function startThemeWatcher() {
        setInterval(() => {
            const now = new Date();
            const theme = getThemeByHour(now.getHours());
            const current = html.getAttribute('data-theme');
            if (current !== theme) {
                applyTheme(theme, true);
            }
        }, 60000);
    }

    // 立即初始化
    initTheme();
    startThemeWatcher();

    // 暴露到全局，方便调试
    window.ThemeManager = {
        getThemeByHour: getThemeByHour,
        applyTheme: applyTheme,
        getCurrent: () => html.getAttribute('data-theme')
    };
})();
