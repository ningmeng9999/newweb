/**
 * music.js - 后台静音播放音乐功能
 * 默认静音自动播放，用户首次交互后取消静音
 * 支持手动开关，播放时显示波形动画
 */

(function () {
    'use strict';

    const musicBtn = document.getElementById('musicBtn');
    const bgMusic = document.getElementById('bgMusic');
    if (!musicBtn || !bgMusic) return;

    let isPlaying = false;
    let hasInteracted = false;

    /**
     * 尝试自动播放（静音状态下）
     */
    function tryAutoPlay() {
        bgMusic.muted = true;
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                // 不自动取消静音，等待用户交互
            }).catch(() => {
                // 自动播放被阻止，等待用户交互
                isPlaying = false;
            });
        }
    }

    /**
     * 切换播放状态
     */
    function toggleMusic() {
        if (isPlaying) {
            bgMusic.pause();
            isPlaying = false;
            musicBtn.classList.remove('playing');
        } else {
            bgMusic.muted = false;
            bgMusic.volume = 0.5;
            bgMusic.play().then(() => {
                isPlaying = true;
                musicBtn.classList.add('playing');
            }).catch(() => {
                // 播放失败
            });
        }
    }

    // 按钮点击切换
    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMusic();
    });

    // 首次用户交互后尝试取消静音
    function onFirstInteraction() {
        if (hasInteracted) return;
        hasInteracted = true;

        if (isPlaying) {
            bgMusic.muted = false;
            bgMusic.volume = 0.3;
            musicBtn.classList.add('playing');
        }

        document.removeEventListener('click', onFirstInteraction);
        document.removeEventListener('keydown', onFirstInteraction);
        document.removeEventListener('touchstart', onFirstInteraction);
    }

    document.addEventListener('click', onFirstInteraction);
    document.addEventListener('keydown', onFirstInteraction);
    document.addEventListener('touchstart', onFirstInteraction);

    // 页面加载后尝试自动播放
    window.addEventListener('load', tryAutoPlay);

    // 暴露控制
    window.MusicPlayer = {
        toggle: toggleMusic,
        isPlaying: () => isPlaying
    };
})();
