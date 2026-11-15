# LengMeng 个人站点

> 纯静态多页 + Vercel Functions，零构建，改一处同步全站。

## 快速开始

```bash
npm install          # 只有 api 侧用到依赖；只看页面可跳过
npm run dev          # http://localhost:4000
```

部署只需把仓库连到 Vercel，无需 build 命令。详细步骤见 [docs/deploy.md](docs/deploy.md)。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地预览（含 `/api/*` 接口调试，自动加载 `.env`） |
| `npm run sync` | 把侧边栏 / 脚本模板同步进 13 个页面 |
| `npm run new <名字> "<标题>" [--js]` | 新建页面骨架 |
| `npm run check` | 自检：语法、资源引用、重复 id、外壳同步 |
| `npm run push` | 提交并推送到 GitHub（Vercel 自动部署） |

## 目录

```
*.html                13 个页面（URL 不带目录，保持链接稳定）
assets/css/           基础 / 主题 / 组件 / 动效 + pages/ 单页样式
assets/js/core/       主题、特效、通用交互、纯黑模式
assets/js/modules/    天气、音乐、语录、访客数
assets/js/pages/      页面专属脚本（与页面同名即自动挂载）
assets/img/ audio/    图片与音频
api/                  Vercel 接口，_lib/ 放共享代码
templates/shell/      侧边栏与脚本清单的唯一来源
scripts/              本地服务器、同步器、脚手架、自检
docs/                 架构、加页面、部署
```

完整说明见 [docs/architecture.md](docs/architecture.md)。

## 改东西之前先看这三条

1. **导航只改 `templates/shell/sidebar.html`**，然后 `npm run sync`。页面里 `shell:sidebar` 标记之间的内容不要手改。
2. **页面专属 JS 放 `assets/js/pages/<页面名>.js`**，会被自动引入，不用改 HTML。
3. **接口公共代码放 `api/_lib/`**（下划线开头，Vercel 不会把它当接口部署）。

## 功能

- 四时色温（凌晨冷蓝 / 上午石墨 / 下午暖灰 / 夜晚墨黑）+ 纯黑模式
- 粒子尘埃、卡片 3D 倾斜 + 光斑、打字机语录、滚动进度、页面过渡、磁性按钮
- 实时天气、背景音开关、访客统计
- 作品库（云端可增删）、相册、动漫清单、在线音乐、股票行情与持仓笔记、菜谱、财经新闻、AI 漫剧工坊、RPA 工具集
- 联系表单（SMTP 发信，未配置时回退邮件客户端）
- 接口全部具备降级路径：没有 KV / SMTP / 第三方服务时页面依然可用

## 性能

- 加载遮罩在 DOM 就绪后立即撤下（≤900ms 兜底），不等图片和 iframe
- 全站图片已压缩为 WebP 并本地化，不再依赖 picsum.photos 等外部图床
- 需要外部的页面（股票行情、热点新闻）加了 `preconnect` 预热
- 本地 `npm run dev` 与线上一样走 gzip，预览速度即线上速度

## 环境变量

复制 `.env.example` 为 `.env` 本地填写；线上在 Vercel 项目里配置同名变量。全部可选，不配也能正常浏览。
