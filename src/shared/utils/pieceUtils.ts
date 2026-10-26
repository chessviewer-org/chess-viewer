import {
  FAIRY_DIR,
  PIECE_SET_POPULARITY,
  PIECE_SETS as ALL_PIECE_SETS
} from '@constants';
import type { ChessBoard, PieceSet } from '@app-types';
import { logger } from './logger';
import { cellName, isFairyCell, parseCellCode } from './boardCells';
import { fairyLetterSVG, parseNamedCell } from './fairyCells';
import {
  compositionSymbolSVG,
  isCompositionSymbol
} from './compositionSymbols';
import { parseFEN } from './fenParser';
import { pieceSrc } from './pieceSources';
import { buildPieceVector, fetchPieceSvgText } from './pieceSvg';

// Types
export type PieceSort = 'popular' | 'name';

// Constants
const UNAVAILABLE_PIECE_IDS = new Set([
  'alpha',
  'companion',
  'leipzig',
  'reillycraig',
  'riohacha'
]);

export const AVAILABLE_PIECE_SETS: PieceSet[] = ALL_PIECE_SETS.filter(
  (set) => !UNAVAILABLE_PIECE_IDS.has(set.id)
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

const MAX_CACHED_IMAGES = 216;
const pieceCache = new Map<string, HTMLImageElement>();

export function piecePath(style: string, piece: string): string {
  const named = parseNamedCell(piece);
  if (named) {
    if (named.definition.glyph)
      return piecePath(style, named.color + named.definition.glyph);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fairyLetterSVG(named.color, named.walk))}`;
  }
  const code = parseCellCode(piece);
  if (code && isCompositionSymbol(code.type))
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(compositionSymbolSVG(code.type, code.color, code.rotation))}`;
  return isFairyCell(piece)
    ? `/${FAIRY_DIR}/${style}/${piece}.svg`
    : `/piece/${style}/${piece}.svg`;
}

const pendingImages = new Map<
  string,
  {
    image: HTMLImageElement;
    ready: Promise<HTMLImageElement | undefined>;
  }
>();

function loadPiece(style: string, piece: string) {
  // Letter artwork is style-independent; glyph aliases share their source too.
  const source = piecePath(style, piece);
  const cached = pieceCache.get(source);
  if (cached) return { image: cached, ready: Promise.resolve(cached) };
  const pending = pendingImages.get(source);
  if (pending) return pending;

  const image = new Image();
  const ready = new Promise<HTMLImageElement | undefined>((resolve) => {
    const finish = (loaded: boolean) => {
      image.onload = image.onerror = null;
      pendingImages.delete(source);
      if (loaded) {
        pieceCache.set(source, image);
        evictOldest(pieceCache, MAX_CACHED_IMAGES);
      } else
        logger.error(`Failed to load piece image: ${piece} for style ${style}`);
      resolve(loaded ? image : undefined);
    };
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    const src = pieceSrc(source);
    if (src.startsWith('data:')) {
      image.src = src;
    } else {
      void fetchPieceSvgText(src)
        .then((svg) => {
          if (!svg || !buildPieceVector(svg)) {
            finish(false);
            return;
          }
          // Keep the vector source with the image, independent of cache eviction.
          image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        })
        .catch(() => finish(false));
    }
  });
  const entry = { image, ready };
  pendingImages.set(source, entry);
  return entry;
}

export async function preloadPieceStyle(
  style: string,
  pieceMap: Record<string, string>,
  signal?: AbortSignal
): Promise<Record<string, HTMLImageElement>> {
  const result: Record<string, HTMLImageElement> = {};
  await Promise.all(
    Object.entries(pieceMap).map(async ([piece, source]) => {
      if (signal?.aborted) return;
      const image = await loadPiece(style, source || piece).ready;
      if (signal?.aborted) return;
      if (image) result[piece] = image;
    })
  );
  return result;
}

const EXPORT_LOAD_ROUNDS = 2;

export async function loadExportPieces(
  style: string,
  pieceMap: Record<string, string>
): Promise<Record<string, HTMLImageElement>> {
  let images: Record<string, HTMLImageElement> = {};
  for (let round = 0; round < EXPORT_LOAD_ROUNDS; round++) {
    const missing = Object.fromEntries(
      Object.entries(pieceMap).filter(([piece]) => !images[piece])
    );
    if (!Object.keys(missing).length) break;
    images = { ...images, ...(await preloadPieceStyle(style, missing)) };
  }
  return images;
}

export function getCachedPieceStyle(
  style: string,
  pieceMap: Record<string, string>
): Record<string, HTMLImageElement> {
  const result: Record<string, HTMLImageElement> = {};
  for (const [piece, source] of Object.entries(pieceMap)) {
    const img = pieceCache.get(piecePath(style, source || piece));
    if (img) result[piece] = img;
  }
  return result;
}

export function getDisplayablePieceStyle(
  style: string,
  pieceMap: Record<string, string>
): Record<string, HTMLImageElement> {
  const result: Record<string, HTMLImageElement> = {};
  for (const [piece, source] of Object.entries(pieceMap)) {
    const { image } = loadPiece(style, source || piece);
    if (image.src) result[piece] = image;
  }
  return result;
}

