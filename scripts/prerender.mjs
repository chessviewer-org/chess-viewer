import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4178;

const ROUTES = ['/', '/advanced-fen', '/about', '/fen-history', '/export'];

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let filePath = join(DIST, urlPath);
      if (urlPath.endsWith('/')) filePath = join(filePath, 'index.html');
      if (!existsSync(filePath) || extname(filePath) === '') {
        filePath = join(DIST, 'index.html');
      }
      const body = await readFile(filePath);
      const mime = extname(filePath);
      res.writeHead(200, {
        'Content-Type':
          mime === '.html' ? 'text/html; charset=utf-8' :
          mime === '.js' || mime === '.mjs' ? 'text/javascript; charset=utf-8' :
          mime === '.css' ? 'text/css; charset=utf-8' :
          mime === '.json' ? 'application/json' :
          mime === '.svg' ? 'image/svg+xml' :
          mime === '.png' ? 'image/png' :
          mime === '.jpg' || mime === '.jpeg' ? 'image/jpeg' :
          mime === '.ico' ? 'image/x-icon' :
          mime === '.webp' ? 'image/webp' :
          mime === '.woff' ? 'font/woff' :
          mime === '.woff2' ? 'font/woff2' :
          mime === '.txt' ? 'text/plain; charset=utf-8' :
          mime === '.xml' ? 'application/xml' :
          mime === '.webmanifest' ? 'application/manifest+json' :
          'application/octet-stream'
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function prerender() {
  if (!existsSync(join(DIST, 'index.html'))) {
    throw new Error('dist/index.html not found — run `vite build` first.');
  }

  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000
      });

      await page.waitForSelector('html.app-ready', { timeout: 30_000 });
      await page.waitForSelector('nav', { timeout: 30_000 });
      await page.waitForFunction(
        () => document.querySelector('main')?.children.length > 0,
        { timeout: 30_000 }
      );
      await new Promise((r) => setTimeout(r, 500));

      let html = await page.content();
      html = html.replaceAll(`http://localhost:${PORT}`, '');
      html = html.replace(/<!--\s*prerender:strip:start\s*-->[\s\S]*?<!--\s*prerender:strip:end\s*-->/g, '');

      let seenTitle = false;
      html = html.replace(/<title>[\s\S]*?<\/title>/g, (match) => (seenTitle ? '' : (seenTitle = true, match)));
      html = html.replace(/<div id="app-splash"[\s\S]*?<\/div>\s*<\/div>/, '');

      const outDir = route === '/' ? DIST : join(DIST, route.replace(/^\//, ''));
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, 'index.html'), html, 'utf-8');

      console.log(`  prerendered ${route}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
