/**
 * animate.js - 全局动画系统
 * 包含：Canvas粒子背景、滚动入场动画、导航栏滚动效果、移动端菜单、筛选交互、相册灯箱
 */

(function () {
    'use strict';

    /* ========================================
       Canvas 粒子背景系统
       ======================================== */
    function initParticleCanvas() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let particles = [];
        let width, height;
        let mouseX = -1000, mouseY = -1000;
        const PARTICLE_COUNT = window.innerWidth < 768 ? 40 : 80;
        const CONNECT_DISTANCE = 120;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        function createParticles() {
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 2 + 1
                });
            }
        }

        function getAccentColor() {
            const styles = getComputedStyle(document.documentElement);
            return styles.getPropertyValue('--accent').trim() || '#00d4ff';
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);
            const accent = getAccentColor();

            // 更新并绘制粒子
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                // 边界反弹
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // 鼠标交互
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    const force = (100 - dist) / 100;
                    p.x += dx / dist * force * 1.5;
                    p.y += dy / dist * force * 1.5;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = accent;
                ctx.globalAlpha = 0.6;
                ctx.fill();
            }

            // 连线
            ctx.globalAlpha = 1;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECT_DISTANCE) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = accent;
                        ctx.globalAlpha = (1 - dist / CONNECT_DISTANCE) * 0.2;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(draw);
        }

        resize();
        createParticles();
        draw();

        window.addEventListener('resize', () => {
            resize();
            createParticles();
        });

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            mouseX = -1000;
            mouseY = -1000;
        });
    }

    /* ========================================
       滚动入场动画（IntersectionObserver）
       ======================================== */
    function initScrollAnimation() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        if (!elements.length) return;

        if (!('IntersectionObserver' in window)) {
            elements.forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(el => observer.observe(el));
    }

    /* ========================================
       侧边栏展开收起（移动端）
       ======================================== */
    function initSidebar() {
        const toggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const mask = document.getElementById('sidebarMask');
        if (!toggleBtn || !sidebar || !mask) return;

        function open() {
            sidebar.classList.add('open');
            mask.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function close() {
            sidebar.classList.remove('open');
            mask.classList.remove('show');
            document.body.style.overflow = '';
        }

        toggleBtn.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                close();
            } else {
                open();
            }
        });

        mask.addEventListener('click', close);

        // 点击导航链接后自动关闭（移动端），二级菜单toggle除外
        const navLinks = sidebar.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 992 && !link.parentElement.classList.contains('has-submenu')) {
                    close();
                }
            });
        });

        // 窗口变大时自动关闭移动端状态
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                close();
            }
        });

        // 阻止侧边栏内滚轮穿透到页面
        sidebar.addEventListener('wheel', (e) => {
            const atTop = sidebar.scrollTop <= 0;
            const atBottom = sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 1;
            const scrollingUp = e.deltaY < 0;
            const scrollingDown = e.deltaY > 0;
            // 不在边界时阻止页面滚动，让侧边栏自己滚
            if (!((atTop && scrollingUp) || (atBottom && scrollingDown))) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /* ========================================
       作品筛选
       ======================================== */
    function initWorksFilter() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const workCards = document.querySelectorAll('.work-card');
        if (!filterBtns.length || !workCards.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                workCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.classList.remove('hide');
                    } else {
                        card.classList.add('hide');
                    }
                });
            });
        });
    }

    /* ========================================
       相册筛选 + 灯箱
       ======================================== */
    function initAlbum() {
        const filterBtns = document.querySelectorAll('.album-filter-btn');
        const albumItems = document.querySelectorAll('.album-item');
        const lightbox = document.getElementById('lightbox');
        const lightboxMask = document.getElementById('lightboxMask');
        const lightboxClose = document.getElementById('lightboxClose');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxCaption = document.getElementById('lightboxCaption');

        // 筛选
        if (filterBtns.length && albumItems.length) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const filter = btn.dataset.filter;
                    albumItems.forEach(item => {
                        if (filter === 'all' || item.dataset.category === filter) {
                            item.classList.remove('hide');
                        } else {
                            item.classList.add('hide');
                        }
                    });
                });
            });
        }

        // 灯箱
        if (lightbox && albumItems.length) {
            albumItems.forEach(item => {
                item.addEventListener('click', () => {
                    const img = item.querySelector('.album-thumb img');
                    const title = item.querySelector('.album-title');
                    if (img) {
                        lightboxImage.innerHTML = `<img src="${img.src}" alt="${img.alt || ''}">`;
                        lightboxImage.style.background = 'transparent';
                    }
                    if (title) {
                        lightboxCaption.textContent = title.textContent;
                    }
                    lightbox.classList.add('open');
                    document.body.style.overflow = 'hidden';
                });
            });

            function closeLightbox() {
                lightbox.classList.remove('open');
                document.body.style.overflow = '';
            }

            lightboxMask.addEventListener('click', closeLightbox);
            lightboxClose.addEventListener('click', closeLightbox);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('open')) {
                    closeLightbox();
                }
            });
        }
    }

    /* ========================================
       侧边栏二阶折叠菜单
       ======================================== */
    function initSubmenu() {
        const toggles = document.querySelectorAll('.has-submenu > .nav-link, .submenu-toggle');
        if (!toggles.length) return;

        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = toggle.closest('.has-submenu');
                if (parent) {
                    parent.classList.toggle('open');
                }
            });
        });
    }

    /* ========================================
       数字计数动画
       ======================================== */
    function initCountUp() {
        const nums = document.querySelectorAll('.stat-num[data-count]');
        if (!nums.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count, 10);
                    let current = 0;
                    const step = Math.max(1, Math.ceil(target / 40));
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        el.textContent = current + '+';
                    }, 30);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        nums.forEach(n => observer.observe(n));
    }

    /* ========================================
       联系表单
       ======================================== */
    function initContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('.form-submit span:first-child');
            const original = btn.textContent;
            btn.textContent = '已发送 ✓';
            setTimeout(() => {
                btn.textContent = original;
                form.reset();
            }, 2000);
        });
    }

    // 初始化所有动画模块
    initParticleCanvas();
    initScrollAnimation();
    initSidebar();
    initSubmenu();
    initWorksFilter();
    initAlbum();
    initCountUp();
    initContactForm();
})();
