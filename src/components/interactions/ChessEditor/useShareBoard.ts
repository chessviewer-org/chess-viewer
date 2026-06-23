import { useCallback, useMemo } from 'react';

/** Resolved share payload for the current position. */
export interface SharePayload {
  /** Raw FEN string of the current position. */
  fen: string;
  /** Deep link that reopens the position on the board. */
  positionUrl: string;
}

/** Builds a deep link that reopens the given FEN on the board. */
function buildPositionUrl(fen: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('fen', fen);
  return url.toString();
}

/** Reports the outcome of a share action back to the host UI. */
type ShareNotify = (
  message: string,
  type: 'success' | 'error' | 'info'
) => void;

interface UseShareBoardArgs {
  fen: string;
  onNotify?: ShareNotify;
}

/**
 * Share orchestration for the chess board. Provides the resolved payload
 * (FEN + deep link URL) and a clipboard copy handler. Image sharing and
 * third-party targets have been removed — the deep link is the canonical
 * share mechanism: anyone who opens it gets the position loaded instantly.
 */
export function useShareBoard({ fen, onNotify }: UseShareBoardArgs) {
  const payload = useMemo<SharePayload>(() => {
    const positionUrl = buildPositionUrl(fen);
    return { fen, positionUrl };
  }, [fen]);

  /** Copies the deep link to the clipboard. */
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
