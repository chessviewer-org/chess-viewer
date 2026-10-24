import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const INLINE_SCRIPT =
  /<script(?![^>]*\bsrc=)(?![^>]*\btype="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g;

const html = await readFile(join(DIST, 'index.html'), 'utf8');
const hashes = [...html.matchAll(INLINE_SCRIPT)]
  .map(([, code]) => code)
  .filter((code) => code.trim())
  .map(
    (code) => `'sha256-${createHash('sha256').update(code).digest('base64')}'`
  );

const headersPath = join(DIST, '_headers');
const headers = await readFile(headersPath, 'utf8');
const updated = headers.replaceAll(
  "script-src 'self'",
  ["script-src 'self'", ...new Set(hashes)].join(' ')
);
if (hashes.length && updated === headers)
  throw new Error('No script-src directive found in dist/_headers.');
await writeFile(headersPath, updated);

console.log(`  CSP script-src: ${new Set(hashes).size} inline script hash(es)`);
