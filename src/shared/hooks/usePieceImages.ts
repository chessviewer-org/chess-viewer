import { useEffect, useRef, useState } from 'react';

import { PIECE_MAP } from '@constants';
import { logger } from '@utils/logger';
import { preloadPieceStyle, setCachedPieces } from '@utils/pieceImageCache';

export function usePieceImages(pieceStyle: string): {
  pieceImages: Record<string, HTMLImageElement>;
  isLoading: boolean;
  error: string | null;
  loadProgress: number;
} {
  const [pieceImages, setPieceImages] = useState<Record<string, HTMLImageElement>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const currentStyleRef = useRef(pieceStyle);

  useEffect(() => {
    currentStyleRef.current = pieceStyle;
    let cancelled = false;

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
            if (!cancelled && currentStyleRef.current === styleToLoad) {
              setLoadProgress(progress);
            }
          }
        );

        if (!cancelled && currentStyleRef.current === styleToLoad) {
          const images: Record<string, HTMLImageElement> = {};
          let hasError = false;

          Object.keys(PIECE_MAP).forEach((key) => {
            const img = loadedImages[key];
            if (img) {
              images[key] = img;
            } else {
              images[key] = createPlaceholderImage(key);
              hasError = true;
            }
          });

          if (hasError) {
            setError('Some pieces failed to load');
            setCachedPieces(styleToLoad, images);
          }

          setPieceImages(images);
          setIsLoading(false);
          setLoadProgress(100);
        }
      } catch (err) {
        if (!cancelled && currentStyleRef.current === styleToLoad) {
          logger.error('Critical piece loading error:', err);
          setError('Failed to load pieces');
          setIsLoading(false);
        }
      }
    };

    loadPieces();

    return () => {
      cancelled = true;
    };
  }, [pieceStyle]);

  return {
    pieceImages,
    isLoading,
    error,
    loadProgress
  };
}

function createPlaceholderImage(pieceName: string): HTMLImageElement {
  logger.log('Creating placeholder for:', pieceName);
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 100, 100);
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 90, 90);
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pieceName, 50, 50);
  }
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}
