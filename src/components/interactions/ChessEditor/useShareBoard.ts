import { useCallback, useMemo, useState } from 'react';

import {
  createUltraQualityCanvas,
  type ExportConfig,
  sanitizeFileName
} from '@utils';

/** A single share destination (messenger, mail client, social, …). */
export interface ShareTarget {
  id: string;
  label: string;
  /**
   * Builds the destination URL for the given share payload.
   * Returns `null` when the target cannot handle the requested mode
   * (e.g. raw-image targets that only accept text).
   */
  buildUrl: (payload: SharePayload) => string | null;
}

/** What the user chose to share. */
export type ShareMode = 'fen' | 'image';

/** Resolved data handed to every {@link ShareTarget}. */
export interface SharePayload {
  /** Raw FEN string of the current position. */
  fen: string;
  /** Deep link that reopens the position on the board. */
  positionUrl: string;
  /** Human-readable message body (text + link). */
  text: string;
}

/** Encodes a value for safe inclusion in a `mailto:`/`https:` query string. */
const enc = encodeURIComponent;

/**
 * Text-share destinations. Image files cannot be attached via URL schemes, so
 * image sharing is delegated to the native Web Share API (with a copy-to-clipboard
 * fallback) inside {@link useShareBoard}.
 */
const TEXT_TARGETS: ShareTarget[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    buildUrl: ({ text }) => `https://wa.me/?text=${enc(text)}`
  },
  {
    id: 'telegram',
    label: 'Telegram',
    buildUrl: ({ positionUrl, fen }) =>
      `https://t.me/share/url?url=${enc(positionUrl)}&text=${enc(fen)}`
  },
  {
    id: 'email',
    label: 'Email',
    buildUrl: ({ text }) =>
      `mailto:?subject=${enc('ChessVision position')}&body=${enc(text)}`
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    buildUrl: ({ text }) => `https://twitter.com/intent/tweet?text=${enc(text)}`
  }
];

/** Builds a deep link that reopens the given FEN on the board. */
function buildPositionUrl(fen: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('fen', fen);
  return url.toString();
}

/** Renders the current board to a PNG blob, reusing the export engine. */
async function renderImageBlob(config: ExportConfig): Promise<Blob> {
  let canvas: HTMLCanvasElement | null = null;
  try {
    canvas = await createUltraQualityCanvas(config);
    if (!canvas) throw new Error('Canvas creation returned null');
    return await new Promise<Blob>((resolve, reject) => {
      if (!canvas) return reject(new Error('Canvas is null'));
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('Failed to encode image')),
        'image/png',
        1.0
      );
    });
  } finally {
    // Safari does not GC canvas memory on reference drop — release it eagerly.
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

/** Reports the outcome of a share action back to the host UI. */
type ShareNotify = (
  message: string,
  type: 'success' | 'error' | 'info'
) => void;

interface UseShareBoardArgs {
  fen: string;
  /** Lazily builds the render config when an image share is requested. */
  buildExportConfig: () => ExportConfig;
  onNotify?: ShareNotify;
}

/**
 * Share orchestration for the chess board: exposes the available text targets,
 * the resolved share payload, and handlers for opening a destination or sharing
 * the rendered board image.
 */
export function useShareBoard({
  fen,
  buildExportConfig,
  onNotify
}: UseShareBoardArgs) {
  const [isBusy, setIsBusy] = useState(false);

  const payload = useMemo<SharePayload>(() => {
    const positionUrl = buildPositionUrl(fen);
    return {
      fen,
      positionUrl,
      text: `Check out this chess position:\n${fen}\n${positionUrl}`
    };
  }, [fen]);

  /** Opens a text-share destination in a new tab (mailto stays same-tab). */
  const openTarget = useCallback(
    (target: ShareTarget) => {
      const url = target.buildUrl(payload);
      if (!url) return;
      if (url.startsWith('mailto:')) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [payload]
  );

  /** Copies the FEN + deep link to the clipboard. */
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payload.text);
      onNotify?.('Position link copied', 'success');
    } catch {
      onNotify?.('Could not copy link', 'error');
    }
  }, [payload, onNotify]);

  /**
   * Shares the rendered board image. Prefers the native Web Share API (so the
   * user picks WhatsApp/Telegram/Mail/etc. with the actual file attached) and
   * falls back to copying the PNG to the clipboard where file sharing is
   * unavailable.
   */
  const shareImage = useCallback(async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const blob = await renderImageBlob(buildExportConfig());
      const fileName = `${sanitizeFileName('chess-position')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      const canShareFile =
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (canShareFile && typeof navigator.share === 'function') {
        await navigator.share({
          files: [file],
          title: 'ChessVision position',
          text: payload.fen
        });
        return;
      }

      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        onNotify?.('Image copied — paste it anywhere', 'success');
        return;
      }

      onNotify?.('Image sharing is not supported on this device', 'error');
    } catch (error: unknown) {
      // The user dismissing the native share sheet rejects with AbortError.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onNotify?.('Could not share image', 'error');
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, buildExportConfig, payload, onNotify]);

  return {
    payload,
    targets: TEXT_TARGETS,
    openTarget,
    copyLink,
    shareImage,
    isBusy
  };
}
