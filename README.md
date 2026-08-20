# LengMeng 个人科技风动态网站

> 纯前端静态个人网站，四时动态主题 + 粒子光影动画，部署于 Vercel

## 项目特性

- **四时自动换肤**：根据本地时间自动切换凌晨/上午/下午/夜晚四套科技主题
- **粒子背景**：Canvas 粒子连线系统，支持鼠标交互
- **全套动画**：加载动画、滚动入场、悬浮发光、主题过渡
- **暗黑模式**：独立切换，记忆用户偏好
- **实时天气**：自动获取本地天气（wttr.in 免费API）
- **动态语录**：首页随机展示科技风文案
- **访客统计**：本地持久化访问计数
- **背景音乐**：默认静音自动播放，支持手动开关
- **响应式**：适配手机/平板/桌面全设备
- **7个页面**：首页、关于我、项目作品、博客、日志、相册、联系我

## 目录结构

```
lengmeng-site/
├── index.html              # 首页
├── about.html              # 关于我
├── works.html              # 项目作品
├── blog.html               # 博客
├── log.html                # 日志
├── album.html              # 相册
├── contact.html            # 联系我
├── vercel.json             # Vercel 部署配置
├── README.md               # 说明文档
├── css/
│   ├── common.css          # 全局通用样式
│   ├── animate.css         # 动画库
│   ├── theme.css           # 四时主题
│   └── style.css           # 页面样式
├── js/
│   ├── theme.js            # 时序换肤
│   ├── animate.js          # 粒子+滚动+交互
│   ├── weather.js          # 实时天气
│   ├── music.js            # 背景音乐
│   ├── sentence.js         # 动态语录
│   ├── visitor.js          # 访客统计
│   ├── darkmode.js         # 暗黑模式
│   └── main.js             # 全局初始化
├── images/                 # 图片资源（自行添加）
└── music/                  # 音乐资源（自行添加 bgm.mp3）
```

## 本地运行

直接用浏览器打开 `index.html` 即可，或使用本地服务器：

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

然后访问 http://localhost:8080

## Vercel 部署

### 方式一：Git 部署（推荐）

1. 将项目推送到 GitHub/GitLab 仓库
2. 登录 [vercel.com](https://vercel.com)
3. 点击 "New Project" → 导入你的仓库
4. Framework Preset 选择 "Other"
5. 点击 "Deploy" 等待部署完成

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 自定义域名 lengmeng.online

1. Vercel 项目 → Settings → Domains → 添加 `lengmeng.online`
2. 在域名注册商处添加 DNS 解析：
   - **A 记录**：`@` → `76.76.21.21`
   - **CNAME 记录**：`www` → `cname.vercel-dns.com`
3. 等待 DNS 生效（通常几分钟到几小时）
4. Vercel 会自动签发 HTTPS 证书

## 自定义修改

- **修改个人信息**：编辑对应 HTML 文件中的文字内容
- **更换头像**：将图片放入 `images/` 目录，修改 HTML 中头像部分
- **更换音乐**：将 mp3 文件命名为 `bgm.mp3` 放入 `music/` 目录
- **修改语录**：编辑 `js/sentence.js` 中的 `SENTENCES` 数组
- **调整主题色**：编辑 `css/theme.css` 中的 CSS 变量
- **添加作品/博客**：在对应 HTML 中复制卡片结构修改内容

## 浏览器兼容

Chrome / Edge / Safari / Firefox / 微信内置浏览器

## License

MIT
