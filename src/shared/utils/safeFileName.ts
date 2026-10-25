import { sanitizeFileName } from '@chessviewer-org/chess-viewer';

const FORBIDDEN_CHARS = /[<>:"/\\|?*\p{Cc}]/gu;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])$/i;
const MAX_NAME_LENGTH = 80;

export const FORBIDDEN_NAME_CHARS = '< > : " / \\ | ? *';

export function stripForbiddenNameChars(value: string): string {
  return value.replace(FORBIDDEN_CHARS, '');
}

export function toSafeName(value: string, fallback: string): string {
  const name = stripForbiddenNameChars(value)
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, MAX_NAME_LENGTH)
    .replace(/^\.+|\.+$/g, '');
  if (!name) return fallback;
  return sanitizeFileName(WINDOWS_RESERVED.test(name) ? `${name}_` : name);
}
