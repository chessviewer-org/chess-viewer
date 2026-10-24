import { memo, useMemo, type ReactNode } from 'react';

import { Check, Copy, Download } from '@/assets/icons';

import { useCopyToClipboard } from '@hooks';
import { sanitizeFileName } from '@utils';
import type { BuildResult, StudioSettings } from '../utils/latexProject';
import { latexRequirements } from '../utils/latexRequirements';
import { tokenizeLatexLine, type LatexTokenKind } from '../utils/latexSyntax';
import { Segmented, TextField } from './controls';

const HIGHLIGHT_LINE_LIMIT = 1500;

const TOKEN_CLASS: Record<LatexTokenKind, string> = {
  command: 'text-accent',
  key: 'text-success',
  bracket: 'text-text-muted',
  text: ''
};

const PRE_CLASS =
  'max-h-[70vh] min-h-64 overflow-auto p-3 font-mono text-[12px] leading-relaxed text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent';

const PRIMARY_BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50';

const SECONDARY_BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text-primary transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50';

export type OutputView = 'preview' | 'code';

const VIEWS: ReadonlyArray<{ value: OutputView; label: string }> = [
  { value: 'code', label: 'Code' },
  { value: 'preview', label: 'Preview' }
];

interface CodeLine {
  number: number;
  text: string;
}

const CodeView = memo(function CodeView({ lines }: { lines: CodeLine[] }) {
  if (lines.length > HIGHLIGHT_LINE_LIMIT) {
    return (
      <pre
        tabIndex={0}
        aria-label="Generated LaTeX source"
        className={PRE_CLASS}
      >
        <code>{lines.map((line) => line.text).join('\n')}</code>
      </pre>
    );
  }

  const gutter = String(lines.length).length;

  return (
    <pre tabIndex={0} aria-label="Generated LaTeX source" className={PRE_CLASS}>
      <code>
        {lines.map(({ number, text }) => (
          <span key={number} className="flex">
            <span
              aria-hidden="true"
              className="mr-4 shrink-0 select-none text-right text-text-muted/60"
              style={{ minWidth: `${gutter}ch` }}
            >
              {number}
            </span>
            <span className="whitespace-pre">
              {tokenizeLatexLine(text).map((token) => (
                <span key={token.start} className={TOKEN_CLASS[token.kind]}>
                  {token.text}
                </span>
              ))}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
});

interface CommandLineProps {
  label: string;
  command: string;
}

const CommandLine = memo(function CommandLine({
  label,
  command
}: CommandLineProps) {
  const [copied, copy] = useCopyToClipboard();
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-bg px-2.5 py-2 font-mono text-[11px] text-text-primary">
        {command}
      </code>
      <button
        type="button"
        onClick={() => copy(command)}
        aria-label={`Copy the ${label} command`}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {copied ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
});

interface OutputPanelProps {
  build: BuildResult;
  settings: StudioSettings;
  view: OutputView;
  onViewChange: (view: OutputView) => void;
  preview: ReactNode;
  fileName: string;
  onFileNameChange: (value: string) => void;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

export const OutputPanel = memo(function OutputPanel({
  build,
  settings,
  view,
  onViewChange,
  preview,
  fileName,
  onFileNameChange,
  copied,
  onCopy,
  onDownload
}: OutputPanelProps) {
  const lines = useMemo(
    () =>
      build.code
        .split('\n')
        .map((text, offset) => ({ number: offset + 1, text })),
    [build.code]
  );
  const requirements = useMemo(() => latexRequirements(settings), [settings]);
  const safeName = sanitizeFileName(fileName);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCopy}
          disabled={!build.code}
          className={`${PRIMARY_BUTTON} flex-1`}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy code'}
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={!build.code}
          className={`${SECONDARY_BUTTON} flex-1`}
        >
          <Download className="size-4" aria-hidden="true" />
          Download .tex
        </button>
      </div>

      <TextField
        label="File name"
        value={fileName}
        onChange={onFileNameChange}
        maxLength={80}
      />

      <Segmented
        label="View"
        value={view}
        options={VIEWS}
        onChange={onViewChange}
      />

      {build.error ? (
        <p
          role="alert"
          className="rounded-xl border border-error/40 bg-error/5 p-4 text-sm text-error"
        >
          {build.error}
        </p>
      ) : view === 'preview' ? (
        preview
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated">
          <CodeView lines={lines} />
        </div>
      )}

      {build.skipped.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-xs text-text-secondary"
        >
          <p className="font-bold text-text-primary">
            {build.skipped.length} position
            {build.skipped.length === 1 ? ' was' : 's were'} left out
          </p>
          <ul className="mt-1 list-disc pl-4">
            {build.skipped.map((item) => (
              <li key={item.id}>
                Position {item.index + 1}: {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 text-xs text-text-secondary">
        <p className="font-bold text-text-primary">Compile</p>
        <p className="text-text-muted">
          Needs {requirements.packages.join(', ')} from TeX Live or MiKTeX.
        </p>
        <CommandLine label="install" command={requirements.install} />
        <CommandLine label="compile" command={requirements.compile(safeName)} />
      </div>
    </div>
  );
});
