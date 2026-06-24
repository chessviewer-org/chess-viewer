import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  Palette,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X
} from 'lucide-react';

import { useNotifications, useThemePresets } from '@hooks';
import { BOARD_THEMES } from '@constants';

import { Pagination } from '@shared/ui';

import { ColorPickerPanel } from './parts/ColorPickerPanel';
import { Swatch } from './parts/Swatch';

interface BoardThemePickerProps {
  lightSquare: string;
  darkSquare: string;
  onApply: (light: string, dark: string) => void;
  maxRows?: number;
}

const MAX_NAME_LEN = 10;
const DEFAULT_LIGHT = BOARD_THEMES['classic']?.light ?? '#f0d9b5';
const DEFAULT_DARK = BOARD_THEMES['classic']?.dark ?? '#b58863';

const MAIN_THEMES = Object.entries(BOARD_THEMES).map(([key, t]) => ({
  key,
  name: t.name,
  light: t.light,
  dark: t.dark
}));

function colsFromWidth(px: number): number {
  if (px >= 700) return 10;
  if (px >= 600) return 9;
  if (px >= 500) return 8;
  if (px >= 380) return 7;
  if (px >= 280) return 6;
  return 5;
}

function rowsFromWidth(px: number): number {
  return px < 480 ? 3 : 4;
}

type ActiveTab = 'main' | 'custom';