export function getPieceKey(fenPiece: string): string | null {
  if (!fenPiece) return null;
  const named = parseNamedCell(fenPiece);
  if (named)
    return named.definition.glyph
      ? named.color + named.definition.glyph
      : `${named.color}@${named.walk}`;
  if (parseCellCode(fenPiece)) return fenPiece;
  const isWhite = fenPiece === fenPiece.toUpperCase();
  return (isWhite ? 'w' : 'b') + fenPiece.toUpperCase();
}

export function boardImagesReady(
  fen: string,
  pieceImages: Record<string, HTMLImageElement>
): boolean {
  try {
    return parseFEN(fen)
      .flat()
      .every((cell) => {
        const key = getPieceKey(cell ?? '');
        const img = key ? pieceImages[key] : null;
        return !key || (!!img && img.complete && img.naturalWidth > 0);
      });
  } catch {
    return true;
  }
}

export function assertBoardArtwork(
  board: ChessBoard,
  images: Record<string, HTMLImageElement>
): void {
  for (const cell of board.flat()) {
    const key = getPieceKey(cell);
    if (!key) continue;
    const image = images[key];
    if (!image?.complete || !image.naturalWidth) {
      throw new Error(
        `The ${cellName(cell)} artwork could not be loaded. Check your internet connection and try again.`
      );
    }
  }
}

export function waitForPieceImage(
  img: HTMLImageElement,
  timeoutMs = 2000
): Promise<void> {
  if (!img || img.complete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timeout);
      img.removeEventListener('load', done);
      img.removeEventListener('error', done);
      resolve();
    };
    const timeout = setTimeout(done, timeoutMs);
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
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
  if (!/viewBox\s*=\s*"/i.test(svgText)) {
    const vector = buildPieceVector(svgText);
    if (!vector) return svgText;
    svgText = svgText.replace(/<svg\b/i, `<svg viewBox="${vector.viewBox}"`);
  }

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

const MAX_HIRES_CACHE = 48;
const MAX_HIRES_CACHE_PIXELS = 16 * 1024 * 1024;
const hiResPieceCache = new Map<string, HTMLImageElement>();
const pendingHiResPieces = new Map<string, Promise<HTMLImageElement>>();
let hiResCachePixels = 0;

export async function ensurePieceResolution(
  img: HTMLImageElement,
  targetPx: number
): Promise<HTMLImageElement> {
  if (!img || !Number.isFinite(targetPx) || targetPx <= 0) return img;
  if (img.naturalWidth >= targetPx && img.naturalHeight >= targetPx) {
    return img;
  }
  const src = img.currentSrc || img.src || '';
  if (!src || src.startsWith('blob:')) return img;

  const size = Math.max(1, Math.ceil(targetPx));
  const cacheKey = `${src}|${size}`;
  const cached = hiResPieceCache.get(cacheKey);
  if (cached && cached.complete && cached.naturalWidth > 0) return cached;
  const pending = pendingHiResPieces.get(cacheKey);
  if (pending) return pending;

  const request = upgradePieceResolution(img, src, size);
  pendingHiResPieces.set(cacheKey, request);
  try {
    const upgraded = await request;
    if (upgraded !== img) {
      const pixels = upgraded.naturalWidth * upgraded.naturalHeight;
      if (pixels <= MAX_HIRES_CACHE_PIXELS) {
        hiResPieceCache.set(cacheKey, upgraded);
        hiResCachePixels += pixels;
        while (
          hiResPieceCache.size > MAX_HIRES_CACHE ||
          hiResCachePixels > MAX_HIRES_CACHE_PIXELS
        ) {
          const oldestKey = hiResPieceCache.keys().next().value;
          if (oldestKey === undefined) break;
          const oldest = hiResPieceCache.get(oldestKey)!;
          hiResCachePixels -= oldest.naturalWidth * oldest.naturalHeight;
          hiResPieceCache.delete(oldestKey);
        }
      }
    }
    return upgraded;
  } finally {
    pendingHiResPieces.delete(cacheKey);
  }
}

async function upgradePieceResolution(
  img: HTMLImageElement,
  src: string,
  size: number
): Promise<HTMLImageElement> {
  const svgText = await fetchPieceSvgText(src);
  if (!svgText) return img;
  const resized = resizePieceSvg(svgText, size);

  let url: string | undefined;
  try {
    const blob = new Blob([resized], { type: 'image/svg+xml;charset=utf-8' });
    url = URL.createObjectURL(blob);
    const objectUrl = url;
    const upgraded = await new Promise<HTMLImageElement>((resolve, reject) => {
      const next = new Image();
      const finish = (loaded: boolean) => {
        clearTimeout(timer);
        next.onload = next.onerror = null;
        if (loaded) resolve(next);
        else reject(new Error('Upgraded piece image failed to load'));
      };
      const timer = setTimeout(() => finish(false), 10000);
      next.onload = () => finish(true);
      next.onerror = () => finish(false);
      next.src = objectUrl;
    });
    return upgraded;
  } catch (err: unknown) {
    logger.warn('Export: failed to upgrade piece resolution:', err);
    return img;
  } finally {
    if (url !== undefined) URL.revokeObjectURL(url);
  }
}
