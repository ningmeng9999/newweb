# 新增一个页面

以「股票观察」页面 `watch.html` 为例，全程 4 步。

## 1. 生成页面骨架

```bash
npm run new watch "股票观察"
# 需要页面专属脚本时：
npm run new watch "股票观察" --js
```

会得到：
- `watch.html`：已带好 head、主题预置、加载层、侧边栏占位、脚本占位
- `assets/js/pages/watch.js`（可选）：会被自动挂载，无需改 HTML

## 2. 加导航

编辑 `templates/shell/sidebar.html`。一级菜单直接加：

```html
<li><a href="watch.html"><span class="nav-icon">◇</span><span class="nav-label">股票观察</span></a></li>
```

二级菜单加到某个 `has-submenu` 的 `<ul class="submenu">` 里即可。

> 当前页高亮、父级菜单自动展开都由 `assets/js/core/app.js` 按 URL 判定，不用手动写 `class="active"`。

## 3. 同步到所有页面

```bash
npm run sync
```

13 个页面的侧边栏和脚本清单会一次性更新。**只改侧边栏时不用动其他 HTML。**

## 4. 自检 + 预览

```bash
npm run check     # 语法、资源引用、重复 id、外壳同步
npm run dev       # http://localhost:4000
```

---

## 写页面内容时的常用类

| 类名 | 作用 |
| --- | --- |
| `main-container page-container` | 主内容区（已留出侧边栏宽度） |
| `page-header` / `page-title` / `page-desc` | 页头三件套 |
| `card` | 基础卡片（有发丝边、悬停浮起） |
| `tilt` + `spotlight` | 3D 倾斜 + 光斑跟随 |
| `reveal` | 滚动到视口时淡入 |
| `btn` / `btn-ghost` | 按钮 |

颜色请用变量：`var(--text-primary)`、`var(--text-secondary)`、`var(--border)`、`var(--accent)`、`var(--bg-elevated)`。
完整清单在 `assets/css/base.css` 顶部的 `:root`。

## 新增接口

1. 在 `api/` 下建文件，例如 `api/watch.js`：

```js
const { sendJson, handlePreflight } = require('./_lib/http');

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;
    return sendJson(res, 200, { ok: true, data: [] });
};
```

2. 前端直接 `fetch('/api/watch')`，**不要写 `.js`**，也不要写 `./api/watch`。
3. 需要读写 Redis 时 `require('./_lib/kv')`；需要调外部接口时用 `fetchJson()`（自带超时）。
4. 本地调试：`npm run dev` 已经把 `/api/*` 映射到 `api/*.js`，改完存盘刷新即可（新增文件需重启）。

## 页面专属样式

新建 `assets/css/pages/watch.css`，然后在 `watch.html` 的 `<head>` 里加一行：

```html
<link rel="stylesheet" href="./assets/css/pages/watch.css">
```

（这条不在同步范围内，`templates/page.html` 里已经留好注释位置。）
