import { memo, useRef, useState, type ChangeEvent } from 'react';

import { Download, Plus, Undo2, Upload } from '@/assets/icons';

const BAR_BUTTON =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40';

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
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-h2 font-bold tracking-tight text-text-primary">
          LaTeX Studio
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Turn FEN positions into print-ready LaTeX for books, articles and
          problem collections. Everything stays in your browser.
        </p>
      </div>

      <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        <button
          type="button"
          className={BAR_BUTTON}
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 className="size-4" aria-hidden="true" />
          Undo
        </button>
        <button
          type="button"
          className={BAR_BUTTON}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden="true" />
          Open
        </button>
        <button type="button" className={BAR_BUTTON} onClick={onSave}>
          <Download className="size-4" aria-hidden="true" />
          Save
        </button>
        <button
          type="button"
          className={`${BAR_BUTTON} ${confirmReset ? 'border-error/50 text-error hover:text-error' : ''}`}
          onClick={handleReset}
          onBlur={() => setConfirmReset(false)}
        >
          <Plus className="size-4" aria-hidden="true" />
          {confirmReset ? 'Click again to clear' : 'New project'}
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
    </header>
  );
});
