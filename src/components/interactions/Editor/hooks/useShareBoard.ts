import { useCallback, useMemo } from 'react';

export interface SharePayload {
  fen: string;
  positionUrl: string;
}

// Helpers
function buildPositionUrl(fen: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('fen', fen);
  return url.toString();
}

type ShareNotify = (
  message: string,
  type: 'success' | 'error' | 'info'
) => void;

interface UseShareBoardArgs {
  fen: string;
  onNotify?: ShareNotify;
}

export function useShareBoard({ fen, onNotify }: UseShareBoardArgs) {
  const payload = useMemo<SharePayload>(() => {
    const positionUrl = buildPositionUrl(fen);
    return { fen, positionUrl };
  }, [fen]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payload.positionUrl);
      onNotify?.('Link copied to clipboard', 'success');
    } catch {
      onNotify?.('Could not copy link', 'error');
    }
  }, [payload, onNotify]);

  return { payload, copyLink };
}
