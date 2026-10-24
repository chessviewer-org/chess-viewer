import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

import { PRERENDERED_ROUTES } from './prerendered-routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4178;

function staticAsset(urlPath) {
  const filePath = resolve(DIST, `.${urlPath}`);
  if (!filePath.startsWith(DIST + sep)) return null;
  const ext = extname(filePath);
  return ext && ext !== '.html' && existsSync(filePath) ? filePath : null;
}

function startServer(template) {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
      const filePath = staticAsset(urlPath);
      const body = filePath ? await readFile(filePath) : template;
      const mime = filePath ? extname(filePath) : '.html';
      res.writeHead(200, {
        'Content-Type':
          mime === '.html'
            ? 'text/html; charset=utf-8'
            : mime === '.js' || mime === '.mjs'
              ? 'text/javascript; charset=utf-8'
              : mime === '.css'
                ? 'text/css; charset=utf-8'
                : mime === '.json'
                  ? 'application/json'
                  : mime === '.svg'
                    ? 'image/svg+xml'
                    : mime === '.png'
                      ? 'image/png'
                      : mime === '.jpg' || mime === '.jpeg'
                        ? 'image/jpeg'
                        : mime === '.ico'
                          ? 'image/x-icon'
                          : mime === '.webp'
                            ? 'image/webp'
                            : mime === '.woff'
                              ? 'font/woff'
                              : mime === '.woff2'
                                ? 'font/woff2'
                                : mime === '.txt'
                                  ? 'text/plain; charset=utf-8'
                                  : mime === '.xml'
                                    ? 'application/xml'
                                    : mime === '.webmanifest'
                                      ? 'application/manifest+json'
                                      : 'application/octet-stream'
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

  const template = await readFile(join(DIST, 'index.html'));
  if (template.includes('data-prerendered-route=')) {
    throw new Error(
      'dist/index.html is already prerendered — run `vite build` first.'
    );
  }

  const server = await startServer(template);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const route of PRERENDERED_ROUTES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
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
      await page.waitForNetworkIdle({ idleTime: 300, timeout: 30_000 });

      await page.evaluate(() => {
        window.dispatchEvent(new Event('pagehide'));
        const snapshot = sessionStorage.getItem('cv_page_snapshot');
        if (!snapshot) throw new Error('page snapshot was not saved');
        const { html, pieces } = JSON.parse(snapshot);
        document.getElementById('root').innerHTML = html;
        if (Object.keys(pieces).length > 0) {
          const sources = document.createElement('script');
          sources.type = 'application/json';
          sources.id = 'cv-piece-sources';
          sources.textContent = JSON.stringify({ pieces }).replaceAll(
            '<',
            '\\u003c'
          );
          document.body.append(sources);
        }
        sessionStorage.clear();
        return new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        );
      });
      await page.evaluate(() => {
        const root = document.documentElement;
        root.style.removeProperty('--navbar-height');
        if (!root.getAttribute('style')) root.removeAttribute('style');
      });

      let html = await page.content();
      html = html.replaceAll(`http://localhost:${PORT}`, '');
      html = html.replace(
        /<!--\s*prerender:strip:start\s*-->[\s\S]*?<!--\s*prerender:strip:end\s*-->/g,
        ''
      );
      html = html.replace(
        /<html([^>]*)>/,
        (_match, attrs) =>
          `<html${attrs.replace(/\s*data-prerendered-route="[^"]*"/g, '')} data-prerendered-route="${route}">`
      );

      let seenTitle = false;
      html = html.replace(/<title>[\s\S]*?<\/title>/g, (match) =>
        seenTitle ? '' : ((seenTitle = true), match)
      );

      const outFile =
        route === '/'
          ? join(DIST, 'index.html')
          : join(DIST, `${route.slice(1)}.html`);
      await mkdir(dirname(outFile), { recursive: true });
      await writeFile(outFile, html, 'utf-8');

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
