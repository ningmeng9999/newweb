/**
 * anime.js - 动漫推荐页面
 * 策略：先立即渲染备用数据确保页面不为空，再异步尝试 AniList 真实数据
 */

(function () {
    'use strict';

    var grid = document.getElementById('animeGrid');
    if (!grid) {
        console.error('[anime] #animeGrid not found');
        return;
    }

    var API = 'https://graphql.anilist.co';

    var QUERY = 'query ($sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus) { Page(perPage: 12) { media(sort: $sort, type: ANIME, season: $season, seasonYear: $seasonYear, status: $status) { id title { romaji english native } coverImage { large color } averageScore genres description episodes season seasonYear status siteUrl } } }';

    function currentSeason() {
        var m = new Date().getMonth() + 1;
        if (m <= 2 || m === 12) return 'WINTER';
        if (m <= 5) return 'SPRING';
        if (m <= 8) return 'SUMMER';
        return 'FALL';
    }

    var SEASON_CN = { WINTER: '冬', SPRING: '春', SUMMER: '夏', FALL: '秋' };
    var STATUS_CN = { FINISHED: '已完结', RELEASING: '连载中', NOT_YET_RELEASED: '未开播', CANCELLED: '已取消', HIATUS: '停更' };

    var FILTERS = {
        all: { sort: ['POPULARITY_DESC'] },
        trending: { sort: ['TRENDING_DESC'] },
        top: { sort: ['SCORE_DESC'] },
        season: { sort: ['POPULARITY_DESC'], season: currentSeason(), seasonYear: new Date().getFullYear() },
        upcoming: { sort: ['POPULARITY_DESC'], status: 'NOT_YET_RELEASED' }
    };

    // 备用数据 - 日漫热门
    var FALLBACK = [
        { title: { native: '进击的巨人 最终季', english: 'Attack on Titan' }, cover: 'https://picsum.photos/seed/aot/400/560', color: '#8B4513', score: 87, genres: ['Action', 'Drama', 'Fantasy'], eps: 28, status: '已完结', url: 'https://anilist.co/anime/110277' },
        { title: { native: '鬼灭之刃', english: 'Demon Slayer' }, cover: 'https://picsum.photos/seed/demon/400/560', color: '#228B22', score: 86, genres: ['Action', 'Supernatural'], eps: 26, status: '已完结', url: 'https://anilist.co/anime/101922' },
        { title: { native: '咒术回战', english: 'Jujutsu Kaisen' }, cover: 'https://picsum.photos/seed/jjk/400/560', color: '#4B0082', score: 85, genres: ['Action', 'Supernatural'], eps: 24, status: '已完结', url: 'https://anilist.co/anime/113415' },
        { title: { native: '间谍过家家', english: 'SPY x FAMILY' }, cover: 'https://picsum.photos/seed/spy/400/560', color: '#FF6347', score: 84, genres: ['Action', 'Comedy'], eps: 25, status: '连载中', url: 'https://anilist.co/anime/140968' },
        { title: { native: '葬送的芙莉莲', english: 'Frieren' }, cover: 'https://picsum.photos/seed/frieren/400/560', color: '#9370DB', score: 89, genres: ['Adventure', 'Drama', 'Fantasy'], eps: 28, status: '已完结', url: 'https://anilist.co/anime/154587' },
        { title: { native: '我推的孩子', english: 'Oshi no Ko' }, cover: 'https://picsum.photos/seed/oshi/400/560', color: '#FF69B4', score: 83, genres: ['Drama', 'Supernatural'], eps: 11, status: '已完结', url: 'https://anilist.co/anime/150672' },
        { title: { native: '孤独摇滚', english: 'Bocchi the Rock!' }, cover: 'https://picsum.photos/seed/bocchi/400/560', color: '#FFB6C1', score: 85, genres: ['Comedy', 'Music'], eps: 12, status: '已完结', url: 'https://anilist.co/anime/148821' },
        { title: { native: '赛博朋克：边缘行者', english: 'Cyberpunk' }, cover: 'https://picsum.photos/seed/cyber/400/560', color: '#FFD700', score: 86, genres: ['Action', 'Sci-Fi'], eps: 10, status: '已完结', url: 'https://anilist.co/anime/136831' },
        { title: { native: '链锯人', english: 'Chainsaw Man' }, cover: 'https://picsum.photos/seed/csm/400/560', color: '#DC143C', score: 82, genres: ['Action', 'Horror'], eps: 12, status: '已完结', url: 'https://anilist.co/anime/127230' },
        { title: { native: '药屋少女的呢喃', english: 'Apothecary' }, cover: 'https://picsum.photos/seed/kusuri/400/560', color: '#20B2AA', score: 84, genres: ['Drama', 'Mystery'], eps: 24, status: '已完结', url: 'https://anilist.co/anime/156050' },
        { title: { native: '迷宫饭', english: 'Dungeon Meshi' }, cover: 'https://picsum.photos/seed/dungeon/400/560', color: '#DAA520', score: 83, genres: ['Adventure', 'Comedy', 'Fantasy'], eps: 24, status: '已完结', url: 'https://anilist.co/anime/152422' },
        { title: { native: '败犬女主太多了', english: 'Makeine' }, cover: 'https://picsum.photos/seed/makeine/400/560', color: '#87CEEB', score: 78, genres: ['Comedy', 'Romance'], eps: 12, status: '已完结', url: 'https://anilist.co/anime/163134' }
    ];

    // 国产动漫数据
    var GUOCHUANG = [
        { title: { native: '仙逆' }, cover: 'https://picsum.photos/seed/xianni/400/560', color: '#4169E1', score: 82, genres: ['修仙', '热血', '玄幻'], eps: '更新中', status: '连载中', url: 'https://www.bilibili.com/bangumi/media/md28234567' },
        { title: { native: '牧神记' }, cover: 'https://picsum.photos/seed/mushenji/400/560', color: '#2E8B57', score: 80, genres: ['修仙', '热血', '东方玄幻'], eps: '更新中', status: '连载中', url: 'https://www.bilibili.com/bangumi/media/md28235678' },
        { title: { native: '吞噬星空' }, cover: 'https://picsum.photos/seed/tunshi/400/560', color: '#4682B4', score: 78, genres: ['科幻', '热血', '进化'], eps: '更新中', status: '连载中', url: 'https://v.qq.com/x/cover/mzc00200mp8v9a.html' },
        { title: { native: '一念永恒' }, cover: 'https://picsum.photos/seed/yinian/400/560', color: '#6A5ACD', score: 79, genres: ['修仙', '搞笑', '热血'], eps: '更新中', status: '连载中', url: 'https://v.qq.com/x/cover/mzc00200mp8v9b.html' },
        { title: { native: '凡人修仙传' }, cover: 'https://picsum.photos/seed/fanren/400/560', color: '#556B2F', score: 85, genres: ['修仙', '热血', '经典'], eps: '更新中', status: '连载中', url: 'https://www.bilibili.com/bangumi/media/md28229138' },
        { title: { native: '斗罗大陆' }, cover: 'https://picsum.photos/seed/douluo/400/560', color: '#B8860B', score: 75, genres: ['玄幻', '热血', '战斗'], eps: '更新中', status: '连载中', url: 'https://v.qq.com/x/cover/mzc00200mp8v9c.html' },
        { title: { native: '斗破苍穹' }, cover: 'https://picsum.photos/seed/doupo/400/560', color: '#CD853F', score: 77, genres: ['玄幻', '热血', '战斗'], eps: '更新中', status: '连载中', url: 'https://v.qq.com/x/cover/mzc00200mp8v9d.html' },
        { title: { native: '完美世界' }, cover: 'https://picsum.photos/seed/wanmei/400/560', color: '#DAA520', score: 76, genres: ['玄幻', '热血', '修仙'], eps: '更新中', status: '连载中', url: 'https://v.qq.com/x/cover/mzc00200mp8v9e.html' },
        { title: { native: '遮天' }, cover: 'https://picsum.photos/seed/zetian/400/560', color: '#2F4F4F', score: 80, genres: ['玄幻', '热血', '修仙'], eps: '更新中', status: '连载中', url: 'https://www.bilibili.com/bangumi/media/md28236789' },
        { title: { native: '剑来' }, cover: 'https://picsum.photos/seed/jianlai/400/560', color: '#708090', score: 81, genres: ['武侠', '修仙', '文艺'], eps: '更新中', status: '连载中', url: 'https://www.bilibili.com/bangumi/media/md28237890' },
        { title: { native: '沧元图' }, cover: 'https://picsum.photos/seed/cangyuan/400/560', color: '#008B8B', score: 79, genres: ['玄幻', '热血', '战斗'], eps: '更新中', status: '连载中', url: 'https://www.bilibili.com/bangumi/media/md28238901' },
        { title: { native: '灵笼' }, cover: 'https://picsum.photos/seed/linglong/400/560', color: '#696969', score: 84, genres: ['科幻', '末日', '热血'], eps: 16, status: '已完结', url: 'https://www.bilibili.com/bangumi/media/md28223020' }
    ];

    function getTitle(t) {
        return t.native || t.english || t.romaji || '未知';
    }

    function stripHtml(s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.innerHTML = s;
        return d.textContent || '';
    }

    function cut(s, n) {
        return s && s.length > n ? s.slice(0, n) + '...' : (s || '暂无简介');
    }

    function render(list, isFallback) {
        if (!list || !list.length) {
            grid.innerHTML = '<div class="anime-loading">暂无数据</div>';
            return;
        }
        var tag = isFallback ? '<span style="font-size:0.7rem;opacity:0.5;margin-left:0.5rem">备用数据</span>' : '';
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var a = list[i];
            var title = a.title ? getTitle(a.title) : (a.name || '未知');
            var score = a.averageScore || a.score || '--';
            if (score !== '--') score = score + '%';
            var status = a.status ? (STATUS_CN[a.status] || a.status) : '';
            var season = a.season ? SEASON_CN[a.season] + ' ' + (a.seasonYear || '') : '';
            var eps = a.episodes || a.eps || '未知';
            if (eps !== '未知') eps = eps + '集';
            var genres = (a.genres || []).slice(0, 3).map(function (g) {
                return '<span class="anime-tag">' + g + '</span>';
            }).join('');
            var cover = a.coverImage ? (a.coverImage.large || '') : (a.cover || '');
            var color = a.coverImage ? (a.coverImage.color || 'var(--accent)') : (a.color || 'var(--accent)');
            var url = a.siteUrl || a.url || '#';
            var desc = cut(stripHtml(a.description), 80);
            html += '<a href="' + url + '" target="_blank" class="anime-card" style="--accent-color:' + color + '">' +
                '<div class="anime-cover">' +
                    (cover ? '<img src="' + cover + '" alt="' + title + '" loading="lazy">' : '<div class="anime-cover-placeholder">📺</div>') +
                    '<div class="anime-score">' + score + '</div>' +
                    (status ? '<div class="anime-status">' + status + '</div>' : '') +
                '</div>' +
                '<div class="anime-info">' +
                    '<h3 class="anime-title">' + title + '</h3>' +
                    '<div class="anime-meta"><span>' + season + '</span><span>·</span><span>' + eps + '</span></div>' +
                    '<div class="anime-tags">' + genres + '</div>' +
                    '<p class="anime-desc">' + desc + '</p>' +
                '</div>' +
            '</a>';
        }
        grid.innerHTML = html;
    }

    // 立即渲染备用数据，确保页面不为空
    render(FALLBACK, true);

    // 异步尝试加载真实数据
    function load(filterKey) {
        var key = filterKey || 'all';
        // 国产动漫直接显示内置数据
        if (key === 'guochuang') {
            render(GUOCHUANG, true);
            return;
        }
        var vars = FILTERS[key] || FILTERS.all;
        try {
            var controller = new AbortController();
            var timer = setTimeout(function () { controller.abort(); }, 12000);
            fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ query: QUERY, variables: vars }),
                signal: controller.signal
            }).then(function (res) {
                clearTimeout(timer);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            }).then(function (json) {
                if (json.errors) throw new Error(json.errors[0].message);
                var list = json.data && json.data.Page && json.data.Page.media ? json.data.Page.media : [];
                if (list.length) {
                    render(list, false);
                }
            }).catch(function (e) {
                clearTimeout(timer);
                console.warn('[anime] API failed, using fallback:', e.message);
                // 保持备用数据
            });
        } catch (e) {
            console.warn('[anime] load error:', e.message);
        }
    }

    // 绑定筛选按钮
    var btns = document.querySelectorAll('.anime-filter-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function () {
            for (var j = 0; j < btns.length; j++) btns[j].classList.remove('active');
            this.classList.add('active');
            load(this.dataset.filter);
        });
    }

    // 延迟加载真实数据（让页面先渲染备用数据）
    setTimeout(function () { load('all'); }, 300);
})();
