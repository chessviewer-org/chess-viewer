import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FAIRY_CONDITIONS } from '@constants/fairyCatalogue';
import { ChevronRight, Download, Upload } from '@/assets/icons';
import {
  parseFEN,
  positionContext,
  serializePosition,
  validateFEN,
  validateFENDetailed
} from '@/shared/utils/fenParser';
import {
  MAX_COMPOSITION_LENGTH,
  popeyeStipulation,
  serializePopeye
} from '@/shared/utils/popeye';
import { saveBlob } from '@/shared/utils/saveBlob';
import { AREA, BUTTON, CHIP, CONTROL, LABEL, PRIMARY } from './controls';
import { SearchField } from './SearchField';

interface FairyProblemProps {
  fen: string;
  onChange: (position: string) => void;
}

const CONDITIONS = FAIRY_CONDITIONS.map((value) => ({
  value,
  search: value.toLowerCase()
}));
const CONDITION_NAMES = new Set(CONDITIONS.map(({ search }) => search));
const STIPULATION_PRESETS = [
  '#2',
  '#3',
  'h#2',
  'h#3',
  's#2',
  'hs#2',
  'ser-h#5'
];
const METADATA_KEYS = ['author', 'title', 'origin', 'remark', 'twin'] as const;
type MetadataKey = (typeof METADATA_KEYS)[number];
const METADATA_LABELS: Record<MetadataKey, string> = {
  author: 'Author',
  title: 'Title',
  origin: 'Source',
  remark: 'Remark',
  twin: 'Twins'
};
const PROBLEM_KEYWORDS = new Set<string>([
  'stipulation',
  'sstipulation',
  'condition',
  ...METADATA_KEYS
]);

interface ProblemFields {
  stipulation: string;
  structured: boolean;
  conditions: string;
  metadata: Record<MetadataKey, string>;
}

interface ProblemError {
  field: 'stipulation' | 'conditions' | 'position';
  message: string;
}

function readProblem(commandsKey: string | null): ProblemFields {
  const commands = JSON.parse(commandsKey ?? '[]') as Array<{
    keyword: string;
    value: string;
  }>;
  const stipulation = popeyeStipulation(commands);
  return {
    stipulation: stipulation?.value ?? '',
    structured: stipulation?.keyword === 'sstipulation',
    conditions: commands
      .filter((command) => command.keyword === 'condition')
      .map((command) => command.value)
      .join('\n'),
    metadata: Object.fromEntries(
      METADATA_KEYS.map((key) => [
        key,
        commands
          .filter((command) => command.keyword === key)
          .map((command) => command.value)
          .join('\n')
      ])
    ) as ProblemFields['metadata']
  };
}

