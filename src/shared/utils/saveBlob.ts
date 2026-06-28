import { sanitizeFileName } from './validation';

/**
 * Triggers a client-side file download for a Blob via a temporary object URL.
 *
 * Replaces the `file-saver` dependency. The whole flow is deliberately small
 * and security-conscious:
 *
 * - The base name is run through {@link sanitizeFileName}, which strips path
 *   separators (`/`, `\`), control characters, and leading/trailing dots — so
 *   a caller-supplied name can never become a path-traversal (`../`) or escape
 *   the download into another directory.
 * - The object URL is always revoked, including on a failed `.click()`, so
 *   long batch exports do not leak blob URLs (and their backing memory).
 * - The anchor is created detached, appended only for the click, and removed
 *   immediately afterwards; `rel="noopener"` is set defensively even though the
 *   href is a same-origin blob URL.
 *
 * @param blob - The file contents to download.
 * @param fileName - Desired base name (without extension), sanitized internally.
 * @param extension - File extension without the dot (e.g. `"zip"`, `"png"`).
 */
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
    // Defer revocation so the navigation/download has consumed the URL before
    // its backing memory is released, matching the existing exporter pattern.
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
