import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react';
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
import { AREA, BUTTON, CONTROL, LABEL, PRIMARY } from './controls';
import { ConditionLibrary } from './ConditionLibrary';
import { Segmented } from './Segmented';
import styles from './styles/fairy-problem.module.scss';

interface FairyProblemProps {
  fen: string;
  onChange: (position: string) => void;
}

const CONDITION_NAMES = new Set(
  FAIRY_CONDITIONS.map((value) => value.toLowerCase())
);
const NOTATION_MODES = [
  { value: 'standard', label: 'Standard' },
  { value: 'structured', label: 'Structured' }
] as const;
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

function conditionName(value: string): string {
  return value.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
}

export const FairyProblem = memo(function FairyProblem({
  fen,
  onChange
}: FairyProblemProps) {
  const id = useId();
  const stipulationRef = useRef<HTMLInputElement>(null);
  const conditionsRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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

  const selectedConditions = useMemo(
    () =>
      new Set(
        draft.conditions.split(/\r?\n/).map(conditionName).filter(Boolean)
      ),
    [draft.conditions]
  );
  const metadataCount = useMemo(
    () => METADATA_KEYS.filter((key) => draft.metadata[key].trim()).length,
    [draft.metadata]
  );

  const markEdited = useCallback(() => {
    setError(null);
    setAppliedCommandsKey(null);
  }, []);

  const updateDraft = (changes: Partial<ProblemFields>) => {
    setDraft((current) => ({ ...current, ...changes }));
    markEdited();
  };

  const toggleCondition = useCallback(
    (value: string) => {
      setDraft((current) => {
        const lines = current.conditions.split(/\r?\n/);
        const name = conditionName(value);
        const selected = lines.some((line) => conditionName(line) === name);
        return {
          ...current,
          conditions: selected
            ? lines.filter((line) => conditionName(line) !== name).join('\n')
            : [...lines.filter((line) => line.trim()), value].join('\n')
        };
      });
      markEdited();
    },
    [markEdited]
  );

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
      ? 'Changes not applied. Apply them before saving.'
      : appliedCommandsKey !== null && appliedCommandsKey === commandsKey
        ? 'Applied to the position.'
        : 'No pending changes';

  const metadataField = (key: MetadataKey) => {
    const multiline = key === 'remark' || key === 'twin';
    return (
      <div key={key} className={styles.field}>
        <label className={LABEL} htmlFor={`${id}-${key}`}>
          {METADATA_LABELS[key]}
        </label>
        <textarea
          id={`${id}-${key}`}
          rows={multiline ? 3 : 1}
          maxLength={multiline ? 4000 : 200}
          className={`${AREA} ${multiline ? styles.notesInput : styles.metadataInput} ${key === 'twin' ? 'font-mono' : ''}`}
          value={draft.metadata[key]}
          spellCheck={key === 'twin' ? false : undefined}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setDraft((current) => ({
              ...current,
              metadata: { ...current.metadata, [key]: value }
            }));
            markEdited();
          }}
          {...(key === 'twin'
            ? { 'aria-describedby': `${id}-twins-hint` }
            : {})}
        />
        {key === 'twin' && (
          <p id={`${id}-twins-hint`} className={styles.hint}>
            One declaration per line, e.g. b) Move e4 e3.
          </p>
        )}
      </div>
    );
  };

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={styles.root}
      onClick={(event) => event.stopPropagation()}
    >
      <header className={styles.header}>
        <div>
          <h2 id={`${id}-heading`} className={styles.heading}>
            Popeye problem
          </h2>
          <p className={styles.description}>
            Set the goal, conditions and publication details.
          </p>
        </div>
        <div className={styles.fileActions}>
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
            className={BUTTON}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-3.5" aria-hidden="true" />
            Import
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={saveFile}
            disabled={isDirty}
            aria-describedby={isDirty ? `${id}-status` : undefined}
            title={
              isDirty
                ? 'Apply changes before saving the file.'
                : 'Save the current position as a Popeye input file.'
            }
          >
            <Download className="size-3.5" aria-hidden="true" />
            Save .inp
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.fields}>
          <div className={styles.field}>
            <div className={styles.fieldHeading}>
              <label className={LABEL} htmlFor={`${id}-stipulation`}>
                Stipulation
              </label>
              <Segmented
                label="Stipulation notation"
                value={draft.structured ? 'structured' : 'standard'}
                options={NOTATION_MODES}
                onChange={(value) =>
                  updateDraft({ structured: value === 'structured' })
                }
                className={styles.notationMode}
              />
            </div>
            <input
              ref={stipulationRef}
              id={`${id}-stipulation`}
              value={draft.stipulation}
              onChange={(event) =>
                updateDraft({ stipulation: event.currentTarget.value })
              }
              maxLength={200}
              placeholder={
                draft.structured
                  ? 'Popeye SStipulation expression'
                  : '#2, h#2, s#3…'
              }
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error?.field === 'stipulation' || undefined}
              aria-describedby={`${id}-stipulation-hint${error?.field === 'stipulation' ? ` ${id}-stipulation-error` : ''}`}
              className={`${CONTROL} ${styles.notationInput}`}
            />
            <p id={`${id}-stipulation-hint`} className={styles.hint}>
              {draft.structured
                ? 'Use Popeye SStipulation syntax for a structured expression.'
                : 'Enter the goal and move count, or choose a preset.'}
            </p>
            <div
              className={styles.presets}
              role="group"
              aria-label="Stipulation presets"
            >
              {STIPULATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={
                    !draft.structured && draft.stipulation.trim() === preset
                  }
                  className={styles.preset}
                  onClick={() =>
                    updateDraft({ stipulation: preset, structured: false })
                  }
                >
                  {preset}
                </button>
              ))}
            </div>
            {error?.field === 'stipulation' && (
              <p
                id={`${id}-stipulation-error`}
                role="alert"
                className="text-xs text-error"
              >
                {error.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <div className={styles.fieldHeading}>
              <label className={LABEL} htmlFor={`${id}-conditions`}>
                Conditions
              </label>
              <span className={styles.summaryMeta}>
                {selectedConditions.size
                  ? `${selectedConditions.size} added`
                  : 'Optional'}
              </span>
            </div>
            <textarea
              ref={conditionsRef}
              id={`${id}-conditions`}
              value={draft.conditions}
              onChange={(event) =>
                updateDraft({ conditions: event.currentTarget.value })
              }
              maxLength={4000}
              rows={2}
              placeholder={'Circe\nMadrasi RexInclusive'}
              spellCheck={false}
              aria-invalid={error?.field === 'conditions' || undefined}
              aria-describedby={`${id}-conditions-hint${error?.field === 'conditions' ? ` ${id}-conditions-error` : ''}`}
              className={`${AREA} ${styles.conditionsInput}`}
            />
            <p id={`${id}-conditions-hint`} className={styles.hint}>
              One condition per line. Add names from the library below.
            </p>
            {error?.field === 'conditions' && (
              <p
                id={`${id}-conditions-error`}
                role="alert"
                className="text-xs text-error"
              >
                {error.message}
              </p>
            )}
          </div>
        </div>

        <ConditionLibrary
          selected={selectedConditions}
          onToggle={toggleCondition}
        />

        <details className={styles.disclosure}>
          <summary className={styles.summary}>
            <ChevronRight className={styles.chevron} aria-hidden="true" />
            <span className={styles.summaryTitle}>Problem details</span>
            <span className={styles.summaryMeta}>
              {metadataCount
                ? `${metadataCount} filled`
                : 'Author, source and twins'}
            </span>
          </summary>
          <div className={styles.metadata}>
            {(['author', 'title', 'origin'] as const).map(metadataField)}
            <div className={styles.notes}>
              {metadataField('remark')}
              {metadataField('twin')}
            </div>
          </div>
        </details>
      </div>

      <footer className={styles.footer}>
        <p
          id={`${id}-status`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`${styles.status} ${error ? 'text-error' : isDirty ? 'text-text-secondary' : 'text-text-muted'}`}
        >
          {status}
        </p>
        <button
          type="button"
          onClick={saveProblem}
          disabled={!isDirty}
          aria-describedby={`${id}-status`}
          className={`${PRIMARY} ${styles.apply}`}
        >
          Apply to position
        </button>
      </footer>
    </section>
  );
});
