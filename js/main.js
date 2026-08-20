/**
 * main.js - 全局初始化与统一逻辑
 * 包含：加载动画、实时时钟、页面统一初始化
 * 所有其他模块已在各自文件中自执行，这里做最后的统一收尾
 */

(function () {
    'use strict';

    /* ========================================
       加载动画
       ======================================== */
    function initLoading() {
        const loadingBox = document.getElementById('loadingBox');
        if (!loadingBox) return;

        // 页面资源加载完成后隐藏
        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingBox.classList.add('hide');
                // 动画结束后移除DOM，释放资源
                setTimeout(() => {
                    if (loadingBox.parentNode) {
                        loadingBox.parentNode.removeChild(loadingBox);
                    }
                }, 800);
            }, 600);
        });

        // 兜底：如果load事件超过3秒还没触发，强制隐藏
        setTimeout(() => {
            if (loadingBox && !loadingBox.classList.contains('hide')) {
                loadingBox.classList.add('hide');
            }
        }, 3000);
    }

    /* ========================================
       实时时钟
       ======================================== */
    function initClock() {
        const timeEl = document.getElementById('currentTime');
        if (!timeEl) return;

        function pad(n) {
            return n < 10 ? '0' + n : n;
        }

        function update() {
            const now = new Date();
            const h = pad(now.getHours());
            const m = pad(now.getMinutes());
            const s = pad(now.getSeconds());
            timeEl.textContent = `${h}:${m}:${s}`;
        }

        update();
        setInterval(update, 1000);
    }

    /* ========================================
       控制台欢迎信息
       ======================================== */
    function initConsoleBanner() {
        console.log(
            '%c LengMeng %c Personal Website ',
            'background: linear-gradient(135deg, #00d4ff, #7b2cbf); color: #fff; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;',
            'background: #333; color: #fff; padding: 4px 8px; border-radius: 0 4px 4px 0;'
        );
        console.log('%c欢迎访问 lengmeng.online', 'color: #00d4ff; font-size: 14px;');
    }

    /* ========================================
       页面可见性变化时暂停/恢复动画（性能优化）
       ======================================== */
    function initVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面不可见时可以暂停一些重计算
                document.body.style.animationPlayState = 'paused';
            } else {
                document.body.style.animationPlayState = 'running';
            }
        });
    }

    // 初始化
    initLoading();
    initClock();
    initConsoleBanner();
    initVisibility();

    // 全局就绪事件
    window.addEventListener('load', () => {
        document.body.classList.add('page-ready');
    });
})();
