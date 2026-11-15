/**
 * music.js - 背景音开关
 * 默认关闭。优先生效 ./assets/audio/bgm.mp3；
 * 若音频文件不存在，则用 WebAudio 合成一段极轻的环境底噪，保证按钮不是死的。
 */

(function () {
    'use strict';

    var btn = document.getElementById('musicBtn');
    if (!btn) return;

    var KEY = 'lm_music_on';
    var SRC = './assets/audio/bgm.mp3';

    var audio = null;
    var ctx = null;
    var synthStop = null;
    var playing = false;
    var loading = false;

    function toast(msg) {
        if (window.lmToast) window.lmToast(msg);
    }

    function mark(on) {
        playing = on;
        btn.classList.toggle('playing', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('title', on ? '关闭背景音' : '开启背景音');
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    }

    /* ---------- 音频文件 ---------- */
    function ensureAudio() {
        if (audio) return audio;
        audio = new Audio(SRC);
        audio.loop = true;
        audio.volume = 0.35;
        audio.preload = 'none';
        return audio;
    }

    function playFile() {
        return new Promise(function (resolve, reject) {
            var a = ensureAudio();
            var settled = false;

            function ok() { if (!settled) { settled = true; cleanup(); resolve(); } }
            function fail() { if (!settled) { settled = true; cleanup(); reject(new Error('audio unavailable')); } }
            function cleanup() {
                a.removeEventListener('canplay', ok);
                a.removeEventListener('error', fail);
            }

            a.addEventListener('canplay', ok, { once: true });
            a.addEventListener('error', fail, { once: true });
            a.load();

            var p = a.play();
            if (p && p.then) {
                p.then(ok).catch(fail);
            }
            setTimeout(fail, 2500);
        });
    }

    /* ---------- 兜底：环境音合成 ---------- */
    function playSynth() {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error('no audiocontext');

        if (!ctx) ctx = new AC();
        if (ctx.state === 'suspended') ctx.resume();

        var master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);

        // 缓慢的低通，让音色偏"空气感"
        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 620;
        filter.Q.value = 0.6;
        filter.connect(master);

        var freqs = [110, 164.81, 220, 277.18];
        var oscs = freqs.map(function (f, i) {
            var osc = ctx.createOscillator();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.value = f;
            osc.detune.value = (i - 1.5) * 4;

            var g = ctx.createGain();
            g.gain.value = 0.16 / (i + 1);

            // 每个声部一条极慢的振幅起伏
            var lfo = ctx.createOscillator();
            lfo.frequency.value = 0.03 + i * 0.017;
            var lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.06 / (i + 1);
            lfo.connect(lfoGain).connect(g.gain);
            lfo.start();

            osc.connect(g).connect(filter);
            osc.start();
            return { osc: osc, lfo: lfo };
        });

        // 淡入
        master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.4);

        synthStop = function () {
            try {
                master.gain.cancelScheduledValues(ctx.currentTime);
                master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
            } catch (e) {}
            setTimeout(function () {
                oscs.forEach(function (o) {
                    try { o.osc.stop(); o.lfo.stop(); } catch (e) {}
                });
                try { filter.disconnect(); master.disconnect(); } catch (e) {}
            }, 900);
        };
    }

    /* ---------- 开关 ---------- */
    function start() {
        if (playing || loading) return;
        loading = true;

        playFile().then(function () {
            loading = false;
            mark(true);
            toast('背景音已开启');
        }).catch(function () {
            try {
                playSynth();
                loading = false;
                mark(true);
                toast('未找到 assets/audio/bgm.mp3，已切换为环境音');
            } catch (e) {
                loading = false;
                mark(false);
                toast('当前浏览器不支持音频播放');
            }
        });
    }

    function stop() {
        if (audio) {
            try { audio.pause(); } catch (e) {}
        }
        if (synthStop) {
            synthStop();
            synthStop = null;
        }
        mark(false);
        toast('背景音已关闭');
    }

    document.addEventListener('click', function (e) {
        var target = e.target.closest && e.target.closest('#musicBtn');
        if (!target) return;
        e.preventDefault();
        playing ? stop() : start();
    });

    // 上次开启过，等用户第一次交互时恢复（浏览器策略要求）
    var wantOn = false;
    try { wantOn = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (wantOn) {
        var resume = function () {
            document.removeEventListener('pointerdown', resume);
            document.removeEventListener('keydown', resume);
            start();
        };
        document.addEventListener('pointerdown', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
    }

    mark(false);

    window.MusicPlayer = {
        start: start,
        stop: stop,
        toggle: function () { playing ? stop() : start(); },
        isPlaying: function () { return playing; }
    };
})();
