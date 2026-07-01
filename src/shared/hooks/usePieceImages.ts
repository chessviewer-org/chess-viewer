import { useEffect, useRef, useState } from 'react';

import { PIECE_MAP } from '@constants';

import { logger, preloadPieceStyle } from '@utils';

/**
 * Loads and caches all piece images for the given piece style.
 *
 * Cancels any in-flight load when the style changes to prevent stale updates.
 *
 * @param pieceStyle - Piece style identifier (e.g. `'cburnett'`, `'merida'`)
 * @returns Loaded image map, loading state, error message, and granular progress (0–100)
 */
export function usePieceImages(pieceStyle: string): {
  pieceImages: Record<string, HTMLImageElement>;
  isLoading: boolean;
  error: string | null;
  loadProgress: number;
} {
  const [pieceImages, setPieceImages] = useState<
    Record<string, HTMLImageElement>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const currentStyleRef = useRef(pieceStyle);

  useEffect(() => {
    currentStyleRef.current = pieceStyle;
    const abortController = new AbortController();

    const loadPieces = async () => {
      const styleToLoad = pieceStyle;
      setIsLoading(true);
      setError(null);
      setLoadProgress(0);

      try {
        const loadedImages = await preloadPieceStyle(
          styleToLoad,
          PIECE_MAP,
          (progress: number) => {
            if (
              !abortController.signal.aborted &&
              currentStyleRef.current === styleToLoad
            ) {
              setLoadProgress(progress);
            }
          },
          abortController.signal
        );

        if (
          !abortController.signal.aborted &&
          currentStyleRef.current === styleToLoad
        ) {
          const images: Record<string, HTMLImageElement> = {};
          let missingCount = 0;

          Object.keys(PIECE_MAP).forEach((key) => {
            const img = loadedImages[key];
            if (img) {
              images[key] = img;
            } else {
              missingCount++;
            }
          });

          if (missingCount > 0) {
            const totalPieces = Object.keys(PIECE_MAP).length;
            if (missingCount === totalPieces) {
              setError('Failed to load pieces');
            } else {
              logger.warn(
                `usePieceImages: ${missingCount}/${totalPieces} pieces failed to load for style "${styleToLoad}"`
              );
            }
          }

          setPieceImages(images);
          setIsLoading(false);
          setLoadProgress(100);
        }
      } catch (err: unknown) {
        if (
          !abortController.signal.aborted &&
          currentStyleRef.current === styleToLoad
        ) {
          logger.error('Critical piece loading error:', err);
          setError('Failed to load pieces');
          setIsLoading(false);
        }
      }
    };

    loadPieces();

    return () => {
      abortController.abort();
    };
  }, [pieceStyle]);

  // All four fields are state that change together, so memoizing the wrapper
  // object would never preserve a stable reference — return it directly.
  return { pieceImages, isLoading, error, loadProgress };
}
