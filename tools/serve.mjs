// Máy chủ tĩnh tối giản cho xem thử: node tools/serve.mjs [thư-mục] (mặc định: gốc dự án)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', process.argv[2] || '.');
const firstPort = Number(process.env.PORT) || 5179;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Không tìm thấy'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(data);
  });
});

// Cổng đang bận (ví dụ đã có một bản npm run dev khác chạy) -> thử cổng kế tiếp, tối đa 20 lần
let port = firstPort;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && port < firstPort + 20) {
    console.log(`Cổng ${port} đang bận, thử cổng ${port + 1}...`);
    port += 1;
    server.listen(port);
  } else {
    console.error(err.message);
    process.exit(1);
  }
});
server.on('listening', () => console.log(`Thiệp đang chạy: http://localhost:${port}/  (xem trước khi chưa tới giờ: http://localhost:${port}/?preview)`));
server.listen(port);
