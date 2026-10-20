import { memo, useMemo } from 'react';

import { Check, Copy, Download } from '@/assets/icons';

import { useCopyToClipboard } from '@hooks';
import { sanitizeFileName } from '@utils';
import type { BuildResult, StudioSettings } from '../utils/latexProject';
import { latexRequirements } from '../utils/latexRequirements';

const BYTES_PER_KB = 1024;

const PRIMARY_BUTTON =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-bg hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50';

const SECONDARY_BUTTON =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text-primary hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50';

const CommandLine = memo(function CommandLine({
  label,
  command
}: {
  label: string;
  command: string;
}) {
  const [copied, copy] = useCopyToClipboard();
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <div className="flex items-start gap-1">
        <code className="min-w-0 flex-1 break-all rounded-md bg-bg px-2.5 py-2 font-mono text-[11px] leading-relaxed text-text-primary">
          {command}
        </code>
        <button
          type="button"
          onClick={() => copy(command)}
          aria-label={`Copy the ${label.toLowerCase()} command`}
          className="inline-flex size-9 min-h-0 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
});

interface ExportCardProps {
  build: BuildResult;
  total: number;
  settings: StudioSettings;
  fileName: string;
  onFileNameChange: (value: string) => void;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

export const ExportCard = memo(function ExportCard({
  build,
  total,
  settings,
  fileName,
  onFileNameChange,
  copied,
  onCopy,
  onDownload
}: ExportCardProps) {
  const requirements = useMemo(() => latexRequirements(settings), [settings]);
  const stats = useMemo(() => {
    if (!build.code) return null;
    return {
      diagrams: total - build.skipped.length,
      lines: build.code.split('\n').length,
      kb: Math.max(1, Math.round(new Blob([build.code]).size / BYTES_PER_KB))
    };
  }, [build, total]);

  return (
    <section
      aria-labelledby="latex-export-title"
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <h2
        id="latex-export-title"
        className="text-sm font-bold text-text-primary"
      >
        Export
      </h2>

      {stats && (
        <dl className="grid grid-cols-3 divide-x divide-border/60 rounded-lg border border-border/60 text-center">
          {[
            ['Diagrams', stats.diagrams],
            ['Lines', stats.lines],
            ['KB', stats.kb]
          ].map(([label, value]) => (
            <div key={label} className="px-2 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {label}
              </dt>
              <dd className="text-sm font-bold tabular-nums text-text-primary">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {build.error && (
        <p
          role="alert"
          className="rounded-lg border border-error/40 bg-error/5 p-3 text-xs text-error"
        >
          {build.error}
        </p>
      )}

      {build.skipped.length > 0 && (
        <div
          role="status"
          className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs text-text-secondary"
        >
          <p className="font-bold text-text-primary">
            {build.skipped.length} diagram
            {build.skipped.length === 1 ? ' is' : 's are'} left out
          </p>
          <ul className="mt-1 list-disc pl-4">
            {build.skipped.map((item) => (
              <li key={item.id} className="break-words">
                No. {item.index + 1}: {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          File name
        </span>
        <span className="flex min-w-0 items-center rounded-lg border border-border bg-bg/40 focus-within:border-accent">
          <input
            type="text"
            value={fileName}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onFileNameChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary outline-none"
          />
          <span className="pr-3 font-mono text-xs text-text-muted">.tex</span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onDownload}
          disabled={!build.code}
          className={PRIMARY_BUTTON}
        >
          <Download className="size-4" aria-hidden="true" />
          Download
        </button>
        <button
          type="button"
          onClick={onCopy}
          disabled={!build.code}
          className={SECONDARY_BUTTON}
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-4">
        <p className="text-xs leading-relaxed text-text-secondary">
          Compile with pdfLaTeX. Needs{' '}
          <span className="font-semibold text-text-primary">
            {requirements.packages.join(', ')}
          </span>{' '}
          from TeX Live or MiKTeX.
        </p>
        <CommandLine label="Install" command={requirements.install} />
        <CommandLine
          label="Compile"
          command={requirements.compile(sanitizeFileName(fileName))}
        />
      </div>
    </section>
  );
});
