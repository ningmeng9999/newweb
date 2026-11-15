/**
 * sentence.js - 首屏语录打字机
 * 逐字敲出 → 停留 → 逐字删去 → 换一句
 */

(function () {
    'use strict';

    var el = document.getElementById('sentenceText');
    if (!el) return;

    var SENTENCES = [
        '以数据为炬，赴跨境山海。',
        '把复杂的事做简单，把简单的事做扎实。',
        '在数据与市场之间，寻找增长的那条缝。',
        '跨境无界，运营有道。',
        '用结果说话，用复盘进步。',
        '每一次选品，都是一次商业判断。',
        '日拱一卒，功不唐捐。',
        'Stay hungry, stay foolish.'
    ];

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cursor = document.createElement('span');
    cursor.className = 'type-cursor';
    cursor.setAttribute('aria-hidden', 'true');

    var idx = Math.floor(Math.random() * SENTENCES.length);
    var text = '';
    var i = 0;
    var timer = null;
    var phase = 'typing'; // typing | hold | erasing
    var visible = true;

    el.textContent = '';
    el.appendChild(cursor);

    function write(str) {
        // 只替换文本节点，保留光标
        if (el.firstChild && el.firstChild.nodeType === 3) {
            el.firstChild.nodeValue = str;
        } else {
            el.insertBefore(document.createTextNode(str), cursor);
        }
    }

    function nextSentence() {
        idx = (idx + 1) % SENTENCES.length;
        return SENTENCES[idx];
    }

    function step() {
        if (!visible) { timer = setTimeout(step, 900); return; }

        if (phase === 'typing') {
            text = text || SENTENCES[idx];
            i++;
            write(text.slice(0, i));
            if (i >= text.length) {
                phase = 'hold';
                timer = setTimeout(step, 3600);
            } else {
                timer = setTimeout(step, 52 + Math.random() * 46);
            }
            return;
        }

        if (phase === 'hold') {
            phase = 'erasing';
            timer = setTimeout(step, 30);
            return;
        }

        // erasing
        i--;
        write(text.slice(0, Math.max(i, 0)));
        if (i <= 0) {
            phase = 'typing';
            text = nextSentence();
            i = 0;
            timer = setTimeout(step, 420);
        } else {
            timer = setTimeout(step, 22);
        }
    }

    if (reduce) {
        write(SENTENCES[idx]);
        setInterval(function () {
            idx = (idx + 1) % SENTENCES.length;
            write(SENTENCES[idx]);
        }, 6000);
        return;
    }

    document.addEventListener('visibilitychange', function () {
        visible = !document.hidden;
        if (visible) {
            clearTimeout(timer);
            timer = setTimeout(step, 300);
        }
    });

    timer = setTimeout(step, 700);
})();
