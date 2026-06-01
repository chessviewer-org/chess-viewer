const globalPieceCache = new Map();
const loadingPromises = new Map();
const loadingStyles = new Set();

/**
 * Returns cached piece images for a style, or null if not cached.
 *
 * @param {string} pieceStyle
 * @returns {Object|null}
 */
function getCachedPieces(pieceStyle) {
  const cached = globalPieceCache.get(pieceStyle);
  if (cached) {
    return cached;
  }
  return null;
}
/**
 * Stores piece images in the cache for a given style.
 *
 * @param {string} pieceStyle
 * @param {Object} images - Map of piece keys to Image elements
 */
export function setCachedPieces(pieceStyle, images) {
  globalPieceCache.set(pieceStyle, images);
}
/**
 * @param {string} pieceStyle
 */
function markStyleLoading(pieceStyle) {
  loadingStyles.add(pieceStyle);
}
/**
 * @param {string} pieceStyle
 */
function markStyleLoaded(pieceStyle) {
  loadingStyles.delete(pieceStyle);
}
/**
 * Preloads all piece images for a given style, using a shared promise cache to
 * prevent duplicate network requests.
 *
 * @param {string} pieceStyle
 * @param {Record<string, string>} PIECE_MAP - Map of piece keys to SVG filenames
 * @returns {Promise<Object>} Resolved piece image map
 */
export async function preloadPieceStyle(pieceStyle, PIECE_MAP, onProgress) {
  const cached = getCachedPieces(pieceStyle);
  if (cached) {
    onProgress?.(100);
    return cached;
  }
  if (loadingPromises.has(pieceStyle)) {
    return loadingPromises.get(pieceStyle).then((images) => {
      onProgress?.(100);
      return images;
    });
  }
  markStyleLoading(pieceStyle);
  const images = {};
  const keys = Object.keys(PIECE_MAP);
  let loaded = 0;
  const promise = Promise.all(
    keys.map(
      (key) =>
        new Promise(function (resolve) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const url =
            'https://lichess1.org/assets/piece/' +
            pieceStyle +
            '/' +
            PIECE_MAP[key] +
            '.svg';
          img.onload = function () {
            images[key] = img;
            loaded++;
            onProgress?.(Math.round((loaded / keys.length) * 100));
            resolve();
          };
          img.onerror = function () {
            images[key] = null;
            loaded++;
            onProgress?.(Math.round((loaded / keys.length) * 100));
            resolve();
          };
          img.src = url;
        })
    )
  ).then(function () {
    setCachedPieces(pieceStyle, images);
    markStyleLoaded(pieceStyle);
    loadingPromises.delete(pieceStyle);
    return images;
  });
  loadingPromises.set(pieceStyle, promise);
  return promise;
}
