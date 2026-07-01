import { logger } from './logger';

// A single piece style has 12 piece images. Cap at 3 styles worth (36 images)
// so users who swap pieces don't accumulate dead Image elements forever.
const MAX_CACHED_IMAGES = 36;
const pieceCache = new Map<string, HTMLImageElement>();

/**
 * Builds the URL for a self-hosted piece SVG.
 *
 * Pieces are served from `public/piece/<style>/<piece>.svg` (same origin) —
 * see ATTRIBUTION.md for sources and licenses. Each SVG carries an explicit
 * `width`/`height` of 512px so the browser rasterises a crisp bitmap for the
 * canvas, and being same-origin they are immune to the CORS / service-worker
 * opaque-cache problems the old Lichess CDN path suffered from.
 */
function piecePath(style: string, piece: string): string {
  return `/piece/${style}/${piece}.svg`;
}

/**
 * Evicts the oldest cached entries (FIFO via Map insertion order) when the
 * cache exceeds MAX_CACHED_IMAGES. Does NOT clear img.src — the same
 * HTMLImageElement may still be referenced by an active pieceImages state
 * snapshot, and zeroing src corrupts it in place (naturalWidth → 0), causing
 * pieces to disappear mid-render.
 */
function enforceCacheCap(): void {
  while (pieceCache.size > MAX_CACHED_IMAGES) {
    const oldestKey = pieceCache.keys().next().value;
    if (oldestKey === undefined) break;
    pieceCache.delete(oldestKey);
  }
}

/**
 * Preloads all piece images for a given style from the self-hosted assets.
 *
 * @param style - The piece style name (e.g. 'cburnett', 'merida')
 * @param pieceMap - Record of piece names to load
 * @param onProgress - Optional callback for loading progress (0-100)
 * @param signal - Optional AbortSignal; when it fires we stop reporting
 *   progress so a stale style load can't overwrite a newer one.
 * @returns Promise resolving to a record of loaded image elements
 */
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
        enforceCacheCap();
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
