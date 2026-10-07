import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { Readable } from 'node:stream';
import { handleContact } from './contact.js';

const root = resolve('dist');
const counters = new Map();
const port = Number(process.env.PORT || 8787);
const env = { ...process.env, ALLOWED_ORIGINS:process.env.ALLOWED_ORIGINS || `http://127.0.0.1:${port},http://localhost:${port},http://127.0.0.1:3000,http://localhost:3000` };
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2' };
const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { res.writeHead(400).end(); return; }
  if (url.pathname === '/health') { res.setHeader('Cache-Control','no-store'); res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({status:'ok',mailConfigured:Boolean(env.RESEND_API_KEY && env.MAIL_FROM)})); return; }
  if (url.pathname === '/api/contact') {
    try {
      const request = new Request(url, { method:req.method, headers:req.headers, ...(['GET','HEAD'].includes(req.method) ? {} : { body:Readable.toWeb(req),duplex:'half' }) });
      const response = await handleContact(request, env, { limiter:async () => {
        const now = Date.now(), key = req.socket.remoteAddress;
        for (const [ip, counter] of counters) if (counter.until <= now) counters.delete(ip);
        let counter = counters.get(key);
        if (!counter) { counter = { count:0,until:now + 60000 }; counters.set(key,counter); }
        return ++counter.count <= 5;
      }});
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(await response.text());
    } catch { res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({ok:false,code:'INVALID_INPUT'})); }
    return;
  }
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  if (url.pathname.endsWith('/site-config.json')) { res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({contactEndpoint:'/api/contact'}));return; }
  let file;
  try { file = resolve(root,'.' + decodeURIComponent(url.pathname)); } catch { res.writeHead(400).end();return; }
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end();return; }
  if (url.pathname.endsWith('/')) file = resolve(file,'index.html');
  try { const bytes = await readFile(file);res.setHeader('Content-Type',mime[extname(file)] || 'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(req.method === 'HEAD' ? undefined : bytes); } catch { res.writeHead(404).end('Not found'); }
});
server.listen(port,'127.0.0.1',() => console.log(`Profile server listening on port ${port}; mail ${env.RESEND_API_KEY && env.MAIL_FROM ? 'configured' : 'not configured'}.`));
process.on('SIGTERM',() => server.close());