const BoardThemePicker = memo(function BoardThemePicker({
  lightSquare,
  darkSquare,
  onApply,
  maxRows
}: BoardThemePickerProps) {
  const { customPresets, savePreset, deletePreset, updatePreset } =
    useThemePresets();
  const { warning } = useNotifications();

  const [tab, setTab] = useState<ActiveTab>('main');
  const [mainPage, setMainPage] = useState(0);

  const [saveTarget, setSaveTarget] = useState<{
    id?: number;
    name: string;
    light: string;
    dark: string;
  } | null>(null);

  const returnToPageRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(8);
  const [rows, setRows] = useState(4);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = (width: number) => {
      setCols(colsFromWidth(width));
      const computed = rowsFromWidth(width);
      setRows(maxRows !== undefined ? Math.min(computed, maxRows) : computed);
    };
    const obs = new ResizeObserver(([entry]) => {
      if (entry) apply(entry.contentRect.width);
    });
    obs.observe(el);
    apply(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, [maxRows]);

  const perPage = rows * cols;

  type Tile = {
    key: string;
    name: string;
    light: string;
    dark: string;
    custom?: number;
  };
  const builtInTiles: Tile[] = MAIN_THEMES.map((t) => ({
    key: `b-${t.key}`,
    name: t.name,
    light: t.light,
    dark: t.dark
  }));
  const customTiles: Tile[] = customPresets.map((p) => ({
    key: `c-${p.id}`,
    name: p.name,
    light: p.light,
    dark: p.dark,
    custom: p.id
  }));

  const allMainTiles = [...builtInTiles, ...customTiles];
  const mainItemCount = allMainTiles.length + 1;
  const mainPages = Math.max(1, Math.ceil(mainItemCount / perPage));
  const mainSlice = allMainTiles.slice(
    mainPage * perPage,
    (mainPage + 1) * perPage
  );
  const showMainAddBtn = mainPage === mainPages - 1;

  useEffect(() => {
    setMainPage((p) => Math.min(p, mainPages - 1));
  }, [mainPages]);

  const handleSaveCustom = useCallback(
    (name: string, light: string, dark: string) => {
      const normalLight = light.toLowerCase();
      const normalDark = dark.toLowerCase();
      const isEdit = saveTarget?.id !== undefined;

      if (!isEdit) {
        const builtInMatch = MAIN_THEMES.find(
          (t) =>
            t.light.toLowerCase() === normalLight &&
            t.dark.toLowerCase() === normalDark
        );
        if (builtInMatch) {
          warning(`Bu rəng cütü artıq mövcuddur: "${builtInMatch.name}"`, 5000);
          return;
        }
        const customMatch = customPresets.find(
          (p) =>
            p.light.toLowerCase() === normalLight &&
            p.dark.toLowerCase() === normalDark
        );
        if (customMatch) {
          warning(`Bu rəng cütü artıq mövcuddur: "${customMatch.name}"`, 5000);
          return;
        }
      }

      let finalName = name;
      if (!finalName) {
        const used = new Set(customPresets.map((p) => p.name.toLowerCase()));
        let n = customPresets.length + 1;
        while (used.has(`custom ${n}`.toLowerCase())) n += 1;
        finalName = `Custom ${n}`.slice(0, MAX_NAME_LEN);
      }

      if (isEdit && saveTarget?.id !== undefined) {
        updatePreset(saveTarget.id, { name: finalName, light, dark });
      } else {
        savePreset(finalName, light, dark);
        onApply(light, dark);
      }

      setSaveTarget(null);
      setTab('main');
    },
    [saveTarget, customPresets, savePreset, updatePreset, onApply, warning]
  );

  const handleStartAdd = useCallback(() => {
    returnToPageRef.current = mainPage;
    setTab('custom');
    setSaveTarget({
      name: '',
      light: lightSquare || DEFAULT_LIGHT,
      dark: darkSquare || DEFAULT_DARK
    });
  }, [mainPage, lightSquare, darkSquare]);

  const currentPage = mainPage;
  const setCurrentPage = setMainPage;
  const totalPages = mainPages;

  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };

  return (
    <div ref={containerRef} className="flex h-full flex-col gap-4 select-none">
      <div
        role="tablist"
        aria-label="Theme source"
        className={`flex items-center rounded-lg border border-border/60 bg-surface p-0.5 ${saveTarget !== null ? 'hidden' : ''}`}
      >
        {(
          [
            { id: 'main', label: 'Presets', Icon: Palette },
            { id: 'custom', label: 'Custom', Icon: SlidersHorizontal }
          ] as const
        ).map(({ id, label, Icon }, i) => (
          <Fragment key={id}>
            {i === 1 && (
              <span
                key="sep"
                className="h-4 w-px shrink-0 bg-border/60"
                aria-hidden="true"
              />
            )}
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                setTab(id);
                setSaveTarget(null);
                if (id === 'main') setMainPage(0);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                tab === id
                  ? 'bg-accent text-bg shadow-sm'
                  : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          </Fragment>
        ))}
      </div>

      {tab === 'main' ? (
        <ul
          className="grid flex-1 content-start gap-x-3 gap-y-4"
          style={gridStyle}
          aria-label="Board themes"
        >
          {mainSlice.map((tile) => {
            const customId = tile.custom;
            return (
              <li
                key={tile.key}
                className="group relative flex flex-col items-center gap-1.5"
              >
                <Swatch
                  light={tile.light}
                  dark={tile.dark}
                  name={tile.name}
                  isSelected={
                    lightSquare.toLowerCase() === tile.light.toLowerCase() &&
                    darkSquare.toLowerCase() === tile.dark.toLowerCase()
                  }
                  onClick={() => onApply(tile.light, tile.dark)}
                />

                {customId !== undefined && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 hidden gap-0.5 group-hover:flex group-focus-within:flex">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('custom');
                        setSaveTarget({
                          id: customId,
                          name: tile.name,
                          light: tile.light,
                          dark: tile.dark
                        });
                      }}
                      className="rounded-md border border-border/60 bg-surface p-1 text-text-muted shadow-sm transition-colors hover:text-accent"
                      aria-label={`Edit ${tile.name}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePreset(customId)}
                      className="rounded-md border border-border/60 bg-surface p-1 text-text-muted shadow-sm transition-colors hover:text-error"
                      aria-label={`Delete ${tile.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <span className="w-full truncate text-center text-[11px] font-semibold text-text-secondary">
                  {tile.name}
                </span>
              </li>
            );
          })}

          {showMainAddBtn && (
            <li className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={handleStartAdd}
                aria-label="Create a custom theme"
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-border/60 text-text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Plus className="h-5 w-5" />
              </button>
              <span className="text-[11px] font-semibold text-text-muted">
                Add
              </span>
            </li>
          )}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          {saveTarget !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">
                {saveTarget.id !== undefined ? 'Edit theme' : 'New theme'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSaveTarget(null);
                  setMainPage(returnToPageRef.current);
                  setTab('main');
                }}
                className="rounded-md p-1.5 text-error transition-colors hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                aria-label="Close and return to presets"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <ColorPickerPanel
            key={saveTarget?.id ?? (saveTarget ? 'new' : 'live')}
            mode={saveTarget !== null ? 'save' : 'live'}
            initial={
              saveTarget ?? {
                name: '',
                light: lightSquare || DEFAULT_LIGHT,
                dark: darkSquare || DEFAULT_DARK
              }
            }
            onLiveChange={onApply}
            onSave={handleSaveCustom}
          />
        </div>
      )}

      {tab === 'main' && totalPages > 1 && (
        <div className="mt-auto pt-1">
          <Pagination
            page={currentPage}
            pageCount={totalPages}
            onChange={setCurrentPage}
            label="Board theme pages"
          />
        </div>
      )}
    </div>
  );
});

BoardThemePicker.displayName = 'BoardThemePicker';
export default BoardThemePicker;
