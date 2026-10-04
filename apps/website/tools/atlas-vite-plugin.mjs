import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ATLAS_VERSION } from './atlas-route/atlas-contract.js';
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.geojson':'application/geo+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.pmtiles':'application/octet-stream','.md':'text/plain; charset=utf-8'};
export function createAtlasPreviewPlugin(websiteRoot) {
  const packet = path.resolve(websiteRoot, '../../work/website-atlas-r76-candidate2');
  return {
    name: 'wrn-separate-atlas-preview', apply:'serve',
    configureServer(server) {
      server.middlewares.use(async (req,res,next) => {
        let url;
        try { url = new URL(req.url, 'http://localhost'); } catch { return next(); }
        if (!url.pathname.startsWith('/atlas/') && url.pathname !== '/atlas') return next();
        if (!['GET','HEAD'].includes(req.method)) { res.statusCode=405;res.end();return; }
        if (url.pathname === '/atlas') {res.statusCode=308;res.setHeader('Location','/atlas/'+url.search);res.end();return;}
        try {
          const manifest = JSON.parse(await fs.readFile(path.join(packet,'atlas-package.manifest.json'),'utf8'));
          if (manifest.version !== ATLAS_VERSION || manifest.publicationPerformed !== false) throw Error('Atlas preview packet differs');
          const relative = url.pathname === '/atlas/' ? 'atlas/index.html' : url.pathname.slice(1);
          const allowed = manifest.files.find(entry => entry.path === relative && !entry.path.endsWith('.htaccess'));
          if (!allowed) {res.statusCode=404;res.end('Not found');return;}
          const bytes = await fs.readFile(path.join(packet,relative));
          if (bytes.length !== allowed.bytes || crypto.createHash('sha256').update(bytes).digest('hex') !== allowed.sha256) throw Error('Atlas preview file integrity differs');
          const policyPath = relative.startsWith('atlas/versions/') ? `atlas/versions/${ATLAS_VERSION}/.htaccess` : 'atlas/.htaccess';
          const policy = await fs.readFile(path.join(packet,policyPath),'utf8');
          for (const match of policy.matchAll(/^Header always set ([A-Za-z-]+) "([^"]*)"$/gm)) res.setHeader(match[1],match[2]);
          res.setHeader('Content-Type',mime[path.extname(relative)] || 'application/octet-stream');
          res.setHeader('Cache-Control','no-store');
          res.setHeader('X-Content-Type-Options','nosniff');
          res.setHeader('Referrer-Policy','same-origin');
          res.setHeader('Content-Length',bytes.length);
          res.end(req.method === 'HEAD' ? undefined : bytes);
        } catch(error) {res.statusCode=503;res.end('Atlas preview package unavailable');}
      });
    },
  };
}
