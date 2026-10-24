import { useEffect, useId, useMemo, useState } from 'react';
import { Search, X } from '@/assets/icons';
import { Checkbox } from '@/shared/ui/Checkbox';
import {
  FAIRY_ATTRIBUTES,
  FAIRY_CONDITIONS,
  FAIRY_WALKS
} from '@constants/fairyCatalogue';
import type { BoardCell } from '@app-types';
import { getPieceKey, piecePath } from '@/shared/utils/pieceUtils';
import { pieceSrc } from '@/shared/utils/pieceSources';
import { namedCell } from '@/shared/utils/fairyCells';
import {
  parseFEN,
  positionContext,
  serializePosition,
  validateFEN
} from '@/shared/utils/fenParser';

interface FairySetupProps {
  section: 'pieces' | 'problem';
  selectedPiece?: BoardCell | null;
  fen: string;
  pieceStyle: string;
  onPick: (piece: BoardCell) => void;
  onUseSymbols: () => void;
  onChange: (position: string) => void;
}
const PAGE_SIZE = 12;
const byName = new Intl.Collator().compare;
const WALKS_BY_NAME = FAIRY_WALKS.map((walk) => ({
  walk,
  search: `${walk.name} ${walk.code}`.toLowerCase()
})).sort((a, b) => byName(a.walk.name, b.walk.name));
const CONDITIONS = FAIRY_CONDITIONS.map((value) => ({
  value,
  search: value.toLowerCase()
}));
const CONTROL =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const BUTTON =
  'min-h-9 rounded-lg px-3 py-1.5 text-sm border border-border cursor-pointer hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function FairySetup({
  section,
  selectedPiece,
  fen,
  pieceStyle,
  onPick,
  onUseSymbols,
  onChange
}: FairySetupProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [color, setColor] = useState<'w' | 'b' | 'n'>('w');
  const [attrs, setAttrs] = useState<string[]>([]);
  const [stipulation, setStipulation] = useState('');
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [structured, setStructured] = useState(false);
  const [conditions, setConditions] = useState('');
  const [error, setError] = useState('');

  const commandsKey = useMemo(
    () =>
      validateFEN(fen)
        ? JSON.stringify(positionContext(fen).commands ?? [])
        : null,
    [fen]
  );
  useEffect(() => {
    if (commandsKey === null) return;
    const commands = JSON.parse(commandsKey) as Array<{
      keyword: string;
      value: string;
    }>;
    setMetadata(
      Object.fromEntries(
        ['author', 'title', 'origin', 'remark', 'twin'].map((key) => [
          key,
          commands
            .filter((command) => command.keyword === key)
            .map((command) => command.value)
            .join('\n')
        ])
      )
    );
    setStructured(
      commands.some((command) => command.keyword === 'sstipulation')
    );
    setStipulation(
      commands.find((command) =>
        ['stipulation', 'sstipulation'].includes(command.keyword)
      )?.value ?? ''
    );
    setConditions(
      commands
        .filter((command) => command.keyword === 'condition')
        .map((command) => command.value)
        .join('\n')
    );
  }, [commandsKey]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return WALKS_BY_NAME.filter(({ search }) => search.includes(term)).map(
      ({ walk }) => walk
    );
  }, [query]);
  const lastPage = Math.max(0, Math.ceil(results.length / PAGE_SIZE) - 1);
  const conditionMatches = useMemo(() => {
    const term = query.toLowerCase();
    return CONDITIONS.filter(({ search }) => search.includes(term))
      .slice(0, 24)
      .map(({ value }) => value);
  }, [query]);

  const saveProblem = () => {
    if (!validateFEN(fen)) {
      setError('Correct the position notation before editing the problem.');
      return;
    }
    if (/[\r\n]/.test(stipulation)) {
      setError('Enter the stipulation on one line.');
      return;
    }
    const context = positionContext(fen);
    const commands = (context.commands ?? []).filter(
      (command) =>
        ![
          'stipulation',
          'sstipulation',
          'condition',
          'author',
          'title',
          'origin',
          'remark',
          'twin'
        ].includes(command.keyword)
    );
    if (stipulation.trim())
      commands.push({
        keyword: structured ? 'sstipulation' : 'stipulation',
        value: stipulation.trim()
      });
    for (const [keyword, text] of Object.entries(metadata)) {
      for (const value of text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean))
        commands.push({ keyword, value });
    }
    for (const line of conditions
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean)) {
      const keyword = line.split(/\s+/)[0]!;
      if (
        !FAIRY_CONDITIONS.some(
          (value) => value.toLowerCase() === keyword.toLowerCase()
        )
      ) {
        setError(`Unknown Popeye condition: ${keyword}.`);
        return;
      }
      commands.push({ keyword: 'condition', value: line });
    }
    const value = serializePosition(parseFEN(fen), { ...context, commands });
    if (!validateFEN(value)) {
      setError(
        'The problem could not be saved. Check the stipulation and conditions.'
      );
      return;
    }
    onChange(value);
    setError('Problem saved.');
  };

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-text-primary">
          {section === 'pieces' ? 'Piece catalogue' : 'Problem'}
        </h2>
        {section === 'pieces' && (
          <button
            type="button"
            className={`${BUTTON} text-text-secondary`}
            onClick={onUseSymbols}
          >
            Reset symbols
          </button>
        )}
      </div>
      {section === 'pieces' ? (
        <>
          <div
            role="group"
            aria-label="Fairy piece color"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                ['w', 'White'],
                ['b', 'Black'],
                ['n', 'Neutral']
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`${BUTTON} ${color === value ? 'text-accent bg-surface-hover' : 'text-text-secondary'}`}
                aria-pressed={color === value}
                onClick={() => setColor(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <details className="text-sm text-text-secondary">
            <summary className="cursor-pointer py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Attributes{attrs.length ? ` (${attrs.length})` : ''}
            </summary>
            <div className="flex flex-col mt-2">
              {FAIRY_ATTRIBUTES.map((attribute) => (
                <Checkbox
                  key={attribute}
                  label={attribute}
                  checked={attrs.includes(attribute)}
                  onChange={(event) =>
                    setAttrs((current) =>
                      event.target.checked
                        ? [...current, attribute]
                        : current.filter((value) => value !== attribute)
                    )
                  }
                />
              ))}
            </div>
          </details>
        </>
      ) : (
        <>
          <label
            className="block text-sm text-text-secondary"
            htmlFor={`${id}-stipulation`}
          >
            Stipulation
          </label>
          <input
            id={`${id}-stipulation`}
            value={stipulation}
            onChange={(event) => setStipulation(event.currentTarget.value)}
            maxLength={200}
            placeholder="h#2"
            className={CONTROL}
          />
          <label
            className="block text-sm text-text-secondary"
            htmlFor={`${id}-conditions`}
          >
            Conditions
          </label>
          <textarea
            id={`${id}-conditions`}
            value={conditions}
            onChange={(event) => setConditions(event.currentTarget.value)}
            maxLength={4000}
            rows={3}
            placeholder="Circe&#10;Madrasi RexInclusive"
            className={`${CONTROL} resize-none font-mono`}
          />
        </>
      )}
      <div className="relative">
        <label className="sr-only" htmlFor={`${id}-search`}>
          {section === 'pieces'
            ? 'Search fairy pieces'
            : 'Search fairy conditions'}
        </label>
        <Search
          className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={`${id}-search`}
          className={`${CONTROL} pl-9 pr-10`}
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setPage(0);
          }}
          placeholder={
            section === 'pieces'
              ? 'Search pieces or codes'
              : 'Search conditions'
          }
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="absolute right-1 top-0 min-w-9 min-h-9 rounded-lg hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setPage(0);
              document.getElementById(`${id}-search`)?.focus();
            }}
          >
            <X className="w-4 h-4 mx-auto" aria-hidden="true" />
          </button>
        )}
      </div>
      {section === 'pieces' ? (
        <>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            aria-label="Fairy piece catalogue"
          >
            {results
              .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
              .map((walk) => {
                const cell = namedCell(color, walk.code, attrs);
                const source = pieceSrc(
                  piecePath(pieceStyle, getPieceKey(cell) ?? cell)
                );
                return (
                  <button
                    type="button"
                    key={walk.code}
                    onClick={() => {
                      onPick(cell);
                    }}
                    className="min-w-0 flex flex-col items-center gap-1 border border-border rounded-lg p-2 cursor-pointer hover:bg-surface-hover hover:border-accent aria-pressed:border-accent aria-pressed:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={`Select ${color === 'w' ? 'white' : color === 'b' ? 'black' : 'neutral'} ${walk.name}`}
                    aria-pressed={selectedPiece === cell}
                    title={`${walk.code} — ${walk.name}`}
                  >
                    <img
                      src={source}
                      loading="lazy"
                      decoding="async"
                      alt=""
                      className="w-10 h-10 object-contain"
                      width={40}
                      height={40}
                    />
                    <span className="text-xs text-text-primary text-center break-words">
                      {walk.name}
                    </span>
                    <span className="text-xs font-mono text-text-secondary">
                      {walk.code}
                    </span>
                  </button>
                );
              })}
          </div>
          {results.length === 0 && (
            <p
              role="status"
              className="text-sm text-text-secondary py-4 text-center"
            >
              No matching fairy pieces.
            </p>
          )}
          <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
            <button
              type="button"
              className={BUTTON}
              disabled={page === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              Previous
            </button>
            <span aria-live="polite">
              {results.length
                ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, results.length)} of ${results.length}`
                : '0 pieces'}
            </span>
            <button
              type="button"
              className={BUTTON}
              disabled={page >= lastPage}
              onClick={() => setPage((value) => Math.min(lastPage, value + 1))}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="flex flex-wrap gap-2"
            aria-label="Available fairy conditions"
          >
            {conditionMatches.map((value) => (
              <button
                type="button"
                key={value}
                className={`${BUTTON} text-text-secondary`}
                onClick={() =>
                  setConditions((current) =>
                    [
                      ...new Set([
                        ...current.split(/\r?\n/).filter(Boolean),
                        value
                      ])
                    ].join('\n')
                  )
                }
              >
                {value}
              </button>
            ))}
          </div>
          {conditionMatches.length === 0 && (
            <p role="status" className="text-sm text-text-secondary">
              No matching conditions.
            </p>
          )}
          {error && (
            <p
              role="status"
              className={`text-sm ${error === 'Problem saved.' ? 'text-text-secondary' : 'text-error'}`}
            >
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['author', 'title', 'origin', 'remark', 'twin'] as const).map(
              (key) => (
                <label
                  key={key}
                  className={`block text-sm text-text-secondary ${key === 'remark' || key === 'twin' ? 'sm:col-span-2' : ''}`}
                >
                  <span className="block mb-1">
                    {
                      {
                        author: 'Author',
                        title: 'Title',
                        origin: 'Source',
                        remark: 'Remark',
                        twin: 'Twins'
                      }[key]
                    }
                  </span>
                  {key === 'remark' || key === 'twin' ? (
                    <textarea
                      rows={2}
                      maxLength={4000}
                      className={`${CONTROL} resize-none`}
                      value={metadata[key] ?? ''}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setMetadata((current) => ({
                          ...current,
                          [key]: value
                        }));
                      }}
                    />
                  ) : (
                    <input
                      maxLength={200}
                      className={CONTROL}
                      value={metadata[key] ?? ''}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setMetadata((current) => ({
                          ...current,
                          [key]: value
                        }));
                      }}
                    />
                  )}
                </label>
              )
            )}
          </div>
          <button
            type="button"
            onClick={saveProblem}
            className="w-full min-h-11 rounded-lg bg-accent text-bg font-semibold hover:bg-accent-hover cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Apply problem
          </button>
        </>
      )}
    </div>
  );
}
