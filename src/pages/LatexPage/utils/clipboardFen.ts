import { usableFen } from './latexProject';

export type ClipboardFenResult =
  { ok: true; fen: string } | { ok: false; reason: string };

export async function readFenFromClipboard(): Promise<ClipboardFenResult> {
  try {
    const text = (await navigator.clipboard.readText()).trim();
    return usableFen(text) === null
      ? { ok: false, reason: 'The clipboard does not contain a valid FEN.' }
      : { ok: true, fen: text };
  } catch {
    return {
      ok: false,
      reason: 'The browser blocked access to the clipboard.'
    };
  }
}
