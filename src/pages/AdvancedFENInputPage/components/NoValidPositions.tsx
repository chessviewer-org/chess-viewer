import { Eye } from 'lucide-react';

interface NoValidPositionsProps {
  onGoToPositions: () => void;
}

/** Empty-state shown when no valid FENs exist in the preview/export tabs. */
export default function NoValidPositions({
  onGoToPositions
}: NoValidPositionsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center mb-4">
        <Eye className="w-8 h-8 text-text-muted" aria-hidden="true" />
      </div>
      <p className="text-text-secondary font-medium mb-1">
        No valid positions to preview
      </p>
      <p className="text-text-muted text-sm">
        Add valid FEN positions in the Positions tab
      </p>
      <button
        type="button"
        onClick={onGoToPositions}
        className="mt-6 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Go to Positions
      </button>
    </div>
  );
}
