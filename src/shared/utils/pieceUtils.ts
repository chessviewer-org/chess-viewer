import { PIECE_SET_POPULARITY, PIECE_SETS as ALL_PIECE_SETS } from '@constants';
import type { PieceSet } from '@app-types';
import { logger } from './logger';

// Types
export type PieceSort = 'popular' | 'name';

// Constants
const MISSING_ARTWORK_IDS = new Set(['alpha', 'reillycraig', 'riohacha']);

export const AVAILABLE_PIECE_SETS: PieceSet[] = ALL_PIECE_SETS.filter(
  (set) => !MISSING_ARTWORK_IDS.has(set.id)
);

const POPULARITY_RANK = new Map(
  PIECE_SET_POPULARITY.map((id, index) => [id, index])
);

export function sortPieceSets(sort: PieceSort): PieceSet[] {
  const copy = [...AVAILABLE_PIECE_SETS];
  if (sort === 'name') {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy.sort((a, b) => {
    const ra = POPULARITY_RANK.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rb = POPULARITY_RANK.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

function evictOldest(cache: Map<string, unknown>, maxSize: number): void {
  while (cache.size > maxSize) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
}

const MAX_CACHED_IMAGES = 36;
const pieceCache = new Map<string, HTMLImageElement>();

export function piecePath(style: string, piece: string): string {
  return `/piece/${style}/${piece}.svg`;
}

export async function preloadPieceStyle(
  style: string,
  pieceMap: Record<string, string>,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<Record<string, HTMLImageElement>> {
  const pieces = Object.keys(pieceMap);
  const total = pieces.length;
  let loadedCount = 0;
  const result: Record<string, HTMLImageElement> = {};

  const promises = pieces.map(async (piece) => {
    const key = `${style}_${piece}`;

    const finishOne = (img?: HTMLImageElement) => {
      loadedCount++;
      if (img) result[piece] = img;
      if (onProgress && !signal?.aborted) {
        onProgress(Math.round((loadedCount / total) * 100));
      }
    };

    const cached = pieceCache.get(key);
    if (cached) {
      finishOne(cached);
      return;
    }

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        img.onload = null;
        img.onerror = null;
        pieceCache.set(key, img);
        evictOldest(pieceCache, MAX_CACHED_IMAGES);
        finishOne(img);
        resolve();
      };
      img.onerror = () => {
        img.onload = null;
        img.onerror = null;
        logger.error(`Failed to load piece image: ${piece} for style ${style}`);
        finishOne();
        resolve();
      };
      img.src = piecePath(style, piece);
    });
  });

  await Promise.all(promises);
  return result;
}

export function setCachedPieces(
  style: string,
  pieces: Record<string, HTMLImageElement>
): void {
  Object.entries(pieces).forEach(([key, img]) => {
    pieceCache.set(`${style}_${key}`, img);
  });
  evictOldest(pieceCache, MAX_CACHED_IMAGES);
}

export function getCachedPieceStyle(
  style: string,
  pieceMap: Record<string, string>
): Record<string, HTMLImageElement> | null {
  const result: Record<string, HTMLImageElement> = {};
  for (const piece of Object.keys(pieceMap)) {
    const img = pieceCache.get(`${style}_${piece}`);
    if (!img) return null;
    result[piece] = img;
  }
  return result;
}

const MAX_DATA_URL_CACHE = 48;
const pieceDataUrlCache = new Map<string, string>();

const MIN_PIECE_INTRINSIC_PX = 64;
const MAX_PIECE_INTRINSIC_PX = 2048;

const FALLBACK_PIECE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">' +
  '<circle cx="22.5" cy="11" r="7" fill="#555"/>' +
  '<rect x="16" y="18" width="13" height="8" rx="2" fill="#555"/>' +
  '<rect x="12" y="32" width="21" height="6" rx="2" fill="#555"/>' +
  '</svg>';
const FALLBACK_PIECE_DATA_URL = `data:image/svg+xml;base64,${btoa(FALLBACK_PIECE_SVG)}`;

export function getPieceKey(fenPiece: string): string | null {
  if (!fenPiece) return null;
  const isWhite = fenPiece === fenPiece.toUpperCase();
  return (isWhite ? 'w' : 'b') + fenPiece.toUpperCase();
}

function imageToDataURL(img: HTMLImageElement): Promise<string> {
  return new Promise((resolve) => {
    const size = Math.max(img.naturalWidth || 64, img.naturalHeight || 64, 1);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(FALLBACK_PIECE_DATA_URL);
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    } catch (err: unknown) {
      logger.warn('SVG export: failed to convert piece image to base64:', err);
      resolve(FALLBACK_PIECE_DATA_URL);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  });
}

export function waitForPieceImage(img: HTMLImageElement): Promise<void> {
  if (!img || img.complete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 2000);
    const onLoad = () => {
      clearTimeout(timeout);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      resolve();
    };
    const onError = () => {
      clearTimeout(timeout);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      resolve();
    };
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
  });
}

function toBase64Utf8(text: string): string {
  const utf8 = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < utf8.length; i += chunkSize) {
    const chunk = utf8.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
}

