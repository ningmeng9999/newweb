# 部署：GitHub + Vercel

## 前提

- GitHub 账号、Vercel 账号（用 GitHub 登录最省事）
- 本地已装 Node 18+ 和 Git

---

## 一、推到 GitHub

### 方式 A：网页建仓 + 本地推送（最稳）

1. GitHub 右上角 **New repository** → 仓库名 `lengmeng-site` → **Private 或 Public 都行** → 不要勾选 README/.gitignore（本地已有）→ Create。
2. 本地执行（把 `<你的用户名>` 换成实际的）：

```bash
git remote add origin https://github.com/<你的用户名>/lengmeng-site.git
git branch -M main
git push -u origin main
```

第一次推送会弹出浏览器登录 GitHub，按提示授权即可。
如果提示 `remote origin already exists`，先 `git remote remove origin` 再执行上面的命令。

### 方式 B：装 GitHub CLI（以后提交更方便）

```bash
winget install --id GitHub.cli
gh auth login          # 选 GitHub.com → HTTPS → 浏览器登录
gh repo create lengmeng-site --private --source=. --remote=origin --push
```

---

## 二、接到 Vercel

1. 打开 [vercel.com/new](https://vercel.com/new) → 选 **Import Git Repository** → 授权并选中 `lengmeng-site`。
2. 配置项全部保持默认：
   - **Framework Preset**：`Other`
   - **Build Command**：留空
   - **Output Directory**：留空
   - **Root Directory**：`./`
3. 点 **Deploy**。约 30 秒后拿到 `https://lengmeng-site-xxx.vercel.app`。
4. 之后每次 `git push`，Vercel 自动重新部署；PR 还会生成预览地址。

> 项目是纯静态 + `api/` 函数，不需要 build 步骤，也不产出 `dist/`。如果 Vercel 提示 "No Output Directory named dist"，说明 Build Command 被误填了，清空即可。

---

## 三、环境变量（按需，不配也能跑）

Vercel 项目 → **Settings → Environment Variables**，键名参考 `.env.example`。

| 变量 | 作用 | 不配的后果 |
| --- | --- | --- |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | 作品库、访客数、自选股、持仓笔记的云端存储 | 全部退化为 localStorage，作品页只读 |
| `SMTP_USER` / `SMTP_PASS` / `CONTACT_TO` | 首页联系表单真实发信 | 点击发送时改为调起本地邮件客户端 |
| `WORKS_DELETE_PASSWORD` | 作品删除口令 | 使用代码里的默认口令（建议设置） |
| `NOTE_PASSWORD` | 清空持仓笔记口令 | 同上 |
| `ZHIPU_API_KEY` / `DASHSCOPE_API_KEY` / `OPENAI_API_KEY` | 持仓截图识别 | 接口返回 503，页面提示未配置 |
| `SP_API_*` / `AWS_*` / `EMAIL_*` | 店铺监控 cron | cron 会执行但直接跳过 |

### 接 Upstash（推荐）

Vercel 项目 → **Storage** → **Create Database** → 选 **Upstash Redis**（免费额度够个人站用）→ Connect。
连接后 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 会自动注入，无需手填。

> ⚠️ 上一版代码里硬编码过 Upstash token，现已全部移除。如果那个数据库还在用，请到 Upstash 控制台 **Rotate Token**，然后把新值填进 Vercel 环境变量。

改完环境变量需要 **Redeploy** 才生效（Deployments → 最新一条 → ⋯ → Redeploy）。

---

## 四、绑定域名（可选）

1. Vercel 项目 → **Settings → Domains** → 填 `lengmeng.online`。
2. 按提示到域名商加记录：
   - 根域名 `@` → `A 76.76.21.21`
   - `www` → `CNAME cname.vercel-dns.com`
3. 生效后 Vercel 自动签发 HTTPS。

绑定后记得把 `sitemap.xml`、`robots.txt`、页面里的 `canonical` 换成新域名。

---

## 五、常见问题

**部署成功但接口 404**
`api/` 必须在仓库根目录，不能挪进 `assets/`。文件名即路由：`api/works.js` → `/api/works`。

**接口返回 FUNCTION_INVOCATION_FAILED**
多半是 `api/_lib/` 里的共享文件被当成了接口。确认共享文件都在 `_lib/`（下划线开头）里。

**页面样式没更新**
Vercel CDN 有缓存。`assets` 下的 CSS/JS 设了 1 小时缓存 + must-revalidate，通常刷新即可；顽固时强制刷新（Ctrl/Cmd + Shift + R）。

**cron 没跑**
`vercel.json` 里的 cron 只有**生产环境**生效（预览环境不跑），且 Hobby 套餐每天只允许 1 次、时间有 ±1 小时漂移。
