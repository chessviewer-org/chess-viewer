import { compositionCaption } from '@utils/compositionCaption';
export function CompositionLegend({ fen }: { fen: string }) {
  let lines: string[] = [];
  try {
    lines = compositionCaption(fen);
  } catch {
    return null;
  }
  if (!lines.length) return null;
  return (
    <div
      aria-label="Fairy problem details"
      className="w-full border-t border-border/50 pt-3 space-y-1 text-xs text-text-secondary break-words"
    >
      {[...new Set(lines)].map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
