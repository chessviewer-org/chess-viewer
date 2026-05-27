import { memo, useCallback } from 'react';
import { Copy, RotateCcw, Shuffle } from 'lucide-react';

/** Props for the `PrimaryActions` color picker action buttons. */
export interface PrimaryActionsProps {
  onRandom: () => void;
  onReset: () => void;
  onCopy: () => void;
  copiedText: string;
  tempColor: string;
}

/** Three-button row for Random, Reset, and Copy actions in the color picker. */
const PrimaryActions = memo(
  function PrimaryActions({
    onRandom,
    onReset,
    onCopy,
    copiedText,
    tempColor
  }: PrimaryActionsProps) {
    const handleRandomClick = useCallback(() => {
      onRandom();
    }, [onRandom]);

    const handleResetClick = useCallback(() => {
      onReset();
    }, [onReset]);

    const handleCopyClick = useCallback(() => {
      onCopy();
    }, [onCopy]);

    const isCopied = copiedText === tempColor;

    return (
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleRandomClick}
          className="flex items-center justify-center gap-1.5 px-3 min-h-11 bg-linear-to-br from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/50 rounded-lg text-purple-300 text-xs font-semibold transition-colors duration-200 outline-none"
        >
          <Shuffle className="w-4 h-4" />
          Random
        </button>

        <button
          onClick={handleResetClick}
          className="flex items-center justify-center gap-1.5 px-3 min-h-11 bg-linear-to-br from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 border border-amber-500/50 rounded-lg text-amber-300 text-xs font-semibold transition-colors duration-200 outline-none"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <button
          onClick={handleCopyClick}
          className="flex items-center justify-center gap-1.5 px-3 min-h-11 bg-linear-to-br from-success/20 to-success/10 hover:from-success/30 hover:to-success/20 border border-success/50 rounded-lg text-success text-xs font-semibold transition-colors duration-200 outline-none"
        >
          <Copy className="w-4 h-4" />
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.copiedText === nextProps.copiedText &&
      prevProps.tempColor === nextProps.tempColor
    );
  }
);

PrimaryActions.displayName = 'PrimaryActions';
export default PrimaryActions;
