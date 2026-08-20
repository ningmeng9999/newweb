/**
 * weather.js - 实时天气（中文）+ 日期星期 + 多维度信息
 * 数据源：wttr.in（免费，支持中文 lang=zh）
 * 固定城市：杭州
 */

(function () {
    'use strict';

    const weatherEl = document.getElementById('weatherInfo');
    if (!weatherEl) return;

    // 天气图标映射（emoji）
    const WEATHER_ICONS = {
        '晴': '☀️', '晴朗': '☀️', 'Clear': '☀️', 'Sunny': '☀️',
        '多云': '⛅', 'Partly cloudy': '⛅', '局部多云': '⛅', '晴间多云': '⛅',
        '阴': '☁️', 'Overcast': '☁️', '阴天': '☁️', '多云转阴': '☁️',
        '雨': '🌧️', 'Rain': '🌧️', '小雨': '🌦️', '中雨': '🌧️', '大雨': '🌧️',
        '阵雨': '🌦️', 'Patchy rain': '🌦️',
        '雷阵雨': '⛈️', 'Thunder': '⛈️', '雷暴': '⛈️',
        '雪': '❄️', 'Snow': '❄️', '小雪': '🌨️', '中雪': '❄️',
        '雾': '🌫️', 'Fog': '🌫️', 'Mist': '🌫️', '霾': '🌫️', '薄雾': '🌫️',
        '风': '💨', 'Windy': '💨', '大风': '💨',
        'default': '🌤️'
    };

    const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    function getWeatherIcon(desc) {
        if (!desc) return WEATHER_ICONS.default;
        for (const key in WEATHER_ICONS) {
            if (desc.includes(key)) return WEATHER_ICONS[key];
        }
        return WEATHER_ICONS.default;
    }

    function getDateInfo() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const week = WEEKDAYS[now.getDay()];
        return { date: `${month}月${day}日`, week };
    }

    function renderWeather(data) {
        const { date, week } = getDateInfo();

        if (data) {
            const icon = getWeatherIcon(data.desc);
            weatherEl.innerHTML = `
                <div class="weather-top">
                    <div class="weather-location">
                        <span class="weather-city-icon">📍</span>
                        <span class="weather-city">${data.city}</span>
                    </div>
                    <div class="weather-date-block">
                        <span class="weather-date">${date}</span>
                        <span class="weather-week">${week}</span>
                    </div>
                </div>
                <div class="weather-main">
                    <span class="weather-icon-big">${icon}</span>
                    <div class="weather-temp-block">
                        <span class="weather-temp">${data.temp}°</span>
                        <span class="weather-desc">${data.desc}</span>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail-item">
                        <span class="detail-label">体感</span>
                        <span class="detail-value">${data.feelsLike}°</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-label">湿度</span>
                        <span class="detail-value">${data.humidity}%</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-label">风速</span>
                        <span class="detail-value">${data.wind}km/h</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-label">高低</span>
                        <span class="detail-value">${data.high}°/${data.low}°</span>
                    </div>
                </div>
            `;
        } else {
            weatherEl.innerHTML = `
                <div class="weather-top">
                    <div class="weather-location">
                        <span class="weather-city-icon">📍</span>
                        <span class="weather-city">杭州</span>
                    </div>
                    <div class="weather-date-block">
                        <span class="weather-date">${date}</span>
                        <span class="weather-week">${week}</span>
                    </div>
                </div>
                <div class="weather-main">
                    <span class="weather-icon-big">🌤️</span>
                    <div class="weather-temp-block">
                        <span class="weather-temp">--°</span>
                        <span class="weather-desc">加载中...</span>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail-item">
                        <span class="detail-label">体感</span>
                        <span class="detail-value">--°</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-label">湿度</span>
                        <span class="detail-value">--%</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-label">风速</span>
                        <span class="detail-value">--</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-label">高低</span>
                        <span class="detail-value">--°/--°</span>
                    </div>
                </div>
            `;
        }
    }

    async function fetchWeather() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);

            const res = await fetch('https://wttr.in/Hangzhou?format=j1&lang=zh', {
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!res.ok) throw new Error('请求失败');

            const data = await res.json();
            const current = data.current_condition[0];
            const today = data.weather[0];

            const weatherData = {
                city: '杭州',
                temp: current.temp_C,
                feelsLike: current.FeelsLikeC,
                humidity: current.humidity,
                wind: current.windspeedKmph,
                desc: current.weatherDesc[0].value,
                high: today.maxtempC,
                low: today.mintempC
            };

            renderWeather(weatherData);

        } catch (err) {
            console.warn('天气获取失败:', err.message);
            renderWeather(null);
        }
    }

    renderWeather(null);
    fetchWeather();
    setInterval(fetchWeather, 30 * 60 * 1000);

})();
