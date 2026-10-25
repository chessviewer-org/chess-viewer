import { logger } from './logger';

const MAX_SVG_TEXT_CACHE = 216;
const MAX_SVG_TEXT_CHARS = 1024 * 1024;
const svgTextCache = new Map<string, string>();
const pendingSvgText = new Map<string, Promise<string | null>>();
let svgTextCacheChars = 0;

export async function fetchPieceSvgText(src: string): Promise<string | null> {
  if (!src) return null;
  if (/^data:image\/svg\+xml(?:;[^,]*)?,/i.test(src)) {
    const comma = src.indexOf(',');
    try {
      return src.slice(0, comma).includes(';base64')
        ? atob(src.slice(comma + 1))
        : decodeURIComponent(src.slice(comma + 1));
    } catch {
      return null;
    }
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(src, globalThis.location?.href);
  } catch {
    return null;
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return null;
  }
  const url = parsedUrl.href;
  const lowerSrc = url.toLowerCase();
  if (!lowerSrc.endsWith('.svg') && !lowerSrc.includes('image/svg+xml')) {
    return null;
  }
  const cached = svgTextCache.get(url);
  if (cached !== undefined) return cached;
  const pending = pendingSvgText.get(url);
  if (pending) return pending;

  const request = fetchSvgText(url);
  pendingSvgText.set(url, request);
  try {
    const text = await request;
    if (
      text !== null &&
      text.length <= MAX_SVG_TEXT_CHARS &&
      buildPieceVector(text)
    ) {
      svgTextCache.set(url, text);
      svgTextCacheChars += text.length;
      while (
        svgTextCache.size > MAX_SVG_TEXT_CACHE ||
        svgTextCacheChars > MAX_SVG_TEXT_CHARS
      ) {
        const oldestKey = svgTextCache.keys().next().value;
        if (oldestKey === undefined) break;
        svgTextCacheChars -= svgTextCache.get(oldestKey)!.length;
        svgTextCache.delete(oldestKey);
      }
    }
    return text;
  } finally {
    pendingSvgText.delete(url);
  }
}

const SVG_FETCH_TIMEOUTS_MS = [3000, 6000, 12000] as const;
const SVG_FETCH_RETRY_DELAY_MS = 250;

type SvgFetchResult =
  { kind: 'text'; text: string } | { kind: 'retry' } | { kind: 'missing' };

async function fetchSvgTextOnce(
  src: string,
  timeoutMs: number
): Promise<SvgFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(src, {
      cache: 'force-cache',
      signal: controller.signal
    });
    if (response.ok) return { kind: 'text', text: await response.text() };
    return { kind: response.status >= 500 ? 'retry' : 'missing' };
  } catch {
    return { kind: 'retry' };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSvgText(src: string): Promise<string | null> {
  for (const [attempt, timeoutMs] of SVG_FETCH_TIMEOUTS_MS.entries()) {
    if (attempt > 0)
      await new Promise((resolve) =>
        setTimeout(resolve, SVG_FETCH_RETRY_DELAY_MS * attempt)
      );
    const result = await fetchSvgTextOnce(src, timeoutMs);
    if (result.kind === 'text') return result.text;
    if (result.kind === 'missing') return null;
  }
  logger.warn('SVG export: piece artwork could not be fetched:', src);
  return null;
}

export interface PieceVector {
  viewBox: string;
  content: string;
}

function dimToPx(value: string | undefined): number {
  if (!value) return 0;
  const match = /^([0-9.]+)\s*(px|mm|cm|pt|in)?/i.exec(value.trim());
  if (!match?.[1]) return 0;
  const num = parseFloat(match[1]);
  if (!Number.isFinite(num)) return 0;
  const unit = (match[2] ?? 'px').toLowerCase();
  if (unit === 'mm') return (num / 25.4) * 96;
  if (unit === 'cm') return (num / 2.54) * 96;
  if (unit === 'pt') return (num / 72) * 96;
  if (unit === 'in') return num * 96;
  return num;
}

export function buildPieceVector(svgText: string): PieceVector | null {
  const cleaned = svgText
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '');
  const openMatch = /<svg\b[^>]*>/i.exec(cleaned);
  if (!openMatch) return null;
  const openTag = openMatch[0];

  let viewBox: string | null = null;
  const vbMatch = /viewBox\s*=\s*"([^"]+)"/i.exec(openTag);
  if (vbMatch?.[1]) {
    viewBox = vbMatch[1].trim();
  } else {
    const widthPx = dimToPx(/\bwidth\s*=\s*"([^"]*)"/i.exec(openTag)?.[1]);
    const heightPx = dimToPx(/\bheight\s*=\s*"([^"]*)"/i.exec(openTag)?.[1]);
    if (widthPx > 0 && heightPx > 0) {
      viewBox = `0 0 ${Math.round(widthPx * 100) / 100} ${Math.round(heightPx * 100) / 100}`;
    }
  }
  if (!viewBox) return null;

  const closeIdx = cleaned.toLowerCase().lastIndexOf('</svg>');
  if (closeIdx < openMatch.index + openTag.length) return null;
  const content = cleaned
    .slice(openMatch.index + openTag.length, closeIdx)
    .trim();
  if (!content) return null;
  return { viewBox, content };
}

export function namespacePieceIds(vector: PieceVector, prefix: string): string {
  let content = vector.content;
  content = content.replace(
    /(?<![A-Za-z0-9_:-])id\s*=\s*"([^"]+)"/g,
    (_m, id: string) => `id="${prefix}${id}"`
  );
  content = content.replace(
    /url\(\s*['"]?#([^)\s'"]+)['"]?\s*\)/g,
    (_m, id: string) => `url(#${prefix}${id})`
  );
  content = content.replace(
    /href\s*=\s*"#([^"]+)"/g,
    (_m, id: string) => `href="#${prefix}${id}"`
  );
  return content;
}
