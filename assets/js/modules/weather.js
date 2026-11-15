/**
 * weather.js - 侧栏天气（杭州）
 * 数据源 wttr.in，30 分钟内走本地缓存，失败时优雅降级
 */

(function () {
    'use strict';

    var box = document.getElementById('weatherInfo');
    if (!box) return;

    var CITY = '杭州';
    var CACHE_KEY = 'lm_weather_v2';
    var TTL = 30 * 60 * 1000;

    function readCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var obj = JSON.parse(raw);
            if (!obj || !obj.t || Date.now() - obj.t > TTL) return null;
            return obj.d;
        } catch (e) { return null; }
    }

    function writeCache(d) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
    }

    function render(d) {
        if (!d) {
            box.innerHTML =
                '<div class="weather-line">' +
                    '<span class="weather-city">' + CITY + '</span>' +
                    '<span class="weather-temp">--°</span>' +
                '</div>' +
                '<div class="weather-line-2">' +
                    '<span class="weather-cond">天气暂不可用</span>' +
                    '<span class="weather-range">--/--</span>' +
                '</div>';
            return;
        }

        box.innerHTML =
            '<div class="weather-line">' +
                '<span class="weather-city">' + CITY + '</span>' +
                '<span class="weather-temp">' + d.temp + '°</span>' +
            '</div>' +
            '<div class="weather-line-2">' +
                '<span class="weather-cond">' + d.desc + '</span>' +
                '<span class="weather-range">' + d.low + '°/' + d.high + '°</span>' +
            '</div>';

        box.title = '体感 ' + d.feels + '° · 湿度 ' + d.humidity + '% · 风速 ' + d.wind + 'km/h';
    }

    function fetchWeather() {
        var cached = readCache();
        if (cached) { render(cached); return; }

        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, 7000);

        fetch('https://wttr.in/Hangzhou?format=j1&lang=zh', { signal: controller.signal })
            .then(function (res) {
                clearTimeout(timer);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (json) {
                var cur = json.current_condition && json.current_condition[0];
                if (!cur) throw new Error('no data');
                var today = json.weather && json.weather[0];

                var desc = (cur.lang_zh && cur.lang_zh[0] && cur.lang_zh[0].value) ||
                    (cur.weatherDesc && cur.weatherDesc[0] && cur.weatherDesc[0].value) || '—';

                var d = {
                    temp: cur.temp_C,
                    feels: cur.FeelsLikeC,
                    humidity: cur.humidity,
                    wind: cur.windspeedKmph,
                    desc: desc,
                    high: today ? today.maxtempC : '--',
                    low: today ? today.mintempC : '--'
                };
                writeCache(d);
                render(d);
            })
            .catch(function () {
                clearTimeout(timer);
                render(null);
            });
    }

    render(null);
    fetchWeather();
    setInterval(fetchWeather, TTL);
})();
