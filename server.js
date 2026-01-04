const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const rootDir = __dirname; // 从项目根目录提供服务

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // 默认路由到 src/index.html
    let filePath;
    if (req.url === '/') {
        filePath = path.join(rootDir, 'src', 'index.html');
    } else if (req.url.startsWith('/src/') || req.url.endsWith('.html')) {
        // HTML 文件从 src 目录提供
        filePath = path.join(rootDir, req.url.startsWith('/src/') ? req.url : 'src' + req.url);
    } else {
        // 其他文件从根目录提供（包括 pingtan 文件夹）
        filePath = path.join(rootDir, req.url);
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`404 - File not found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                console.log(`500 - Server error: ${error.code}`);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log(`Serving files from: ${rootDir}`);
    console.log(`HTML files from: ${path.join(rootDir, 'src')}`);
    console.log(`Data files from: ${path.join(rootDir, 'pingtan')}`);
});
