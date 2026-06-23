/**
 * Post-build static prerenderer.
 *
 * ChessVision is a Vite SPA: react-helmet-async only writes its <title>, meta,
 * Open Graph, and Twitter tags AFTER JavaScript runs. Non-JS social crawlers
 * (Twitter, Facebook, LinkedIn, WhatsApp, Slack) and, to a lesser degree,
 * search engines therefore see only the static index.html fallbacks — every
 * route looks like the home page.
 *
 * This script fixes that without any SSR refactor: it serves the freshly built
 * `dist/`, drives a headless browser to each indexable route, waits for the
 * app's existing `html.app-ready` signal (set in src/App.tsx), snapshots the
 * fully-rendered DOM — with the correct per-route helmet tags baked in — and
 * writes it to `dist/<route>/index.html`. nginx's `try_files` then serves the
 * matching snapshot to crawlers and the live SPA hydrates over it for users.
 *
 * Puppeteer lives in devDependencies only — it never enters the runtime bundle.
 * Run automatically after `vite build` via the `build` npm script.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4178;

// Routes to snapshot for static HTML / sitemap. `/settings` is intentionally
// excluded (private/noindex); `/` already has the static fallbacks but we
// re-snapshot it so its JSON-LD-adjacent helmet tags match the others.
// `/export` redirects to `/` when accessed without router state but still
// renders its <Seo> before the redirect, so the snapshot captures the correct
// canonical, description, and title for Googlebot.
const ROUTES = ['/', '/advanced-fen', '/about', '/fen-history', '/export'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

/** Minimal static file server with SPA fallback to index.html. */
function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let filePath = join(DIST, urlPath);
      if (urlPath.endsWith('/')) filePath = join(filePath, 'index.html');

      if (!existsSync(filePath) || extname(filePath) === '') {
        // SPA fallback — let the client router resolve the route.
        filePath = join(DIST, 'index.html');
      }

      const body = await readFile(filePath);
      res.writeHead(200, {
        'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream'
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
        waitUntil: 'networkidle0',
        timeout: 30_000
      });

      // Wait for the app's own readiness signal rather than a fixed delay.
      await page.waitForSelector('html.app-ready', { timeout: 30_000 });

      let html = await page.content();

      // Strip the static SEO fallback block. react-helmet-async appends its
      // per-route title/meta/canonical/OG tags but does NOT remove the static
      // home-route fallbacks already in <head>, so a raw snapshot would carry
      // duplicate (and wrong) tags. Helmet's versions are authoritative here;
      // remove the marked fallback region so each route ships clean, unique
      // metadata. The markers live in index.html.
      html = html.replace(
        /<!--\s*prerender:strip:start\s*-->[\s\S]*?<!--\s*prerender:strip:end\s*-->/g,
        ''
      );

      // De-duplicate <title>. react-helmet-async injects its per-route title as
      // the FIRST title in <head>, leaving the static `<title>ChessVision` from
      // index.html later in source order. Browsers and crawlers honour the
      // first title, so keep it and drop every later (static) duplicate.
      let seenTitle = false;
      html = html.replace(/<title>[\s\S]*?<\/title>/g, (match) => {
        if (seenTitle) return '';
        seenTitle = true;
        return match;
      });

      // Strip the first-paint splash node — it is irrelevant to a prerendered
      // snapshot and would briefly show a spinner to crawlers.
      html = html.replace(/<div id="app-splash"[\s\S]*?<\/div>\s*<\/div>/, '');

      const outDir =
        route === '/' ? DIST : join(DIST, route.replace(/^\//, ''));
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, 'index.html'), html, 'utf-8');

      console.log(`  prerendered ${route} → ${join(outDir, 'index.html')}`);
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
