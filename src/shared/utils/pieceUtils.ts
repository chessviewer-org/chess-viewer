import { PIECE_SET_POPULARITY, PIECE_SETS as ALL_PIECE_SETS } from '@constants';
import type { PieceSet } from '@app-types';
import { logger } from './logger';

export type PieceSort = 'popular' | 'name';

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

function piecePath(style: string, piece: string): string {
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

export async function imageToEmbeddableDataURL(
  img: HTMLImageElement
): Promise<string> {
  if (!img) return '';
  const src = img.currentSrc || img.src || '';
  if (!src) return '';

  const cached = pieceDataUrlCache.get(src);
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
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      try {
        const response = await fetch(src, {
          cache: 'force-cache',
          signal: controller.signal
        });
        if (response.ok) {
          const svgText = await response.text();
          dataUrl = `data:image/svg+xml;base64,${toBase64Utf8(svgText)}`;
        }
      } catch (err: unknown) {
        logger.warn('SVG export: failed to inline vector piece source:', err);
      } finally {
        clearTimeout(timer);
      }
    }
  }

  if (!dataUrl) dataUrl = await imageToDataURL(img);
  if (!dataUrl) dataUrl = FALLBACK_PIECE_DATA_URL;

  pieceDataUrlCache.set(src, dataUrl);
  evictOldest(pieceDataUrlCache, MAX_DATA_URL_CACHE);
  return dataUrl;
}
