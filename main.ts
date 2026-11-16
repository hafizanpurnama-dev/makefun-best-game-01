/**
 * Star Vanguard — Simple HTTP server for the space shooter game.
 * Run with: node --experimental-strip-types main.ts
 * Or: npx tsx main.ts
 *
 * Serves index.html and static assets from the current directory.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';

const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT = process.cwd();

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const server = createServer(async (req, res) => {
  try {
    let url = req.url || '/';
    // Sanitize path
    if (url.includes('..')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (url === '/') url = '/index.html';

    const filePath = join(ROOT, url);
    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Star Vanguard server running at http://localhost:${PORT}`);
  console.log(`   Open http://localhost:${PORT} in your browser to play.`);
});