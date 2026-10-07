import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
/** Website-only built-server harness. No Mobile server, build or source writes. */
export default async function setup() {
  const root = path.resolve('apps/website/dist');
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname);
      const relative =
        pathname === '/'
          ? 'index.html'
          : pathname.endsWith('/')
            ? pathname.slice(1) + 'index.html'
            : pathname.slice(1);
      const file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep) || !(await stat(file)).isFile()) throw Error('missing');
      const mime = file.endsWith('.html')
        ? 'text/html'
        : file.endsWith('.js')
          ? 'text/javascript'
          : file.endsWith('.css')
            ? 'text/css'
            : file.endsWith('.json')
              ? 'application/json'
              : file.endsWith('.png')
                ? 'image/png'
                : file.endsWith('.webp')
                  ? 'image/webp'
                  : file.endsWith('.xml')
                    ? 'application/xml'
                    : 'text/plain';
      res.writeHead(200, {
        'content-type':
          mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml'
            ? `${mime}; charset=utf-8`
            : mime,
        'cache-control': 'no-store',
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(43178, '127.0.0.1', resolve);
  });
  return async () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
}
