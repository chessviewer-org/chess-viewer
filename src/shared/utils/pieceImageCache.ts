import { logger } from './logger';

const pieceCache = new Map<string, HTMLImageElement>();
let currentPieceStyle = 'cburnett';

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
        finishOne(img);
      };
      img.onerror = () => {
        logger.error(`Failed to load piece image: ${piece} for style ${style}`);
        finishOne();
      };
      img.src = `https://lichess1.org/assets/piece/${style}/${piece}.svg`;
    });
  });

  currentPieceStyle = style;
  await Promise.all(promises);
  return result;
}

/** 
 * Returns the cached image for a specific piece and style. 
 * 
 * @param piece - Piece key (e.g. 'wP', 'bk')
 * @param style - Piece style name
 * @returns The HTML image element or undefined if not cached
 */
export function getCachedPiece(piece: string, style: string): HTMLImageElement | undefined {
  return pieceCache.get(`${style}_${piece}`);
}

/** 
 * Returns all cached images for the current style. 
 * 
 * @returns Map of piece keys to image elements
 */
export function getCachedPieces(): Record<string, HTMLImageElement> {
  const result: Record<string, HTMLImageElement> = {};
  const prefix = `${currentPieceStyle}_`;
  pieceCache.forEach((img, key) => {
    if (key.startsWith(prefix)) {
      result[key.replace(prefix, '')] = img;
    }
  });
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
}
