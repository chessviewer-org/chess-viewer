import { useEffect, useRef, useState } from 'react';

import { PIECE_MAP } from '@constants';

import { getCachedPieceStyle, logger, preloadPieceStyle } from '@/shared/utils';

export function usePieceImages(pieceStyle: string): {
  pieceImages: Record<string, HTMLImageElement>;
  isLoading: boolean;
  error: string | null;
  loadProgress: number;
} {
  const cached = getCachedPieceStyle(pieceStyle, PIECE_MAP);
  const [pieceImages, setPieceImages] = useState<
    Record<string, HTMLImageElement>
  >(cached ?? {});
  const [isLoading, setIsLoading] = useState<boolean>(cached === null);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(cached ? 100 : 0);
  const currentStyleRef = useRef(pieceStyle);
  // The style whose images are already reflected in state. Starts satisfied
  // when the initial render seeded from cache, so the effect skips a redundant
  // re-set on mount and only syncs when the style actually changes.
  const syncedStyleRef = useRef(cached ? pieceStyle : null);

  useEffect(() => {
    currentStyleRef.current = pieceStyle;

    const cachedForStyle = getCachedPieceStyle(pieceStyle, PIECE_MAP);
    if (cachedForStyle) {
      if (syncedStyleRef.current !== pieceStyle) {
        syncedStyleRef.current = pieceStyle;
        setPieceImages(cachedForStyle);
        setError(null);
        setLoadProgress(100);
        setIsLoading(false);
      }
      return;
    }

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

          syncedStyleRef.current = styleToLoad;
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

  return { pieceImages, isLoading, error, loadProgress };
}
