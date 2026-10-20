import { memo, useMemo, useState } from 'react';

import { Check, Copy, Download } from '@/assets/icons';

import { useCopyToClipboard } from '@hooks';
import { sanitizeFileName } from '@utils';
import type {
  BuildResult,
  StudioPosition,
  StudioSettings
} from '../utils/latexProject';
import { latexRequirements } from '../utils/latexRequirements';
import { tokenizeLatexLine, type LatexTokenKind } from '../utils/latexSyntax';
import { segmentButton } from '../utils/controlStyles';
import { PreviewPanel } from './PreviewPanel';

const HIGHLIGHT_LINE_LIMIT = 1500;
const BYTES_PER_KB = 1024;

const TOKEN_CLASS: Record<LatexTokenKind, string> = {
  command: 'text-accent',
  key: 'text-success',
  bracket: 'text-text-muted',
  text: ''
};

const PRE_CLASS =
  'flex-1 rounded-xl border border-border bg-surface-elevated p-3 font-mono text-[12px] leading-relaxed text-text-secondary whitespace-pre-wrap break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const PRIMARY_BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-bg hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50';

const SECONDARY_BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50';

type OutputView = 'preview' | 'code';

const VIEWS: ReadonlyArray<{ value: OutputView; label: string }> = [
  { value: 'preview', label: 'Preview' },
  { value: 'code', label: 'Code' }
];

const CodeView = memo(function CodeView({ code }: { code: string }) {
  const lines = useMemo(
    () =>
      code.split('\n').map((text, offset) => ({ number: offset + 1, text })),
    [code]
  );
  if (lines.length > HIGHLIGHT_LINE_LIMIT) {
    return (
      <pre
        tabIndex={0}
        aria-label="Generated LaTeX source"
        className={PRE_CLASS}
      >
        {code}
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
            <span className="min-w-0">
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

const CommandLine = memo(function CommandLine({
  label,
  command
}: {
  label: string;
  command: string;
}) {
  const [copied, copy] = useCopyToClipboard();
  return (
    <div className="flex items-start gap-2">
      <code className="min-w-0 flex-1 break-all rounded-md bg-bg px-2.5 py-2 font-mono text-[11px] text-text-primary">
        {command}
      </code>
      <button
        type="button"
        onClick={() => copy(command)}
        aria-label={`Copy the ${label} command`}
        className="inline-flex size-9 min-h-0 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
  positions: StudioPosition[];
  settings: StudioSettings;
  fileName: string;
  onFileNameChange: (value: string) => void;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  className?: string;
}

export const OutputPanel = memo(function OutputPanel({
  build,
  positions,
  settings,
  fileName,
  onFileNameChange,
  copied,
  onCopy,
  onDownload,
  className = ''
}: OutputPanelProps) {
  const [view, setView] = useState<OutputView>('preview');
  const requirements = useMemo(() => latexRequirements(settings), [settings]);
  const safeName = sanitizeFileName(fileName);
  const summary = useMemo(() => {
    if (!build.code) return null;
    const diagrams = positions.length - build.skipped.length;
    const lines = build.code.split('\n').length;
    const kb = Math.max(
      1,
      Math.round(new Blob([build.code]).size / BYTES_PER_KB)
    );
    return `${diagrams} diagram${diagrams === 1 ? '' : 's'} · ${lines} lines · ${kb} KB`;
  }, [build, positions.length]);

  return (
    <section
      aria-labelledby="latex-output-title"
      className={`@container flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="latex-output-title"
            className="text-sm font-bold text-text-primary"
          >
            Output
          </h2>
          {summary && <p className="text-[11px] text-text-muted">{summary}</p>}
        </div>
        <div
          role="group"
          aria-label="Output view"
          className="flex overflow-hidden rounded-lg border border-border/60"
        >
          {VIEWS.map((option, index) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={view === option.value}
              onClick={() => setView(option.value)}
              className={`${segmentButton(view === option.value)} min-w-20 ${
                index < VIEWS.length - 1 ? 'border-r border-border/60' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-2 @xl:flex-row">
        <label className="flex min-w-0 flex-1 items-center rounded-lg border border-border bg-bg/40 focus-within:border-accent">
          <span className="sr-only">File name</span>
          <input
            type="text"
            value={fileName}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onFileNameChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary outline-none focus-visible:shadow-none"
          />
          <span className="pr-3 font-mono text-xs text-text-muted">.tex</span>
        </label>
        <div className="grid grid-cols-2 gap-2 @xl:flex">
          <button
            type="button"
            onClick={onCopy}
            disabled={!build.code}
            className={PRIMARY_BUTTON}
          >
            {copied ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!build.code}
            className={SECONDARY_BUTTON}
          >
            <Download className="size-4" aria-hidden="true" />
            Download
          </button>
        </div>
      </div>

      {build.skipped.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-xs text-text-secondary"
        >
          <p className="font-bold text-text-primary">
            {build.skipped.length} diagram
            {build.skipped.length === 1 ? ' is' : 's are'} left out
          </p>
          <ul className="mt-1 list-disc pl-4">
            {build.skipped.map((item) => (
              <li key={item.id}>
                Diagram {item.index + 1}: {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {build.error ? (
        <p
          role="alert"
          className="rounded-xl border border-error/40 bg-error/5 p-4 text-sm text-error"
        >
          {build.error}
        </p>
      ) : view === 'preview' ? (
        <PreviewPanel positions={positions} settings={settings} />
      ) : (
        <CodeView code={build.code} />
      )}

      <details className="group rounded-xl border border-border bg-bg/30 text-xs text-text-secondary">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 font-bold text-text-primary">
          Compile it yourself
          <span className="text-text-muted transition-transform duration-200 group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="flex flex-col gap-2 border-t border-border/60 p-3">
          <p className="text-text-muted">
            Needs {requirements.packages.join(', ')} from TeX Live or MiKTeX.
          </p>
          <CommandLine label="install" command={requirements.install} />
          <CommandLine
            label="compile"
            command={requirements.compile(safeName)}
          />
        </div>
      </details>
    </section>
  );
});
