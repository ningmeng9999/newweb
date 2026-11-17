# 项目架构

## 一句话

纯静态多页站点（13 个 HTML） + Vercel Functions 接口层，**零构建、零框架**，克隆下来 `npm run dev` 就能跑，推到 GitHub 由 Vercel 自动部署。

## 目录

```
lengmeng-site/
├── *.html                    13 个页面，直接部署在根目录
│                             保留 .html 后缀是为了 URL 稳定 + 本地双击可开
│
├── assets/                   所有静态资源
│   ├── css/
│   │   ├── base.css          设计令牌（颜色/字体/间距/断点）+ 重置 + 布局骨架
│   │   ├── theme.css         四时主题（凌晨/上午/下午/夜晚）× 纯黑模式
│   │   ├── components.css    组件层：卡片、按钮、导航、表单、弹窗……
│   │   ├── animations.css    动效层：入场、粒子、倾斜、过渡
│   │   └── pages/stock.css   单页样式，只被 stock.html 引用
│   ├── js/
│   │   ├── core/             每个页面都会加载
│   │   │   ├── theme.js      四时主题切换 + 手动覆盖
│   │   │   ├── effects.js    粒子、3D 倾斜、光斑、滚动进度、页面过渡
│   │   │   ├── app.js        加载层、导航状态、回顶、Toast、通用交互
│   │   │   └── mode.js       主题模式（跟随时间/纯黑/亮色）
│   │   ├── modules/          可选模块，按页面引入
│   │   │   ├── weather.js    侧边栏天气
│   │   │   ├── music.js      背景音开关
│   │   │   ├── sentence.js   打字机语录（首页）
│   │   │   └── visitor.js    访客计数
│   │   └── pages/            页面专属脚本，文件名 = 页面文件名时自动挂载
│   │       ├── anime.js
│   │       └── stock.js
│   ├── img/                  图片
│   └── audio/                音频（bgm.mp3 可选）
│
├── api/                      Vercel Functions，每个文件一个接口
│   ├── _lib/                 共享代码（下划线开头 → 不会被部署成接口）
│   │   ├── http.js           统一 JSON 响应 / CORS / 读 body / 带超时 fetch
│   │   ├── kv.js             Upstash Redis 读写封装
│   │   └── works-seed.js     作品兜底数据
│   ├── works.js              /api/works
│   ├── visitor.js            /api/visitor
│   ├── contact.js            /api/contact
│   ├── quote.js              /api/quote
│   ├── kline.js              /api/kline
│   ├── hot-stocks.js         /api/hot-stocks
│   ├── toutiao.js            /api/toutiao
│   ├── ocr-stock.js          /api/ocr-stock
│   ├── stock-sync.js         /api/stock-sync
│   └── shop-monitor.js       /api/shop-monitor（cron 每天 16:00）
│
├── templates/                源模板（不参与线上访问）
│   ├── shell/
│   │   ├── sidebar.html      全站唯一侧边栏
│   │   └── scripts.html      全站通用脚本清单（顺序敏感）
│   └── page.html             新页面骨架
│
├── scripts/
│   ├── dev-server.mjs        本地服务器 + 接口调试（npm run dev）
│   ├── sync-shell.mjs        把模板写进 13 个页面（npm run sync）
│   ├── new-page.mjs          新建页面脚手架（npm run new）
│   └── check.mjs             自检（npm run check，CI 也跑）
│
├── docs/                     架构 / 加页面 / 部署
├── vercel.json               cleanUrls、缓存与安全响应头、cron
└── .github/workflows/ci.yml  推上去自动跑自检
```

## 三条约定

**1. 侧边栏只有一份。**
改导航只改 `templates/shell/sidebar.html`，然后 `npm run sync` 写回 13 个页面。
页面里被 `<!-- shell:sidebar:start -->` / `<!-- shell:sidebar:end -->` 包住的部分，**不要手改**，下次同步会被覆盖。

**2. 脚本清单也只有一份。**
`templates/shell/scripts.html` 定义通用脚本与加载顺序。页面专属脚本不需要手动加 `<script>`：只要在 `assets/js/pages/` 放一个和页面同名的文件（例如 `stock.html` ↔ `assets/js/pages/stock.js`），同步时会自动挂到最后。

**3. 接口的公共逻辑放 `api/_lib/`。**
Vercel 会把 `api/` 下每个文件当成一个函数，但 **下划线开头的文件/目录会被忽略**，所以共享代码必须放在 `_lib/`，否则会多出一个废接口。

## 数据流

```
浏览器
  ├─ 静态页面（HTML/CSS/JS，Vercel CDN）
  └─ fetch('/api/xxx')
        └─ Vercel Function（api/xxx.js）
              ├─ Upstash Redis（作品、访客数、自选股、笔记）
              └─ 第三方（东方财富/新浪/热点源/大模型/SMTP）
```

所有接口都做了**降级**：没配 KV 就用 localStorage，没配 SMTP 就调起本地邮件客户端，第三方挂了就返回兜底数据。所以本地不配任何环境变量也能完整浏览。

## 样式分层规则

| 文件 | 只放什么 | 不该出现 |
| --- | --- | --- |
| `base.css` | `:root` 变量、重置、栅格、通用排版 | 具体组件样式 |
| `theme.css` | `[data-theme]` / `[data-dark]` 下的变量覆写 | 布局 |
| `components.css` | 类名驱动的组件（`.card`、`.btn`…） | 页面专属布局 |
| `animations.css` | `@keyframes`、`.reveal`、过渡 | 静态样式 |
| `pages/*.css` | 单页专用 | 能复用的东西 |

颜色一律用变量（`var(--text-primary)`、`var(--accent)`…），不要在页面里写死十六进制色值 —— 否则换主题时那一块不会跟着变。