function normalizeCondition(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export const FairyProblem = memo(function FairyProblem({
  fen,
  onChange
}: FairyProblemProps) {
  const id = useId();
  const stipulationRef = useRef<HTMLInputElement>(null);
  const conditionsRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<ProblemError | null>(null);
  const [appliedCommandsKey, setAppliedCommandsKey] = useState<string | null>(
    null
  );

  // Only command changes replace the draft; moving a board piece keeps edits.
  const commandsKey = useMemo(
    () =>
      validateFEN(fen)
        ? JSON.stringify(positionContext(fen).commands ?? [])
        : null,
    [fen]
  );
  const initialProblem = useMemo(() => readProblem(commandsKey), [commandsKey]);
  const [draft, setDraft] = useState(initialProblem);
  const [savedDraft, setSavedDraft] = useState(initialProblem);

  useEffect(() => {
    if (commandsKey === null) return;
    setDraft(initialProblem);
    setSavedDraft(initialProblem);
    setError(null);
  }, [commandsKey, initialProblem]);

  const isDirty =
    draft.stipulation !== savedDraft.stipulation ||
    draft.structured !== savedDraft.structured ||
    draft.conditions !== savedDraft.conditions ||
    METADATA_KEYS.some(
      (key) => draft.metadata[key] !== savedDraft.metadata[key]
    );

  const conditionMatches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return CONDITIONS.filter(({ search }) => search.includes(term));
  }, [query]);
  const selectedConditions = useMemo(
    () => new Set(draft.conditions.split(/\r?\n/).map(normalizeCondition)),
    [draft.conditions]
  );
  const metadataCount = useMemo(
    () => METADATA_KEYS.filter((key) => draft.metadata[key].trim()).length,
    [draft.metadata]
  );

  const markEdited = () => {
    setError(null);
    setAppliedCommandsKey(null);
  };

  const updateDraft = (changes: Partial<ProblemFields>) => {
    setDraft((current) => ({ ...current, ...changes }));
    markEdited();
  };

  const toggleCondition = (value: string) => {
    setDraft((current) => {
      const lines = current.conditions.split(/\r?\n/);
      const name = normalizeCondition(value);
      const selected = lines.some((line) => normalizeCondition(line) === name);
      return {
        ...current,
        conditions: selected
          ? lines.filter((line) => normalizeCondition(line) !== name).join('\n')
          : [...lines.filter((line) => line.trim()), value].join('\n')
      };
    });
    markEdited();
  };

  const reportError = (field: ProblemError['field'], message: string) => {
    setError({ field, message });
    if (field === 'stipulation') stipulationRef.current?.focus();
    if (field === 'conditions') conditionsRef.current?.focus();
  };

  const saveProblem = () => {
    if (!isDirty) return;
    if (!validateFEN(fen)) {
      reportError(
        'position',
        'Correct the position notation before applying this problem.'
      );
      return;
    }
    if (/[\r\n]/.test(draft.stipulation)) {
      reportError('stipulation', 'Enter the stipulation on one line.');
      return;
    }
    const context = positionContext(fen);
    const commands = (context.commands ?? []).filter(
      (command) => !PROBLEM_KEYWORDS.has(command.keyword)
    );
    if (draft.stipulation.trim())
      commands.push({
        keyword: draft.structured ? 'sstipulation' : 'stipulation',
        value: draft.stipulation.trim()
      });
    for (const keyword of METADATA_KEYS) {
      for (const value of draft.metadata[keyword]
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean))
        commands.push({ keyword, value });
    }
    for (const [index, rawLine] of draft.conditions.split(/\r?\n/).entries()) {
      const line = rawLine.trim();
      if (!line) continue;
      const [keyword = ''] = line.split(/\s+/);
      if (!CONDITION_NAMES.has(keyword.toLowerCase())) {
        reportError(
          'conditions',
          `Line ${index + 1}: unknown condition “${keyword}”. Check its spelling or choose from the library.`
        );
        return;
      }
      commands.push({ keyword: 'condition', value: line });
    }
    const value = serializePosition(parseFEN(fen), { ...context, commands });
    if (!validateFEN(value)) {
      reportError(
        'conditions',
        'The problem could not be applied. Check the stipulation and conditions.'
      );
      return;
    }
    setAppliedCommandsKey(
      JSON.stringify(positionContext(value).commands ?? [])
    );
    setSavedDraft(draft);
    setError(null);
    onChange(value);
  };

  const importFile = async (file: File) => {
    if (file.size > MAX_COMPOSITION_LENGTH * 4) {
      reportError('position', 'The composition file is too large.');
      return;
    }
    const source = (await file.text()).trim();
    const validation = validateFENDetailed(source);
    if (!validation.isValid) {
      reportError(
        'position',
        validation.errorMessage ?? 'This file is not a valid position.'
      );
      return;
    }
    onChange(source);
  };

  const saveFile = () => {
    const validation = validateFENDetailed(fen);
    if (!validation.isValid) {
      reportError(
        'position',
        validation.errorMessage ?? 'Correct the position before saving.'
      );
      return;
    }
    const context = positionContext(fen);
    saveBlob(
      new Blob(
        [
          serializePopeye(parseFEN(fen), {
            ...context,
            commands: context.commands ?? []
          })
        ],
        { type: 'text/plain;charset=utf-8' }
      ),
      'fairy-position',
      'inp'
    );
  };

  const status = error
    ? error.field === 'position'
      ? error.message
      : 'Review the highlighted field.'
    : isDirty
      ? 'Unsaved changes'
      : appliedCommandsKey !== null && appliedCommandsKey === commandsKey
        ? 'Applied to the position.'
        : 'Up to date';

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="@container space-y-4 rounded-xl border border-border/40 bg-surface-elevated p-3"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id={`${id}-heading`}
          className="text-xs font-bold tracking-[0.075em] text-text-secondary uppercase"
        >
          Popeye problem
        </h2>
        <div className="flex gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept=".inp,.txt,.fen"
            className="sr-only"
            aria-label="Import a Popeye or FEN file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void importFile(file);
              event.currentTarget.value = '';
            }}
          />
          <button
            type="button"
            className={`${BUTTON} h-8`}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-3.5" aria-hidden="true" />
            Import
          </button>
          <button type="button" className={`${BUTTON} h-8`} onClick={saveFile}>
            <Download className="size-3.5" aria-hidden="true" />
            Save .inp
          </button>
        </div>
      </div>

      <div className="grid gap-4 @3xl:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className={LABEL} htmlFor={`${id}-stipulation`}>
              Stipulation
            </label>
            <button
              type="button"
              aria-pressed={draft.structured}
              title="Write the stipulation as a Popeye SStipulation expression"
              className={`${CHIP} h-7`}
              onClick={() => updateDraft({ structured: !draft.structured })}
            >
              Structured
            </button>
          </div>
          <input
            ref={stipulationRef}
            id={`${id}-stipulation`}
            value={draft.stipulation}
            onChange={(event) =>
              updateDraft({ stipulation: event.currentTarget.value })
            }
            maxLength={200}
            placeholder="#2, h#2, s#3…"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error?.field === 'stipulation' || undefined}
            aria-describedby={`${id}-stipulation-error`}
            className={`${CONTROL} font-mono`}
          />
          <div className="flex flex-wrap gap-1.5">
            {STIPULATION_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={draft.stipulation.trim() === preset}
                className={`${CHIP} h-7 px-2.5 font-mono`}
                onClick={() =>
                  updateDraft({ stipulation: preset, structured: false })
                }
              >
                {preset}
              </button>
            ))}
          </div>
          {error?.field === 'stipulation' && (
            <p id={`${id}-stipulation-error`} className="text-xs text-error">
              {error.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className={LABEL} htmlFor={`${id}-conditions`}>
            Conditions
          </label>
          <textarea
            ref={conditionsRef}
            id={`${id}-conditions`}
            value={draft.conditions}
            onChange={(event) =>
              updateDraft({ conditions: event.currentTarget.value })
            }
            maxLength={4000}
            rows={2}
            placeholder={'One per line, e.g.\nMadrasi RexInclusive'}
            spellCheck={false}
            aria-invalid={error?.field === 'conditions' || undefined}
            aria-describedby={`${id}-conditions-error`}
            className={`${AREA} font-mono [field-sizing:content] min-h-16`}
          />
          {error?.field === 'conditions' && (
            <p id={`${id}-conditions-error`} className="text-xs text-error">
              {error.message}
            </p>
          )}
          <details className="group/library rounded-lg border border-border/70">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-xs text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
              <ChevronRight
                className="size-3.5 shrink-0 group-open/library:rotate-90"
                aria-hidden="true"
              />
              <span className="flex-1">Condition library</span>
              <span className="font-mono text-text-muted">
                {CONDITIONS.length}
              </span>
            </summary>
            <div className="space-y-2 border-t border-border/70 p-3">
              <SearchField
                label="Search fairy conditions"
                placeholder="Search conditions"
                value={query}
                onChange={setQuery}
              />
              <div
                role="group"
                aria-label="Available fairy conditions"
                className="flex max-h-48 flex-wrap content-start gap-1.5 overflow-y-auto overscroll-contain"
              >
                {conditionMatches.map(({ value, search }) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={selectedConditions.has(search)}
                    className={`${CHIP} h-7 px-2.5`}
                    onClick={() => toggleCondition(value)}
                  >
                    {value}
                  </button>
                ))}
                {conditionMatches.length === 0 && (
                  <p className="w-full py-4 text-center text-xs text-text-secondary">
                    No condition matches “{query.trim()}”.
                  </p>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>

      <details className="group/details rounded-lg border border-border/70">
        <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-xs text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="size-3.5 shrink-0 group-open/details:rotate-90"
            aria-hidden="true"
          />
          <span className="flex-1">Author, source and twins</span>
          <span className="text-text-muted">
            {metadataCount ? `${metadataCount} filled` : 'Optional'}
          </span>
        </summary>
        <div className="grid grid-cols-1 gap-3 border-t border-border/70 p-3 sm:grid-cols-3">
          {METADATA_KEYS.map((key) => (
            <div
              key={key}
              className={
                key === 'remark' || key === 'twin'
                  ? 'space-y-1.5 sm:col-span-3'
                  : 'space-y-1.5'
              }
            >
              <label className={LABEL} htmlFor={`${id}-${key}`}>
                {METADATA_LABELS[key]}
              </label>
              <textarea
                id={`${id}-${key}`}
                rows={1}
                maxLength={key === 'remark' || key === 'twin' ? 4000 : 200}
                className={`${AREA} py-1.5 [field-sizing:content] min-h-9`}
                value={draft.metadata[key]}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setDraft((current) => ({
                    ...current,
                    metadata: { ...current.metadata, [key]: value }
                  }));
                  markEdited();
                }}
              />
            </div>
          ))}
        </div>
      </details>

      <footer className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
        <p
          id={`${id}-status`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`min-w-0 text-xs ${error ? 'text-error' : isDirty ? 'text-text-secondary' : 'text-text-muted'}`}
        >
          {status}
        </p>
        <button
          type="button"
          onClick={saveProblem}
          disabled={!isDirty}
          aria-describedby={`${id}-status`}
          className={PRIMARY}
        >
          Apply
        </button>
      </footer>
    </section>
  );
});
