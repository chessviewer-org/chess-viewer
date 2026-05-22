import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, Clipboard, Heart, Trash2 } from 'lucide-react';

import { validateFEN } from '@/utils';
import { MAX_FEN_LENGTH } from '@/utils/validation';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const PositionsTab = memo(function PositionsTab({
  fens,
  fenErrors,
  duplicateWarning,
  favorites,
  pastedIndex,
  onUpdateFen,
  onRemoveFen,
  onToggleFavorite,
  onPasteFEN
}) {
  // Group fens into pairs for the rows to satisfy the single-column flex + grid-cols-2 requirement
  const rows = [];
  for (let i = 0; i < fens.length; i += 2) {
    rows.push({
      rowIndex: Math.floor(i / 2),
      items: fens.slice(i, i + 2).map((fen, relIdx) => ({
        fen,
        originalIndex: i + relIdx,
        id: `fen-slot-${i + relIdx}`
      }))
    });
  }

  const springTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1,
    duration: 0.3
  };

  return (
    <div className="flex flex-col gap-4 3xl:gap-6 w-[95%] max-w-[2400px] mx-auto">
      <AnimatePresence mode="popLayout">
        {rows.map((row) => {
          const isSingle = row.items.length === 1;

          return (
            <motion.div
              key={`row-${row.rowIndex}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
              transition={springTransition}
              className={`grid gap-4 3xl:gap-6 ${isSingle ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}
            >
              <AnimatePresence mode="popLayout">
                {row.items.map(({ fen, originalIndex: idx, id }) => {
                  const hasError = !!fenErrors[idx];
                  const hasDuplicate = duplicateWarning === idx;

                  return (
                    <motion.div
                      key={id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                      transition={springTransition}
                      className={`bg-surface border rounded-xl p-4 space-y-3 ${hasError ? 'border-error/50' : hasDuplicate ? 'border-warning/50' : 'border-border hover:border-border-hover'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center text-xs font-bold text-text-secondary">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-text-secondary">
                            Position {idx + 1}
                          </span>
                          {fen && validateFEN(fen) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {fen && validateFEN(fen) && (
                            <button
                              onClick={() => onToggleFavorite(fen)}
                              className={`p-1.5 rounded-lg transition-colors ${favorites[fen] ? 'bg-error/15 text-error hover:bg-error/25' : 'text-text-muted hover:text-error hover:bg-error/10'}`}
                              aria-label="Toggle favorite"
                            >
                              <Heart
                                className="w-3.5 h-3.5"
                                fill={favorites[fen] ? 'currentColor' : 'none'}
                              />
                            </button>
                          )}
                          <button
                            onClick={() => onPasteFEN(idx)}
                            className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            aria-label="Paste FEN"
                            title="Paste from clipboard"
                          >
                            {pastedIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Clipboard className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {fens.length > 3 &&
                            idx >= 3 &&
                            fen.trim().length > 0 && (
                              <button
                                onClick={() => onRemoveFen(idx)}
                                className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                aria-label="Remove position"
                                title="Remove this position"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                      </div>

                      <input
                        type="text"
                        value={fen}
                        onChange={(e) => onUpdateFen(idx, e.target.value)}
                        placeholder="Paste FEN notation here…"
                        maxLength={MAX_FEN_LENGTH}
                        className={`w-full px-3 py-2.5 bg-surface text-text-primary border rounded-lg font-mono text-xs transition-all placeholder:text-text-muted/50 ${hasError ? 'border-error/60 focus:border-error focus:ring-1 focus:ring-error/30' : hasDuplicate ? 'border-warning/60 focus:border-warning focus:ring-1 focus:ring-warning/30' : 'border-border focus:border-accent focus:ring-1 focus:ring-accent/20'} focus:outline-none`}
                      />
                      {hasError && (
                        <div className="flex items-center gap-1.5 text-error text-xs">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{fenErrors[idx]}</span>
                        </div>
                      )}
                      {hasDuplicate && (
                        <div className="flex items-center gap-1.5 text-warning text-xs">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>
                            Duplicate FEN — already exists in another slot
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});
PositionsTab.displayName = 'PositionsTab';
export default PositionsTab;
