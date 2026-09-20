import { memo, useEffect, useMemo, useState } from 'react';

import { Check, Code2, Copy } from '@/assets/icons';

import {
  LATEX_PACKAGES,
  LATEX_PACKAGE_META,
  type LatexOutputMode,
  type LatexPackage,
  generateBoardLatex
} from '@utils';
import { useCopyToClipboard } from '@hooks';
import { ModalShell } from '@ui';

// Constants
const MODES: { value: LatexOutputMode; label: string }[] = [
  { value: 'snippet', label: 'Snippet' },
  { value: 'document', label: 'Full document' }
];

// Types
export interface LatexExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fen: string;
  flipped?: boolean;
  showCoords?: boolean;
  onNotify?: (message: string, type: 'success') => void;
}

// Helpers
const segmentButton = (active: boolean) =>
  `flex-1 min-h-11 px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
    active
      ? 'bg-accent/10 text-text-primary'
      : 'text-text-secondary hover:bg-surface-elevated'
  }`;

export const LatexExportDialog = memo(function LatexExportDialog({
  isOpen,
  onClose,
  fen,
  flipped = false,
  showCoords = true,
  onNotify
}: LatexExportDialogProps) {
  const [latexPackage, setLatexPackage] = useState<LatexPackage>('skak');
  const [mode, setMode] = useState<LatexOutputMode>('snippet');
  const [copied, copy] = useCopyToClipboard();

  useEffect(() => {
    if (copied) onNotify?.('LaTeX copied to clipboard', 'success');
  }, [copied, onNotify]);

  const { code, error } = useMemo(() => {
    try {
      return {
        code: generateBoardLatex({
          fen,
          latexPackage,
          flipped,
          showCoords,
          mode
        }),
        error: null
      };
    } catch (err: unknown) {
      return {
        code: '',
        error: err instanceof Error ? err.message : 'Could not build LaTeX'
      };
    }
  }, [fen, latexPackage, flipped, showCoords, mode]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Copy as LaTeX"
      icon={Code2}
    >
      <div className="flex flex-col gap-3.5">
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
            Package
          </h4>
          <div
            role="group"
            aria-label="LaTeX package"
            className="flex w-full rounded-lg border border-border/60 overflow-hidden"
          >
            {LATEX_PACKAGES.map((id, index) => (
              <button
                key={id}
                type="button"
                aria-pressed={latexPackage === id}
                onClick={() => setLatexPackage(id)}
                className={`${segmentButton(latexPackage === id)} ${
                  index === 0 ? 'border-r border-border/60' : ''
                }`}
              >
                {LATEX_PACKAGE_META[id].label}
              </button>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-text-muted">
            {LATEX_PACKAGE_META[latexPackage].description}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
            Output
          </h4>
          <div
            role="group"
            aria-label="LaTeX output"
            className="flex w-full rounded-lg border border-border/60 overflow-hidden"
          >
            {MODES.map((option, index) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={mode === option.value}
                onClick={() => setMode(option.value)}
                className={`${segmentButton(mode === option.value)} ${
                  index === 0 ? 'border-r border-border/60' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated">
            <pre
              tabIndex={0}
              aria-label="Generated LaTeX markup"
              className="scrollbar-native h-64 max-h-64 overflow-auto p-3 text-[11px] leading-relaxed font-mono text-text-secondary whitespace-pre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              {code}
            </pre>
          </div>
        )}

        <p className="text-[11px] text-text-muted">
          Orientation: {flipped ? 'black' : 'white'} at the bottom · Coordinates{' '}
          {showCoords ? 'on' : 'off'}
        </p>

        <button
          type="button"
          onClick={() => copy(code)}
          disabled={!code}
          className="w-full min-h-11 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? (
            <Check className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy LaTeX'}
        </button>
      </div>
    </ModalShell>
  );
});

LatexExportDialog.displayName = 'LatexExportDialog';
