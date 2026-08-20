// 本地测试服务器 - 模拟Vercel Serverless Function环境
// 运行: node local-server.js
// 访问: http://localhost:3000/stock.html
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const ROOT = __dirname;

// MIME类型
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

// 加载Vercel Serverless Function
const stockHandler = require('./api/stock.js');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API路由
    if (pathname === '/api/stock') {
        req.query = parsedUrl.query;
        console.log('[API] 请求 /api/stock, page=' + (parsedUrl.query.page || 1) + ', size=' + (parsedUrl.query.size || 100));
        try {
            stockHandler(req, res);
        } catch (e) {
            console.error('[API] 错误:', e.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 静态文件
    let filePath = path.join(ROOT, pathname === '/' ? '/index.html' : pathname);

    // 安全检查：防止路径遍历
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Not Found: ' + pathname);
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log('========================================');
    console.log('  本地测试服务器已启动');
    console.log('  端口: ' + PORT);
    console.log('  首页: http://localhost:' + PORT + '/');
    console.log('  股票页: http://localhost:' + PORT + '/stock.html');
    console.log('  API测试: http://localhost:' + PORT + '/api/stock?page=1&size=3');
    console.log('  按 Ctrl+C 停止');
    console.log('========================================');
});
