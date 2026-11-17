/**
 * tools.js - 工具页：全部在浏览器本地计算，不发送任何请求
 * 每个工具一个独立小节，互不依赖。
 */

(function () {
    'use strict';

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var num = function (el) { var n = parseFloat(el.value); return isFinite(n) ? n : 0; };
    var esc = function (s) {
        return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
    };
    var fixed = function (n, d) { return isFinite(n) ? n.toFixed(d == null ? 2 : d) : '—'; };
    var pct = function (n, d) { return fixed(n * 100, d == null ? 1 : d) + '%'; };

    function toast(msg) {
        if (window.lmToast) window.lmToast(msg);
    }

    function kv(label, value, good) {
        return '<div class="kv"><span>' + label + '</span><b class="' + (good ? 'good' : '') + '">' + value + '</b></div>';
    }

    function copy(text) {
        if (!text) return toast('没有可复制的内容');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { toast('已复制'); }, function () { toast('复制失败'); });
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); toast('已复制'); } catch (e) { toast('复制失败'); }
            document.body.removeChild(ta);
        }
    }

    function out(el, html, empty) {
        el.innerHTML = html;
        el.classList.toggle('empty', !!empty);
    }

    /* ---------------- 工具切换 ---------------- */
    function initNav() {
        var nav = $('#toolNav');
        if (!nav) return;
        nav.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-tool]');
            if (!btn) return;
            $$('button', nav).forEach(function (b) { b.classList.toggle('active', b === btn); });
            var key = btn.getAttribute('data-tool');
            $$('.panel').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === key); });
            if (history.replaceState) history.replaceState(null, '', '#' + key);
        });

        var hash = (location.hash || '').replace('#', '');
        var target = hash && nav.querySelector('button[data-tool="' + hash + '"]');
        if (target) target.click();
    }

    /* ---------------- 1. 利润测算 ---------------- */
    function initProfit() {
        var btn = $('#profitCalc');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var price = num($('#p_price'));
            var cost = num($('#p_cost'));
            var ship = num($('#p_ship'));
            var fee = num($('#p_fee'));
            var comm = num($('#p_comm')) / 100;
            var ads = num($('#p_ads')) / 100;
            var target = num($('#p_target')) / 100;

            if (price <= 0) return out($('#profitOut'), '<span class="err">售价需要大于 0</span>');

            var commission = price * comm;
            var adCost = price * ads;
            var grossBeforeAds = price - cost - ship - fee - commission;
            var netProfit = grossBeforeAds - adCost;
            var netRate = netProfit / price;
            var breakEvenAcos = grossBeforeAds > 0 ? grossBeforeAds / price : 0;
            var suggest = (1 - comm - target) > 0 ? (cost + ship + fee) / (1 - comm - target) : NaN;

            out($('#profitOut'),
                kv('毛利（扣广告前）', '¥' + fixed(grossBeforeAds)) +
                kv('净利（扣广告后）', '¥' + fixed(netProfit), netProfit > 0) +
                kv('净利率', pct(netRate), netRate >= target) +
                kv('盈亏平衡 ACOS', pct(breakEvenAcos) + '（广告占比超过它就亏）') +
                kv('当前广告占比', pct(ads)) +
                kv('保本 ROAS', breakEvenAcos > 0 ? fixed(1 / breakEvenAcos, 2) : '—') +
                kv('达到目标净利率的建议售价', isFinite(suggest) && suggest > 0 ? '¥' + fixed(suggest, 0) : '—'),
                false);
        });
    }

    /* ---------------- 2. ACOS ---------------- */
    function initAcos() {
        var btn = $('#acosCalc');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var spend = num($('#a_spend'));
            var sales = num($('#a_sales'));
            var clicks = num($('#a_clicks'));
            var orders = num($('#a_orders'));
            var margin = num($('#a_margin')) / 100;

            if (sales <= 0) return out($('#acosOut'), '<span class="err">广告销售额需要大于 0</span>');

            var acos = spend / sales;
            var roas = sales / spend;
            var cpc = clicks > 0 ? spend / clicks : 0;
            var cvr = clicks > 0 ? orders / clicks : 0;
            var cpa = orders > 0 ? spend / orders : 0;
            var aov = orders > 0 ? sales / orders : 0;
            var verdict = margin > 0
                ? (acos <= margin
                    ? '<b class="good">广告在赚钱</b>：ACOS 低于净利率 ' + pct(margin)
                    : '<span class="err">广告在亏钱</span>：ACOS 高于净利率 ' + pct(margin) + '，需要降竞价或提转化')
                : '';

            out($('#acosOut'),
                kv('ACOS（花费 / 销售额）', pct(acos)) +
                kv('ROAS（销售额 / 花费）', fixed(roas, 2)) +
                kv('CPC（单次点击成本）', '¥' + fixed(cpc)) +
                kv('CVR（点击转化率）', pct(cvr)) +
                kv('CPA（单笔订单成本）', '¥' + fixed(cpa)) +
                kv('客单价', '¥' + fixed(aov)) +
                kv('盈亏判断', verdict || '—'),
                false);
        });
    }

    /* ---------------- 3. JSON ---------------- */
    function initJson() {
        var input = $('#jsonIn');
        if (!input) return;
        var status = $('#jsonOut');

        function report(result, label) {
            if (result.ok) {
                out(status, '<b class="good">✓ ' + label + '</b>　jsonOut 已更新，可以复制' + (result.extra ? '<br>' + result.extra : ''));
            } else {
                out(status, '<span class="err">✗ JSON 有误：' + esc(result.error) + '</span>');
            }
        }

        function parse() {
            var text = input.value.trim();
            if (!text) return { ok: false, error: '内容为空' };
            try {
                return { ok: true, value: JSON.parse(text) };
            } catch (err) {
                var msg = String(err.message || err);
                var m = msg.match(/position\s+(\d+)/i);
                if (m) {
                    var pos = parseInt(m[1], 10);
                    var before = input.value.slice(0, pos).split('\n');
                    msg += '（第 ' + before.length + ' 行，第 ' + (before[before.length - 1].length + 1) + ' 列）';
                }
                return { ok: false, error: msg };
            }
        }

        function fill(value) {
            input.value = value;
        }

        $('#jsonPretty').addEventListener('click', function () {
            var r = parse();
            if (!r.ok) return report(r);
            fill(JSON.stringify(r.value, null, 2));
            report({ ok: true, label: '已格式化', extra: '共 ' + input.value.split('\n').length + ' 行' });
        });

        $('#jsonMin').addEventListener('click', function () {
            var r = parse();
            if (!r.ok) return report(r);
            var before = input.value.length;
            fill(JSON.stringify(r.value));
            report({ ok: true, label: '已压缩', extra: Math.round((1 - input.value.length / before) * 100) + '% 的体积被去掉' });
        });

        $('#jsonValid').addEventListener('click', function () {
            var r = parse();
            if (!r.ok) return report(r);
            var count = Array.isArray(r.value) ? r.value.length + ' 个元素' : typeof r.value === 'object' && r.value ? Object.keys(r.value).length + ' 个顶层字段' : typeof r.value;
            report({ ok: true, label: 'JSON 格式正确', extra: '结构：' + count });
        });

        $('#jsonCopy').addEventListener('click', function () { copy(input.value); });
    }

    /* ---------------- 4. CSV ↔ JSON ---------------- */
    function parseCsv(text) {
        var delim = text.indexOf('\t') > -1 && text.indexOf(',') === -1 ? '\t' : ',';
        var rows = [];
        var row = [];
        var field = '';
        var inQuotes = false;

        for (var i = 0; i < text.length; i++) {
            var c = text[i];
            if (inQuotes) {
                if (c === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; }
                    else inQuotes = false;
                } else field += c;
            } else if (c === '"') {
                inQuotes = true;
            } else if (c === delim) {
                row.push(field); field = '';
            } else if (c === '\n') {
                row.push(field); field = ''; rows.push(row); row = [];
            } else if (c !== '\r') {
                field += c;
            }
        }
        if (field !== '' || row.length) { row.push(field); rows.push(row); }
        return rows.filter(function (r) { return r.some(function (v) { return String(v).trim() !== ''; }); });
    }

    function toCsv(list) {
        if (!Array.isArray(list) || !list.length) return '';
        var keys = [];
        list.forEach(function (item) {
            if (item && typeof item === 'object') {
                Object.keys(item).forEach(function (k) { if (keys.indexOf(k) === -1) keys.push(k); });
            }
        });
        var cell = function (v) {
            var s = v == null ? '' : String(v);
            return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        };
        var lines = [keys.join(',')];
        list.forEach(function (item) {
            lines.push(keys.map(function (k) { return cell(item ? item[k] : ''); }).join(','));
        });
        return lines.join('\n');
    }

    function initCsv() {
        var input = $('#csvIn');
        if (!input) return;
        var result = '';

        var show = function (text, label) {
            result = text;
            out($('#csvOut'), '<b class="good">✓ ' + label + '</b>　' +
                '<pre class="code-out">' + esc(text.length > 4000 ? text.slice(0, 4000) + '\n…（已截断显示，复制可得完整内容）' : text) + '</pre>', false);
        };

        $('#csv2json').addEventListener('click', function () {
            var rows = parseCsv(input.value);
            if (rows.length < 2) return out($('#csvOut'), '<span class="err">至少需要一行表头 + 一行数据</span>');
            var head = rows[0].map(function (h) { return String(h).trim(); });
            var list = rows.slice(1).map(function (r) {
                var obj = {};
                head.forEach(function (k, i) { obj[k || ('列' + (i + 1))] = (r[i] == null ? '' : r[i]).trim(); });
                return obj;
            });
            show(JSON.stringify(list, null, 2), '已转为 ' + list.length + ' 条 JSON 对象');
        });

        $('#json2csv').addEventListener('click', function () {
            var data;
            try { data = JSON.parse(input.value); } catch (e) { return out($('#csvOut'), '<span class="err">JSON 有误：' + esc(e.message) + '</span>'); }
            var list = Array.isArray(data) ? data : [data];
            if (typeof list[0] !== 'object' || list[0] === null) return out($('#csvOut'), '<span class="err">需要对象数组才能转 CSV</span>');
            show(toCsv(list), '已转为 ' + list.length + ' 行 CSV');
        });

        $('#csvCopy').addEventListener('click', function () { copy(result); });
    }

    /* ---------------- 5. 文本对比 ---------------- */
    function initDiff() {
        var btn = $('#diffRun');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var a = $('#d_left').value.split('\n');
            var b = $('#d_right').value.split('\n');
            if (a.length > 1500 || b.length > 1500) return out($('#diffOut'), '<span class="err">文本过长（上限各 1500 行）</span>');
            if (!a.join('') && !b.join('')) return out($('#diffOut'), '<span class="err">两段文本都是空的</span>');

            // LCS 动态规划
            var m = a.length, n = b.length;
            var dp = [];
            for (var i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));
            for (i = m - 1; i >= 0; i--) {
                for (var j = n - 1; j >= 0; j--) {
                    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
                }
            }

            var lines = [], add = 0, del = 0;
            i = 0; j = 0;
            while (i < m && j < n) {
                if (a[i] === b[j]) { lines.push(['same', a[i]]); i++; j++; }
                else if (dp[i + 1][j] >= dp[i][j + 1]) { lines.push(['del', a[i]]); del++; i++; }
                else { lines.push(['add', b[j]]); add++; j++; }
            }
            while (i < m) { lines.push(['del', a[i]]); del++; i++; }
            while (j < n) { lines.push(['add', b[j]]); add++; j++; }

            var html = lines.slice(0, 400).map(function (item) {
                var sign = item[0] === 'add' ? '+ ' : item[0] === 'del' ? '− ' : '  ';
                return '<div class="line-' + item[0] + '">' + esc(sign + item[1]) + '</div>';
            }).join('');

            out($('#diffOut'),
                kv('新增行', add, add === 0) + kv('删除行', del, del === 0) +
                kv('相同行', lines.length - add - del) +
                '<pre class="code-out" style="margin-top:10px">' + html + (lines.length > 400 ? '<div class="line-same">…（只显示前 400 行）</div>' : '') + '</pre>',
                false);
        });
    }

    /* ---------------- 6. 编码转换 ---------------- */
    function initCodec() {
        var input = $('#c_in');
        if (!input) return;
        var result = '';

        var show = function (text, label) {
            result = text;
            out($('#c_out'), '<b class="good">✓ ' + label + '</b><pre class="code-out" style="margin-top:8px">' + esc(text) + '</pre>', false);
        };
        var fail = function (msg) { out($('#c_out'), '<span class="err">' + msg + '</span>'); };

        $$('[data-codec]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var text = input.value;
                if (!text) return fail('先输入内容');
                var mode = btn.getAttribute('data-codec');
                try {
                    if (mode === 'b64e') {
                        var bytes = new TextEncoder().encode(text);
                        var bin = '';
                        bytes.forEach(function (b) { bin += String.fromCharCode(b); });
                        show(btoa(bin), 'Base64 编码结果');
                    } else if (mode === 'b64d') {
                        var raw = atob(text.replace(/\s/g, ''));
                        var arr = new Uint8Array(raw.length);
                        for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
                        show(new TextDecoder().decode(arr), 'Base64 解码结果');
                    } else if (mode === 'urle') {
                        show(encodeURIComponent(text), 'URL 编码结果');
                    } else {
                        show(decodeURIComponent(text), 'URL 解码结果');
                    }
                } catch (e) {
                    fail('转换失败：' + (mode === 'b64d' ? '内容不是合法的 Base64' : '内容包含非法字符'));
                }
            });
        });

        $('#c_copy').addEventListener('click', function () { copy(result); });
    }

    /* ---------------- 7. 时间戳 ---------------- */
    function initTime() {
        var input = $('#t_in');
        if (!input) return;

        var pad = function (n) { return String(n).padStart(2, '0'); };
        var local = function (d) {
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
                pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        };
        var relative = function (d) {
            var diff = (Date.now() - d.getTime()) / 1000;
            var future = diff < 0;
            diff = Math.abs(diff);
            var unit = diff < 60 ? [Math.round(diff), '秒'] :
                diff < 3600 ? [Math.round(diff / 60), '分钟'] :
                diff < 86400 ? [Math.round(diff / 3600), '小时'] :
                diff < 2592000 ? [Math.round(diff / 86400), '天'] :
                diff < 31536000 ? [Math.round(diff / 2592000), '个月'] : [Math.round(diff / 31536000), '年'];
            return future ? unit[0] + ' ' + unit[1] + '后' : unit[0] + ' ' + unit[1] + '前';
        };

        var run = function () {
            var v = input.value.trim();
            if (!v) return out($('#t_out'), '<span class="err">先填一个时间戳或日期</span>');

            var d;
            if (/^\d{13}$/.test(v)) d = new Date(parseInt(v, 10));
            else if (/^\d{10}$/.test(v)) d = new Date(parseInt(v, 10) * 1000);
            else d = new Date(v.replace(/-/g, '/'));

            if (isNaN(d.getTime())) return out($('#t_out'), '<span class="err">无法识别，试试 1730000000 或 2026-11-17 18:30</span>');

            out($('#t_out'),
                kv('秒级时间戳', Math.floor(d.getTime() / 1000)) +
                kv('毫秒级时间戳', d.getTime()) +
                kv('本地时间', local(d)) +
                kv('UTC', d.toISOString()) +
                kv('星期', '星期' + '日一二三四五六'[d.getDay()]) +
                kv('距今', relative(d)),
                false);
        };

        $('#t_run').addEventListener('click', run);
        $('#t_now').addEventListener('click', function () {
            input.value = Math.floor(Date.now() / 1000);
            run();
        });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    }

    /* ---------------- 8. 正则 ---------------- */
    function initRegex() {
        var pat = $('#r_pat');
        if (!pat) return;

        var run = function () {
            var text = $('#r_text').value;
            var flags = $('#r_flags').value.replace(/[^gimsuy]/g, '');
            if (!pat.value) return out($('#r_out'), '<span class="err">先写表达式</span>');

            var re;
            try {
                re = new RegExp(pat.value, flags.indexOf('g') === -1 ? flags + 'g' : flags);
            } catch (e) {
                return out($('#r_out'), '<span class="err">表达式有误：' + esc(e.message) + '</span>');
            }

            var matches = [];
            var m;
            var guard = 0;
            while ((m = re.exec(text)) !== null && guard++ < 500) {
                matches.push({ index: m.index, text: m[0], groups: m.slice(1) });
                if (m[0] === '') re.lastIndex++;
            }

            var html = '';
            var last = 0;
            matches.forEach(function (item) {
                html += esc(text.slice(last, item.index)) + '<mark class="hit">' + esc(item.text) + '</mark>';
                last = item.index + item.text.length;
            });
            html += esc(text.slice(last));

            var list = matches.slice(0, 20).map(function (item, i) {
                return '<div class="kv"><span>#' + (i + 1) + ' @' + item.index + '</span><b>' + esc(item.text) +
                    (item.groups.length ? '（分组：' + item.groups.map(function (g) { return esc(g == null ? '' : g); }).join(' / ') + '）' : '') + '</b></div>';
            }).join('');

            out($('#r_out'),
                kv('匹配数量', matches.length + ' 处', matches.length > 0) +
                '<div style="margin-top:10px;line-height:1.9">' + html + '</div>' +
                (list ? '<div style="margin-top:10px">' + list + '</div>' : ''),
                false);
        };

        ['#r_pat', '#r_flags', '#r_text'].forEach(function (sel) {
            $(sel).addEventListener('input', run);
        });
        run();
    }

    /* ---------------- 9. 文本处理 ---------------- */
    function initText() {
        var input = $('#x_in');
        if (!input) return;
        var result = '';

        var show = function (text, label) {
            result = text;
            input.value = text;
            out($('#x_out'), '<b class="good">✓ ' + label + '</b><pre class="code-out" style="margin-top:8px">' +
                esc(text.length > 3000 ? text.slice(0, 3000) + '\n…' : text) + '</pre>', false);
        };

        $$('[data-text]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var raw = input.value;
                if (!raw) return out($('#x_out'), '<span class="err">先粘贴文本</span>');
                var mode = btn.getAttribute('data-text');
                var lines = raw.split('\n');

                if (mode === 'stats') {
                    var noSpace = raw.replace(/\s/g, '');
                    var cn = (raw.match(/[\u4e00-\u9fa5]/g) || []).length;
                    var words = raw.trim() ? raw.trim().split(/\s+/).filter(Boolean).length : 0;
                    return out($('#x_out'),
                        kv('总字符数', raw.length) + kv('去空格字符数', noSpace.length) +
                        kv('汉字数', cn) + kv('英文单词（按空格）', words) +
                        kv('行数', lines.length) + kv('去重后行数', new Set(lines).size),
                        false);
                }

                if (mode === 'dedupe') return show(Array.from(new Set(lines)).join('\n'), '已按行去重');
                if (mode === 'blank') return show(lines.filter(function (l) { return l.trim() !== ''; }).join('\n'), '已删除空行');
                if (mode === 'trim') return show(lines.map(function (l) { return l.trim(); }).join('\n'), '已去掉每行首尾空格');
                if (mode === 'sort') return show(lines.slice().sort(function (a, b) { return a.localeCompare(b, 'zh-CN'); }).join('\n'), '已排序');
                if (mode === 'lower') return show(raw.toLowerCase(), '已转小写');
                if (mode === 'upper') return show(raw.toUpperCase(), '已转大写');
            });
        });

        $('#x_copy').addEventListener('click', function () { copy(result); });
    }

    /* ---------------- 10. 哈希 ---------------- */
    function initHash() {
        var input = $('#h_in');
        if (!input) return;

        $$('[data-hash]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var algo = btn.getAttribute('data-hash');
                var text = input.value;
                if (!text) return out($('#h_out'), '<span class="err">先输入内容</span>');
                if (!window.crypto || !window.crypto.subtle) {
                    return out($('#h_out'), '<span class="err">当前环境不支持加密接口，请用 https 或 localhost 打开</span>');
                }
                window.crypto.subtle.digest(algo, new TextEncoder().encode(text)).then(function (buf) {
                    var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) {
                        return b.toString(16).padStart(2, '0');
                    }).join('');
                    out($('#h_out'), kv(algo, hex), false);
                    copy(hex);
                }).catch(function () {
                    out($('#h_out'), '<span class="err">计算出错</span>');
                });
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initNav();
        initProfit();
        initAcos();
        initJson();
        initCsv();
        initDiff();
        initCodec();
        initTime();
        initRegex();
        initText();
        initHash();
    });
})();
