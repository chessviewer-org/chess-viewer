import React, { memo } from 'react';

import { AnimatePresence, motion, Transition } from 'framer-motion';
import { AlertCircle, Check, Clipboard, Star, Trash2 } from 'lucide-react';

import { MAX_FEN_LENGTH, validateFEN } from '@utils';

/** Props for the animated FEN input grid on the Positions tab. */
interface PositionsTabProps {
  fens: string[];
  displayFensCount?: number;
  fenErrors: Record<number, string>;
  duplicateWarning: number | null;
  favorites: Record<string, boolean>;
  pastedIndex: number | null;
  onUpdateFen: (index: number, value: string) => void;
  onRemoveFen: (index: number) => void;
  onToggleFavorite: (fen: string) => void;
  onPasteFEN: (index: number) => void;
}

/** Two-column animated grid of FEN input slots with validation, duplicate detection, and clipboard paste. */
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
}: PositionsTabProps): React.JSX.Element {
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

  const springTransition: Transition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1,
    duration: 0.3
  };

  return (
    <div className="flex flex-col gap-4 3xl:gap-6">
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
                      className={`bg-surface border rounded-xl p-4 space-y-3 ${hasDuplicate ? 'border-warning/50' : 'border-border hover:border-border-hover'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center text-xs font-bold text-text-secondary">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-text-secondary">
                            Position {idx + 1}
                          </span>
                          {fen.trim() && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${hasError ? 'bg-error' : 'bg-success'}`}
                              role="img"
                              aria-label={
                                hasError ? 'Invalid position' : 'Valid position'
                              }
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {fen && validateFEN(fen) && (
                            <button
                              type="button"
                              onClick={() => onToggleFavorite(fen)}
                              className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${favorites[fen] ? 'bg-accent/15 text-accent hover:bg-accent/25' : 'text-text-muted hover:text-accent hover:bg-accent/10'}`}
                              aria-label="Toggle favorite"
                            >
                              <Star
                                className="w-3.5 h-3.5"
                                fill={favorites[fen] ? 'currentColor' : 'none'}
                                aria-hidden="true"
                              />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onPasteFEN(idx)}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-accent/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            aria-label="Paste FEN"
                            title="Paste from clipboard"
                          >
                            {pastedIndex === idx ? (
                              <Check
                                className="w-3.5 h-3.5 text-success"
                                aria-hidden="true"
                              />
                            ) : (
                              <Clipboard
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                          {fens.length > 3 &&
                            idx >= 3 &&
                            fen.trim().length > 0 && (
                              <button
                                type="button"
                                onClick={() => onRemoveFen(idx)}
                                className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                aria-label="Remove position"
                                title="Remove this position"
                              >
                                <Trash2
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
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
                        className={`w-full px-3 py-2.5 bg-surface text-text-primary border rounded-lg font-mono text-xs transition-all placeholder:text-text-muted/50 ${hasError ? 'border-error/60 focus:border-error focus:ring-1 focus:ring-error/30' : hasDuplicate ? 'border-warning/60 focus:border-warning focus:ring-1 focus:ring-warning/30' : 'border-border'} focus:outline-none`}
                      />
                      {hasError && (
                        <div className="flex items-center gap-1.5 text-error text-xs">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fenErrors[idx]}</span>
                        </div>
                      )}
                      {hasDuplicate && (
                        <div className="flex items-center gap-1.5 text-warning text-xs">
                          <AlertCircle className="w-3 h-3 shrink-0" />
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
