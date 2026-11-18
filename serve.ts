// Tiny dev server: serves the game/ folder on http://localhost:8080 so the
// game can be played in a browser while developing. Not part of the grader
// contract — the entrypoint is main.ts. Run with: node serve.ts

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const PORT = Number(process.env.PORT ?? 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function safePath(url) {
  let p = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  if (p === '/') p = '/index.html';
  const full = normalize(join(ROOT, p));
  if (!full.startsWith(ROOT + '/') && full !== ROOT) return null; // no escaping the game dir
  return full;
}

const server = createServer(async (req, res) => {
  try {
    const file = safePath(req.url);
    if (!file) return send(res, 404, 'Not found');
    const st = await stat(file);
    if (!st.isFile()) return send(res, 404, 'Not found');
    const body = await readFile(file);
    const type = TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length, 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    send(res, 404, 'Not found');
  }
});

function send(res, code, text) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

server.listen(PORT, () => console.log(`neon-swarm dev server: http://localhost:${PORT}`));
process.on('SIGINT', () => server.close(() => process.exit(0)));