export function intrinsicPxOf(svgText: string): number {
  const rootMatch = /<svg([^>]*)>/i.exec(svgText);
  if (!rootMatch) return 0;
  const rootAttrs = rootMatch[1] ?? '';
  let maxPx = 0;
  const re = /\b(?:width|height)\s*=\s*"([0-9.]+)\s*(px|mm|cm|pt)?"/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(rootAttrs))) {
    const value = parseFloat(match[1] ?? '');
    if (!Number.isFinite(value)) continue;
    const unit = (match[2] ?? 'px').toLowerCase();
    let px = value;
    if (unit === 'mm') px = (value / 25.4) * 96;
    else if (unit === 'cm') px = (value / 2.54) * 96;
    else if (unit === 'pt') px = (value / 72) * 96;
    maxPx = Math.max(maxPx, px);
  }
  return Math.round(maxPx);
}

export function resizePieceSvg(svgText: string, targetPx: number): string {
  if (!/viewBox\s*=\s*"/i.test(svgText)) return svgText;

  const size = String(Math.round(targetPx));
  const resized = svgText.replace(/<svg([^>]*?)>/i, (_match, attrs: string) => {
    let next = attrs;
    next = next.replace(/\s+width\s*=\s*"[^"]*"/i, ` width="${size}"`);
    next = next.replace(/\s+height\s*=\s*"[^"]*"/i, ` height="${size}"`);
    if (!/\swidth\s*=/.test(next)) next += ` width="${size}"`;
    if (!/\sheight\s*=/.test(next)) next += ` height="${size}"`;
    return `<svg${next}>`;
  });
  return resized === svgText ? svgText : resized;
}

export async function fetchPieceSvgText(src: string): Promise<string | null> {
  if (!src) return null;
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(src);
  } catch {
    return null;
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return null;
  }
  const lowerSrc = src.toLowerCase();
  if (!lowerSrc.endsWith('.svg') && !lowerSrc.includes('image/svg+xml')) {
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(src, {
      cache: 'force-cache',
      signal: controller.signal
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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

const MAX_HIRES_CACHE = 48;
const hiResPieceCache = new Map<string, HTMLImageElement>();

export async function ensurePieceResolution(
  img: HTMLImageElement,
  targetPx: number
): Promise<HTMLImageElement> {
  if (!img || !Number.isFinite(targetPx) || targetPx <= 0) return img;
  if (img.naturalWidth >= targetPx && img.naturalHeight >= targetPx) {
    return img;
  }
  const src = img.currentSrc || img.src || '';
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return img;

  const cacheKey = `${src}|${Math.round(targetPx)}`;
  const cached = hiResPieceCache.get(cacheKey);
  if (cached && cached.complete && cached.naturalWidth > 0) return cached;

  const svgText = await fetchPieceSvgText(src);
  if (!svgText || !/viewBox\s*=\s*"/i.test(svgText)) return img;
  const resized = resizePieceSvg(svgText, Math.round(targetPx));

  try {
    const blob = new Blob([resized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const upgraded = await new Promise<HTMLImageElement>((resolve, reject) => {
      const next = new Image();
      next.onload = () => resolve(next);
      next.onerror = () =>
        reject(new Error('Upgraded piece image failed to load'));
      next.src = url;
    });
    hiResPieceCache.set(cacheKey, upgraded);
    evictOldest(hiResPieceCache, MAX_HIRES_CACHE);
    return upgraded;
  } catch (err: unknown) {
    logger.warn('Export: failed to upgrade piece resolution:', err);
    return img;
  }
}

export async function imageToEmbeddableDataURL(
  img: HTMLImageElement,
  targetSize: number = 0
): Promise<string> {
  if (!img) return '';
  const src = img.currentSrc || img.src || '';
  if (!src) return '';

  const cacheKey = targetSize > 0 ? `${src}|${targetSize}` : src;
  const cached = pieceDataUrlCache.get(cacheKey);
  if (cached) return cached;

  let dataUrl = '';
  if (src.startsWith('data:')) {
    dataUrl = src;
  } else if (src.startsWith('blob:')) {
    dataUrl = await imageToDataURL(img);
  } else {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(src);
    } catch {
      logger.warn('SVG export: rejecting piece src with unparseable URL:', src);
      return '';
    }
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      logger.warn(
        'SVG export: rejecting piece src with disallowed protocol:',
        parsedUrl.protocol
      );
      return '';
    }

    const lowerSrc = src.toLowerCase();
    const isSvgSource =
      lowerSrc.endsWith('.svg') || lowerSrc.includes('image/svg+xml');

    if (isSvgSource) {
      const fetched = await fetchPieceSvgText(src);
      if (fetched) {
        let svgText = fetched;
        if (targetSize > 0) {
          const intrinsic = intrinsicPxOf(svgText);
          const target = Math.min(
            MAX_PIECE_INTRINSIC_PX,
            Math.max(MIN_PIECE_INTRINSIC_PX, intrinsic, targetSize)
          );
          if (target > intrinsic) {
            svgText = resizePieceSvg(svgText, target);
          }
        }
        dataUrl = `data:image/svg+xml;base64,${toBase64Utf8(svgText)}`;
      }
    }
  }

  if (!dataUrl) dataUrl = await imageToDataURL(img);
  if (!dataUrl) dataUrl = FALLBACK_PIECE_DATA_URL;

  pieceDataUrlCache.set(cacheKey, dataUrl);
  evictOldest(pieceDataUrlCache, MAX_DATA_URL_CACHE);
  return dataUrl;
}
