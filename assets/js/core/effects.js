/**
 * animate.js - 全站交互与动效
 * 粒子尘埃 / 光标光斑 / 滚动进度 / 3D 倾斜 / 磁性按钮 /
 * 滚动入场 / 导航状态 / 相册灯箱 / 页面过渡 / Toast
 */

(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

    /* ============================================================
       0. Toast
       ============================================================ */
    var toastStack = null;
    function toast(message, duration) {
        if (!message) return;
        if (!toastStack) {
            toastStack = document.createElement('div');
            toastStack.className = 'toast-stack';
            document.body.appendChild(toastStack);
        }
        var el = document.createElement('div');
        el.className = 'toast';
        el.textContent = message;
        toastStack.appendChild(el);
        var ttl = duration || 2600;
        setTimeout(function () {
            el.classList.add('out');
            setTimeout(function () {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 380);
        }, ttl);
    }
    window.lmToast = toast;

    /* ============================================================
       1. 粒子：极淡的尘埃，只做氛围
       ============================================================ */
    function initParticles() {
        var canvas = $('#particleCanvas');
        if (!canvas || reduceMotion) return;

        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = 0, h = 0;
        var particles = [];
        var running = true;
        var mouse = { x: -999, y: -999 };
        var color = '255,255,255';

        function readColor() {
            var v = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
            var hex = v.replace('#', '');
            if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            if (!/^[0-9a-f]{6}$/i.test(hex)) { color = '255,255,255'; return; }
            color = parseInt(hex.slice(0, 2), 16) + ',' +
                parseInt(hex.slice(2, 4), 16) + ',' +
                parseInt(hex.slice(4, 6), 16);
        }

        function resize() {
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            build();
        }

        function build() {
            var count = Math.min(64, Math.round((w * h) / 34000));
            particles = [];
            for (var i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.12,
                    vy: (Math.random() - 0.5) * 0.12,
                    r: Math.random() * 0.9 + 0.35,
                    a: Math.random() * 0.32 + 0.08
                });
            }
        }

        var last = performance.now();
        function frame(now) {
            if (!running) return;
            var dt = Math.min(now - last, 40);
            last = now;
            ctx.clearRect(0, 0, w, h);

            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx * dt * 0.06;
                p.y += p.vy * dt * 0.06;

                // 靠近光标的尘埃被轻轻推开
                var dx = p.x - mouse.x;
                var dy = p.y - mouse.y;
                var d2 = dx * dx + dy * dy;
                if (d2 < 14400 && d2 > 0.01) {
                    var d = Math.sqrt(d2);
                    var f = (120 - d) / 120;
                    p.x += (dx / d) * f * 0.9;
                    p.y += (dy / d) * f * 0.9;
                }

                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                if (p.y > h + 10) p.y = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + color + ',' + p.a + ')';
                ctx.fill();
            }
            requestAnimationFrame(frame);
        }

        resize();
        readColor();
        requestAnimationFrame(frame);

        window.addEventListener('resize', debounce(resize, 200));
        window.addEventListener('mousemove', function (e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }, { passive: true });
        window.addEventListener('mouseout', function () {
            mouse.x = -999; mouse.y = -999;
        });

        document.addEventListener('visibilitychange', function () {
            running = !document.hidden;
            if (running) {
                last = performance.now();
                requestAnimationFrame(frame);
            }
        });

        // 主题切换后重新取样颜色
        new MutationObserver(readColor).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'data-dark']
        });
    }

    /* ============================================================
       2. 光标光斑
       ============================================================ */
    function initCursorGlow() {
        if (!finePointer || reduceMotion) return;
        var el = document.createElement('div');
        el.className = 'cursor-glow';
        document.body.appendChild(el);

        var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
        var cx = tx, cy = ty, raf = null;

        function loop() {
            cx += (tx - cx) * 0.12;
            cy += (ty - cy) * 0.12;
            el.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
            if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) {
                raf = requestAnimationFrame(loop);
            } else {
                raf = null;
            }
        }

        window.addEventListener('mousemove', function (e) {
            tx = e.clientX; ty = e.clientY;
            if (!el.classList.contains('on')) el.classList.add('on');
            if (!raf) raf = requestAnimationFrame(loop);
        }, { passive: true });

        document.addEventListener('mouseleave', function () { el.classList.remove('on'); });
    }

    /* ============================================================
       3. 滚动进度 + 回顶部
       ============================================================ */
    function initScrollUI() {
        var bar = document.createElement('div');
        bar.className = 'scroll-progress';
        document.body.appendChild(bar);

        var top = document.createElement('button');
        top.className = 'back-top';
        top.type = 'button';
        top.setAttribute('aria-label', '回到顶部');
        top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
        document.body.appendChild(top);

        var ticking = false;
        function update() {
            var doc = document.documentElement;
            var max = doc.scrollHeight - window.innerHeight;
            var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
            bar.style.transform = 'scaleX(' + p + ')';
            top.classList.toggle('show', window.scrollY > 420);
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });

        top.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });

        update();
    }

    /* ============================================================
       4. 滚动入场
       ============================================================ */
    function initReveal() {
        var items = $$('.animate-on-scroll');
        if (!items.length) return;

        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('visible'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                var idx = parseInt(el.style.getPropertyValue('--i'), 10);
                if (isNaN(idx)) idx = items.indexOf(el) % 6;
                el.style.setProperty('--reveal-delay', Math.min(idx * 0.06, 0.36) + 's');
                el.classList.add('visible');
                io.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        items.forEach(function (el) { io.observe(el); });
    }

    /* ============================================================
       5. 侧边栏 + 子菜单
       ============================================================ */
    function initSidebar() {
        var sidebar = $('#sidebar');
        var toggle = $('#sidebarToggle');
        var mask = $('#sidebarMask');
        if (!sidebar) return;

        function open() {
            sidebar.classList.add('open');
            if (mask) mask.classList.add('show');
            document.body.classList.add('nav-open');
            if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
        function close() {
            sidebar.classList.remove('open');
            if (mask) mask.classList.remove('show');
            document.body.classList.remove('nav-open');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }

        if (toggle) {
            toggle.addEventListener('click', function () {
                sidebar.classList.contains('open') ? close() : open();
            });
        }
        if (mask) mask.addEventListener('click', close);

        // 移动端点击普通链接后收起
        $$('.sidebar-nav a', sidebar).forEach(function (a) {
            a.addEventListener('click', function () {
                if (window.innerWidth <= 992 && !a.classList.contains('submenu-toggle')) close();
            });
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 992) close();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') close();
        });

        // 二级菜单：手风琴
        $$('.submenu-toggle', sidebar).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var parent = btn.closest('.has-submenu');
                if (!parent) return;
                var willOpen = !parent.classList.contains('open');
                $$('.has-submenu.open', sidebar).forEach(function (item) {
                    if (item !== parent) item.classList.remove('open');
                });
                parent.classList.toggle('open', willOpen);
            });
        });
    }

    /* ============================================================
       6. 当前页导航状态（统一由脚本判定，避免手写 active 出错）
       ============================================================ */
    function initNavState() {
        var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        if (!file) file = 'index.html';

        $$('.sidebar-nav a').forEach(function (a) {
            var href = (a.getAttribute('href') || '').toLowerCase();
            if (!href || href.charAt(0) === '#' || href.indexOf('javascript') === 0) return;
            var target = href.split('/').pop().split('?')[0].split('#')[0];
            var isHome = (file === '' || file === 'index.html') && (target === 'index.html' || target === '');
            if (isHome || target === file) {
                var li = a.closest('li');
                if (li) {
                    li.classList.add('active');
                    var parent = li.closest('.has-submenu');
                    if (parent) parent.classList.add('open');
                }
            }
        });
    }

    /* ============================================================
       7. 卡片 3D 倾斜 + 光斑（事件委托，兼容动态渲染的卡片）
       ============================================================ */
    function initTilt() {
        if (!finePointer || reduceMotion) return;
        var MAX = 3.2;
        var active = null;

        function reset(el) {
            if (!el) return;
            el.classList.remove('is-tilting');
            el.style.transform = '';
            el.style.removeProperty('--mx');
            el.style.removeProperty('--my');
        }

        document.addEventListener('mousemove', function (e) {
            var card = e.target.closest && e.target.closest('.tilt');
            if (active && active !== card) reset(active);
            if (!card) { active = null; return; }
            active = card;

            var r = card.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width;
            var py = (e.clientY - r.top) / r.height;

            card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--my', (py * 100).toFixed(1) + '%');

            if (!card.classList.contains('is-tilting')) card.classList.add('is-tilting');
            card.style.transform =
                'perspective(900px) rotateX(' + ((0.5 - py) * MAX * 2).toFixed(2) + 'deg) ' +
                'rotateY(' + ((px - 0.5) * MAX * 2).toFixed(2) + 'deg) ' +
                'translateY(-3px)';
        }, { passive: true });

        document.addEventListener('mouseleave', function () { reset(active); active = null; });
        window.addEventListener('scroll', function () { reset(active); }, { passive: true });
    }

    /* ============================================================
       8. 磁性按钮
       ============================================================ */
    function initMagnetic() {
        if (!finePointer || reduceMotion) return;
        var STRENGTH = 0.28;
        var MAX_OFFSET = 7;

        $$('.magnetic').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                var dx = (e.clientX - (r.left + r.width / 2)) * STRENGTH;
                var dy = (e.clientY - (r.top + r.height / 2)) * STRENGTH;
                dx = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx));
                dy = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dy));
                el.classList.add('is-pulling');
                el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            });
            el.addEventListener('mouseleave', function () {
                el.classList.remove('is-pulling');
                el.style.transform = '';
            });
        });
    }

    /* ============================================================
       9. 页面过渡
       ============================================================ */
    function initPageTransition() {
        if (reduceMotion) return;

        document.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a[href]');
            if (!a) return;
            if (a.target === '_blank' || a.hasAttribute('download')) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

            var href = a.getAttribute('href');
            if (!href || href.indexOf('javascript') === 0 || href.indexOf('mailto') === 0 || href.indexOf('tel') === 0) return;
            if (href.charAt(0) === '#') return;

            var url;
            try { url = new URL(a.href, location.href); } catch (err) { return; }
            if (url.origin !== location.origin) return;
            if (url.pathname === location.pathname && url.hash) return;

            e.preventDefault();
            document.documentElement.classList.add('page-leaving');
            setTimeout(function () { location.href = a.href; }, 200);
        });

        window.addEventListener('pageshow', function () {
            document.documentElement.classList.remove('page-leaving');
        });
    }

    /* ============================================================
       10. 相册：筛选 + 灯箱
       ============================================================ */
    function initAlbum() {
        var items = $$('.album-item');
        if (!items.length) return;

        var btns = $$('.album-filter-btn');
        btns.forEach(function (btn) {
            if (btn.dataset.bound) return;
            btn.dataset.bound = '1';
            btn.addEventListener('click', function () {
                btns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var f = btn.dataset.filter;
                items.forEach(function (item) {
                    var show = f === 'all' || item.dataset.category === f;
                    item.classList.toggle('hide', !show);
                });
            });
        });

        var box = $('#lightbox');
        if (!box) return;
        var mask = $('#lightboxMask');
        var closeBtn = $('#lightboxClose');
        var image = $('#lightboxImage');
        var caption = $('#lightboxCaption');
        var lastFocus = null;

        function open(item) {
            var img = item.querySelector('.album-thumb img');
            var title = item.querySelector('.album-title');
            if (img && image) image.innerHTML = '<img src="' + img.src + '" alt="' + (img.alt || '') + '">';
            if (caption) caption.textContent = title ? title.textContent : '';
            lastFocus = document.activeElement;
            box.classList.add('open');
            document.body.classList.add('lightbox-open');
            if (closeBtn) closeBtn.focus();
        }

        function close() {
            box.classList.remove('open');
            document.body.classList.remove('lightbox-open');
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        items.forEach(function (item) {
            item.addEventListener('click', function () { open(item); });
        });

        if (mask) mask.addEventListener('click', close);
        if (closeBtn) closeBtn.addEventListener('click', close);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && box.classList.contains('open')) close();
        });
    }

    /* ============================================================
       11. 数字滚动
       ============================================================ */
    function initCountUp() {
        var nums = $$('[data-count]');
        if (!nums.length || !('IntersectionObserver' in window)) return;

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                var target = parseFloat(el.dataset.count) || 0;
                var suffix = el.dataset.suffix || '';
                var start = performance.now();
                var dur = 1100;

                function tick(now) {
                    var p = Math.min((now - start) / dur, 1);
                    var eased = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.round(target * eased) + suffix;
                    if (p < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
                io.unobserve(el);
            });
        }, { threshold: 0.6 });

        nums.forEach(function (n) { io.observe(n); });
    }

    /* ============================================================
       12. 工具函数
       ============================================================ */
    function debounce(fn, wait) {
        var t;
        return function () {
            var args = arguments, self = this;
            clearTimeout(t);
            t = setTimeout(function () { fn.apply(self, args); }, wait);
        };
    }

    /* ============================================================
       初始化
       ============================================================ */
    function boot() {
        initParticles();
        initCursorGlow();
        initScrollUI();
        initReveal();
        initSidebar();
        initNavState();
        initTilt();
        initMagnetic();
        initPageTransition();
        initAlbum();
        initCountUp();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // 动态内容插入后可手动调用
    window.lmReflow = function () {
        initReveal();
        initMagnetic();
    };
})();
