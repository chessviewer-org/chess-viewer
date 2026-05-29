import { logger } from './logger';

const MAX_DATA_URL_CACHE = 48;
const pieceDataUrlCache = new Map<string, string>();

const FALLBACK_PIECE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">' +
  '<circle cx="22.5" cy="11" r="7" fill="#555"/>' +
  '<rect x="16" y="18" width="13" height="8" rx="2" fill="#555"/>' +
  '<rect x="12" y="32" width="21" height="6" rx="2" fill="#555"/>' +
  '</svg>';
const FALLBACK_PIECE_DATA_URL = `data:image/svg+xml;base64,${btoa(FALLBACK_PIECE_SVG)}`;

function enforceDataUrlCacheCap(): void {
  while (pieceDataUrlCache.size > MAX_DATA_URL_CACHE) {
    const oldestKey = pieceDataUrlCache.keys().next().value;
    if (oldestKey === undefined) break;
    pieceDataUrlCache.delete(oldestKey);
  }
}

/**
 * Maps a FEN piece character to a piece image key.
 *
 * @param fenPiece - FEN piece character (e.g. `'P'`, `'k'`)
 * @returns Image key (e.g. `'wP'`, `'bk'`), or `null` for an empty square
 */
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
        resolve('');
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    } catch (err) {
      logger.warn('SVG export: failed to convert piece image to base64:', err);
      resolve('');
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  });
}

/**
 * Resolves once an image element has finished loading (or times out after 2 s).
 *
 * @param img - The image element to wait for
 */
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

/**
 * Converts a piece `HTMLImageElement` to a self-contained base64 data URL for
 * inline embedding in SVG exports.
 *
 * SVG sources are fetched and inlined as UTF-8 base64; other formats fall back to
 * canvas-based rasterization. Results are cached by image `src` (max 48 entries).
 *
 * @param img - Loaded piece image element
 * @returns Base64 data URL string, or an empty string if conversion fails
 */
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
      } catch (err) {
        logger.warn('SVG export: failed to inline vector piece source:', err);
      } finally {
        clearTimeout(timer);
      }
    }
  }

  if (!dataUrl) dataUrl = await imageToDataURL(img);
  if (!dataUrl) dataUrl = FALLBACK_PIECE_DATA_URL;

  pieceDataUrlCache.set(src, dataUrl);
  enforceDataUrlCacheCap();
  return dataUrl;
}
