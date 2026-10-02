import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('site');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.md': 'text/plain' };

createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const path = resolve(root, `.${decodeURIComponent(pathname === '/' ? '/index.html' : pathname)}`);
  if (!path.startsWith(root + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const contents = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }).end(contents);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Project guide: http://127.0.0.1:${port}`));
