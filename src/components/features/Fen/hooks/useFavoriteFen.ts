import { useCallback, useEffect, useState } from 'react';

import { isRecord, safeJSONParse, validateFEN } from '@utils';
import type { NotificationType } from '../components/FENInputField';

interface UseFavoriteFenOptions {
  fen: string;
  onNotification?:
    | ((message: string, type: NotificationType) => void)
    | undefined;
}

export function useFavoriteFen({ fen, onNotification }: UseFavoriteFenOptions) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  useEffect(() => {
    const favorites = safeJSONParse(localStorage.getItem('favoriteFens'), {});
    setIsFavorite(isRecord(favorites) ? !!favorites[fen] : false);
  }, [fen]);

  const toggleFavorite = useCallback(
    (currentFen: string) => {
      const trimmed = currentFen.trim();
      if (!trimmed) {
        onNotification?.('FEN is empty', 'error');
        return;
      }
      if (!validateFEN(trimmed)) {
        onNotification?.('Invalid FEN - cannot favorite', 'error');
        return;
      }

      try {
        const raw = safeJSONParse(localStorage.getItem('favoriteFens'), {});
        const favorites: Record<string, boolean> = isRecord(raw)
          ? (raw as Record<string, boolean>)
          : {};
        const next = !favorites[trimmed];
        if (next) favorites[trimmed] = true;
        else delete favorites[trimmed];

        localStorage.setItem('favoriteFens', JSON.stringify(favorites));
        setIsFavorite(next);
        onNotification?.(
          next ? 'Added to favorites' : 'Removed from favorites',
          'success'
        );
      } catch {
        onNotification?.('Failed to update favorites', 'error');
      }
    },
    [onNotification]
  );

  return { isFavorite, toggleFavorite };
}
