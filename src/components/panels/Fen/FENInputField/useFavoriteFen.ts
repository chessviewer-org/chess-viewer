import { useCallback, useEffect, useState } from 'react';

import { validateFEN } from '@utils';
import { isRecord, safeJSONParse } from '@utils/validation';
import type { NotificationType } from './FENInputField';

/** A single FEN clipboard history entry with a Unix timestamp. */
export interface FENHistoryEntry {
  fen: string;
  timestamp: number;
}

/** Options for `useFavoriteFen`. */
interface UseFavoriteFenOptions {
  fen: string;
  onNotification?:
    | ((message: string, type: NotificationType) => void)
    | undefined;
}

/**
 * Manages the favorited state of the active FEN and provides a toggle.
 *
 * Persists favorites to `localStorage` under the `favoriteFens` key and
 * validates the FEN before toggling.
 *
 * @param options - Current FEN and optional notification callback.
 * @returns `isFavorite` flag and `toggleFavorite` handler.
 */
export function useFavoriteFen({ fen, onNotification }: UseFavoriteFenOptions) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  useEffect(() => {
    try {
      const rawFavorites = safeJSONParse(
        localStorage.getItem('favoriteFens'),
        {}
      );
      if (isRecord(rawFavorites)) {
        setIsFavorite(!!rawFavorites[fen]);
      } else {
        setIsFavorite(false);
      }
    } catch {
      setIsFavorite(false);
    }
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
        const rawFavorites = safeJSONParse(
          localStorage.getItem('favoriteFens'),
          {}
        );
        const favorites: Record<string, boolean> = {};
        if (isRecord(rawFavorites)) {
          for (const key in rawFavorites) {
            if (Object.prototype.hasOwnProperty.call(rawFavorites, key)) {
              favorites[key] = Boolean(rawFavorites[key]);
            }
          }
        }
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
