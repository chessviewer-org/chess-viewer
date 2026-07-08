import { sanitizeFileName } from '@chessviewer-org/chess-viewer';

const URL_REVOKE_DELAY_MS = 100;

export function saveBlob(
  blob: Blob,
  fileName: string,
  extension: string
): void {
  if (!(blob instanceof Blob)) {
    throw new TypeError('saveBlob expects a Blob');
  }

  const safeName = sanitizeFileName(fileName);
  const safeExt = extension.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = url;
    link.download = safeExt ? `${safeName}.${safeExt}` : safeName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
  } finally {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    setTimeout(() => URL.revokeObjectURL(url), URL_REVOKE_DELAY_MS);
  }
}
