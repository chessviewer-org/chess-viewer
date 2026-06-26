/**
 * Computes the SHA-256 hash of every inline <style> block in index.html and
 * writes the result into public/_headers (Cloudflare Pages) and nginx.conf
 * (Docker/self-hosted) so the Content-Security-Policy style-src hash stays in
 * sync after any edit to the critical CSS block.
 *
 * Run automatically as part of `pnpm build` (after vite build, before prerender).
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

async function computeStyleHashes(htmlPath) {
  const html = await readFile(htmlPath, 'utf-8');
  const hashes = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const hash = createHash('sha256').update(m[1]).digest('base64');
    hashes.push(`'sha256-${hash}'`);
  }
  return hashes;
}

async function updateHeaders(headersPath, hashes) {
  let content = await readFile(headersPath, 'utf-8');
  const styleSrc = `'self' ${hashes.join(' ')}`;
  content = content.replace(/style-src 'self'[^;]*/g, `style-src ${styleSrc}`);
  await writeFile(headersPath, content, 'utf-8');
}

async function updateNginx(nginxPath, hashes) {
  let content = await readFile(nginxPath, 'utf-8');
  const styleSrc = `'self' ${hashes.join(' ')}`;
  content = content.replace(/style-src 'self'[^;]*/g, `style-src ${styleSrc}`);
  await writeFile(nginxPath, content, 'utf-8');
}

const hashes = await computeStyleHashes(join(ROOT, 'index.html'));
console.log('  CSP style-src hashes:', hashes.join(' '));

await updateHeaders(join(ROOT, 'public', '_headers'), hashes);
console.log('  Updated public/_headers');

await updateNginx(join(ROOT, 'nginx.conf'), hashes);
console.log('  Updated nginx.conf');
