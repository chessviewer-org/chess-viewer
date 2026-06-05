import { type ChangeEvent, useCallback, useRef } from 'react';

import { hasGeminiKey, loadGeminiKey, scanBoardImage } from '@utils';

type Notify = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning'
) => void;

interface UseScanBoardArgs {
  /** Loads a scanned, validated FEN onto the board (same path as FEN input). */
  onFenChange: (fen: string) => void;
  /** Surfaces scan progress/result through the host notification system. */
  onNotify?: Notify | undefined;
}

interface UseScanBoardResult {
  /** Attach to a hidden `<input type="file" accept="image/*">`. */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Opens the OS image picker (or warns when no key is configured). */
  openPicker: () => void;
  /** `onChange` handler for the hidden file input. */
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Drives the "scan board from image" flow for the editor's Open-in-Device
 * button. Picking is gated on a locally-stored Gemini key: with no key the user
 * is told where to add one instead of opening a picker that would fail. The
 * recognised FEN is pushed up through the existing {@link onFenChange} path, so
 * it flows to the board exactly like a manual FEN edit. The image goes directly
 * browser → Google; nothing touches the ChessVision backend.
 */
export function useScanBoard({
  onFenChange,
  onNotify
}: UseScanBoardArgs): UseScanBoardResult {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = useCallback(() => {
    if (!hasGeminiKey()) {
      onNotify?.(
        'Add your Gemini API key in Settings → Developer Options to scan a board from an image.',
        'warning'
      );
      return;
    }
    fileInputRef.current?.click();
  }, [onNotify]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset immediately so re-picking the same file fires onChange again.
      event.target.value = '';
      if (!file) return;

      const apiKey = await loadGeminiKey();
      if (!apiKey) {
        onNotify?.(
          'No Gemini API key found. Add one in Settings → Developer Options.',
          'warning'
        );
        return;
      }

      onNotify?.('Scanning board from image…', 'info');
      try {
        const fen = await scanBoardImage(file, apiKey);
        onFenChange(fen);
        onNotify?.('Board recognised from image.', 'success');
      } catch (error) {
        onNotify?.(
          error instanceof Error ? error.message : 'Could not scan the image.',
          'error'
        );
      }
    },
    [onFenChange, onNotify]
  );

  // The async handler is invoked via a sync wrapper to satisfy the input's
  // onChange signature without an unhandled-promise warning.
  const handleFileChangeSync = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      void handleFileChange(event);
    },
    [handleFileChange]
  );

  return { fileInputRef, openPicker, handleFileChange: handleFileChangeSync };
}
