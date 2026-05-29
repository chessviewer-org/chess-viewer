import { logger } from './logger';

// A single piece style has 12 piece images. Cap at 3 styles worth (36 images)
// so users who swap pieces don't accumulate dead Image elements forever.
const MAX_CACHED_IMAGES = 36;
const pieceCache = new Map<string, HTMLImageElement>();

/**
 * Evicts the oldest cached entries (FIFO via Map insertion order) when the
 * cache exceeds MAX_CACHED_IMAGES. Releases the image src to help GC.
 */
function enforceCacheCap(): void {
  while (pieceCache.size > MAX_CACHED_IMAGES) {
    const oldestKey = pieceCache.keys().next().value;
    if (oldestKey === undefined) break;
    const oldImg = pieceCache.get(oldestKey);
    if (oldImg) oldImg.src = '';
    pieceCache.delete(oldestKey);
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

  const promises = pieces.map((piece) => {
    const key = `${style}_${piece}`;
    
    return new Promise<void>((resolve) => {
      const finishOne = (img?: HTMLImageElement) => {
        loadedCount++;
        if (img) result[piece] = img;
        if (onProgress) onProgress(Math.round((loadedCount / total) * 100));
        resolve();
      };

      const cached = pieceCache.get(key);
      if (cached) {
        finishOne(cached);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        pieceCache.set(key, img);
        enforceCacheCap();
        finishOne(img);
      };
      img.onerror = () => {
        logger.error(`Failed to load piece image: ${piece} for style ${style}`);
        finishOne();
      };
      img.src = `https://lichess1.org/assets/piece/${style}/${piece}.svg`;
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
export function setCachedPieces(style: string, pieces: Record<string, HTMLImageElement>): void {
  Object.entries(pieces).forEach(([key, img]) => {
    pieceCache.set(`${style}_${key}`, img);
  });
  enforceCacheCap();
}
