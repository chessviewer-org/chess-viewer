import { useEffect, useMemo, useState } from 'react';

import {
  getCachedPieceStyle,
  getDisplayablePieceStyle,
  preloadPieceStyle
} from '@/shared/utils/pieceUtils';
import { logger } from '@/shared/utils/logger';
import {
  requestedPieceMap,
  type PieceImageRequest
} from '@/shared/utils/pieceRequest';

export function usePieceImages(
  pieceStyle: string,
  { positions, board, selectedPiece }: PieceImageRequest = {}
): {
  pieceImages: Record<string, HTMLImageElement>;
  isLoading: boolean;
  error: string | null;
} {
  const keys = useMemo(
    () =>
      JSON.stringify(
        requestedPieceMap({
          ...(positions !== undefined ? { positions } : {}),
          ...(board ? { board } : {}),
          ...(selectedPiece ? { selectedPiece } : {})
        })
      ),
    [positions, board, selectedPiece]
  );
  // A board edit with the same kinds of pieces keeps the same map and images.
  const pieceMap = useMemo(
    () => JSON.parse(keys) as Record<string, string>,
    [keys]
  );
  const cacheKey = `${pieceStyle}:${keys}`;
  const request = useMemo(() => {
    const cached = getCachedPieceStyle(pieceStyle, pieceMap);
    const ready = Object.keys(cached).length === Object.keys(pieceMap).length;
    return {
      images: ready ? cached : getDisplayablePieceStyle(pieceStyle, pieceMap),
      ready
    };
  }, [pieceStyle, pieceMap]);
  const [loaded, setLoaded] = useState<{
    key: string;
    images: Record<string, HTMLImageElement>;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (request.ready) return;
    const controller = new AbortController();
    void preloadPieceStyle(pieceStyle, pieceMap, controller.signal)
      .then((images) => {
        if (controller.signal.aborted) return;
        const missing =
          Object.keys(pieceMap).length - Object.keys(images).length;
        if (missing)
          logger.warn(`Missing ${missing} piece images for ${pieceStyle}`);
        setLoaded({
          key: cacheKey,
          images,
          error: missing ? 'Some piece images failed to load' : null
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        logger.error('Piece loading failed:', error);
        setLoaded({
          key: cacheKey,
          images: {},
          error: 'Failed to load pieces'
        });
      });
    return () => controller.abort();
  }, [pieceStyle, pieceMap, cacheKey, request]);

  const current = loaded?.key === cacheKey ? loaded : null;
  return {
    pieceImages: request.ready
      ? request.images
      : (current?.images ?? request.images),
    isLoading: !request.ready && !current,
    error: request.ready ? null : (current?.error ?? null)
  };
}
