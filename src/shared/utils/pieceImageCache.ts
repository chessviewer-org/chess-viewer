import { logger } from './logger';

// A single piece style has 12 piece images. Cap at 3 styles worth (36 images)
// so users who swap pieces don't accumulate dead Image elements forever.
const MAX_CACHED_IMAGES = 36;
const pieceCache = new Map<string, HTMLImageElement>();

// The intrinsic pixel size we rasterise each piece SVG at. Lichess piece SVGs
// declare only `viewBox="0 0 45 45"` and NO width/height, so a browser
// rasterises them at ~45px — far smaller than a board square at devicePixelRatio
// ≥ 2, which is why pieces looked blurry everywhere. We rewrite the SVG to a
// large explicit size so the bitmap the canvas samples from is high-resolution.
const PIECE_RASTER_PX = 512;

// Track which cached images were loaded from a blob: URL so eviction can revoke
// the object URL (the high-res rasterisation path below). Plain CDN-URL images
// (the fallback) have nothing to revoke.
const blobUrls = new WeakMap<HTMLImageElement, string>();

/**
 * Evicts the oldest cached entries (FIFO via Map insertion order) when the
 * cache exceeds MAX_CACHED_IMAGES. Releases the image src + any blob URL to
 * help GC.
 */
function enforceCacheCap(): void {
  while (pieceCache.size > MAX_CACHED_IMAGES) {
    const oldestKey = pieceCache.keys().next().value;
    if (oldestKey === undefined) break;
    const oldImg = pieceCache.get(oldestKey);
    if (oldImg) {
      const url = blobUrls.get(oldImg);
      if (url) {
        URL.revokeObjectURL(url);
        blobUrls.delete(oldImg);
      }
      oldImg.src = '';
    }
    pieceCache.delete(oldestKey);
  }
}

/**
 * Fetches a piece SVG and rewrites its root `<svg>` to carry an explicit
 * `width`/`height` of {@link PIECE_RASTER_PX}, returning a `blob:` URL the
 * browser will rasterise at that high resolution. Returns `null` on any failure
 * so the caller can fall back to the raw CDN URL.
 */
async function buildHiResSvgUrl(url: string): Promise<string | null> {
  // Abort a hung CDN connection after 2s so it can't stall preloadPieceStyle's
  // Promise.all indefinitely (matches svgPieceLoader's fetch discipline).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(url, { mode: 'cors', signal: controller.signal });
    if (!res.ok) return null;
    const raw = await res.text();
    if (!raw.includes('<svg')) return null;
    // Inject width/height into the opening <svg ...> tag (these SVGs ship with a
    // viewBox but no dimensions). Don't duplicate if somehow already present.
    const sized = raw.replace(/<svg\b([^>]*)>/, (match, attrs: string) => {
      if (/\bwidth=/.test(attrs) && /\bheight=/.test(attrs)) return match;
      return `<svg${attrs} width="${PIECE_RASTER_PX}" height="${PIECE_RASTER_PX}">`;
    });
    const blob = new Blob([sized], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Preloads all piece images for a given style.
 *
 * @param style - The piece style name (e.g. 'cburnett', 'merida')
 * @param pieceMap - Record of piece names to load
 * @param onProgress - Optional callback for loading progress (0-100)
 * @returns Promise resolving to a record of loaded image elements
 */
export async function preloadPieceStyle(
  style: string,
  pieceMap: Record<string, string>,
  onProgress?: (progress: number) => void
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
      if (onProgress) onProgress(Math.round((loadedCount / total) * 100));
    };

    const cached = pieceCache.get(key);
    if (cached) {
      finishOne(cached);
      return;
    }

    const cdnUrl = `https://lichess1.org/assets/piece/${style}/${piece}.svg`;
    // Prefer a high-resolution blob (SVG resized to PIECE_RASTER_PX) so the
    // canvas samples a crisp bitmap; fall back to the raw CDN URL if the fetch
    // or rewrite fails (e.g. offline / CORS), preserving the old behaviour.
    const hiResUrl = await buildHiResSvgUrl(cdnUrl);
    const srcUrl = hiResUrl ?? cdnUrl;

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        img.onload = null;
        img.onerror = null;
        if (hiResUrl) blobUrls.set(img, hiResUrl);
        pieceCache.set(key, img);
        enforceCacheCap();
        finishOne(img);
        resolve();
      };
      img.onerror = () => {
        img.onload = null;
        img.onerror = null;
        if (hiResUrl) URL.revokeObjectURL(hiResUrl);
        logger.error(`Failed to load piece image: ${piece} for style ${style}`);
        finishOne();
        resolve();
      };
      img.src = srcUrl;
    });
  });

  await Promise.all(promises);
  return result;
}

/**
 * Manually adds images to the cache for a style.
 *
 * @param style - The piece style name
 * @param pieces - Map of piece keys to image elements
 */
export function setCachedPieces(
  style: string,
  pieces: Record<string, HTMLImageElement>
): void {
  Object.entries(pieces).forEach(([key, img]) => {
    pieceCache.set(`${style}_${key}`, img);
  });
  enforceCacheCap();
}
