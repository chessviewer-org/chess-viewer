import { memo, useRef, useState, type ChangeEvent } from 'react';

import { Download, Plus, Undo2, Upload } from '@/assets/icons';

const BAR_BUTTON =
  'inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border/60 bg-surface px-2.5 py-2 sm:px-3 text-xs font-semibold text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40';

interface ProjectBarProps {
  canUndo: boolean;
  onUndo: () => void;
  onSave: () => void;
  onOpen: (file: File) => void;
  onReset: () => void;
}

export const ProjectBar = memo(function ProjectBar({
  canUndo,
  onUndo,
  onSave,
  onOpen,
  onReset
}: ProjectBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (file) onOpen(file);
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    onReset();
  };

  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-h2 font-bold tracking-tight text-text-primary">
          LaTeX Studio
        </h1>
        <div className="flex shrink-0 gap-1.5 sm:gap-2">
          <button
            type="button"
            className={BAR_BUTTON}
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
          >
            <Undo2 className="size-4" aria-hidden="true" />
            <span className="max-sm:hidden">Undo</span>
          </button>
          <button
            type="button"
            className={BAR_BUTTON}
            onClick={() => fileRef.current?.click()}
            aria-label="Open project"
          >
            <Upload className="size-4" aria-hidden="true" />
            <span className="max-sm:hidden">Open</span>
          </button>
          <button
            type="button"
            className={BAR_BUTTON}
            onClick={onSave}
            aria-label="Save project"
          >
            <Download className="size-4" aria-hidden="true" />
            <span className="max-sm:hidden">Save</span>
          </button>
          <button
            type="button"
            className={`${BAR_BUTTON} ${confirmReset ? 'border-error/50 text-error hover:text-error' : ''}`}
            onClick={handleReset}
            onBlur={() => setConfirmReset(false)}
            aria-label={
              confirmReset ? 'Click again to clear the project' : 'New project'
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="max-sm:hidden">
              {confirmReset ? 'Click again' : 'New'}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Open a LaTeX Studio project file"
            onChange={handleFile}
          />
        </div>
      </div>
      <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
        Turn FEN positions into print-ready LaTeX for books, articles and
        problem collections. Everything stays in your browser.
      </p>
    </header>
  );
});
