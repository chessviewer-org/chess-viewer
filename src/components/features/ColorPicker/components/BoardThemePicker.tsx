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
} from '@/assets/icons';

import {
  useNotifications,
  usePagination,
  useThemePresets
} from '@hooks';
import { BOARD_THEMES } from '@constants';

import { Pagination } from '@ui';

import { ColorPickerPanel } from './ColorPickerPanel';
import { Swatch } from './Swatch';
import styles from '../styles/color-picker.module.scss';

// Types
interface BoardThemePickerProps {
  lightSquare: string;
  darkSquare: string;
  onApply: (light: string, dark: string) => void;
  maxRows?: number;
}

// Constants
const MAX_NAME_LEN = 10;
const DEFAULT_LIGHT = BOARD_THEMES['classic']?.light ?? '#f0d9b5';
const DEFAULT_DARK = BOARD_THEMES['classic']?.dark ?? '#b58863';

const MAIN_THEMES = Object.entries(BOARD_THEMES).map(([key, t]) => ({
  key,
  name: t.name,
  light: t.light,
  dark: t.dark
}));

// Helpers
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

export const BoardThemePicker = memo(function BoardThemePicker({
  lightSquare,
  darkSquare,
  onApply,
  maxRows
}: BoardThemePickerProps) {
  const { customPresets, savePreset, deletePreset, updatePreset } =
    useThemePresets();
  const { warning } = useNotifications();

  const [tab, setTab] = useState<ActiveTab>('main');

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
  const {
    page: mainPage,
    pageCount: mainPages,
    goTo: goToMainPage,
    swipeHandlers
  } = usePagination(mainItemCount, perPage);
  const mainSlice = allMainTiles.slice(
    mainPage * perPage,
    (mainPage + 1) * perPage
  );
  const showMainAddBtn = mainPage === mainPages - 1;

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
          warning(
            `This color pair already exists: "${builtInMatch.name}"`,
            5000
          );
          return;
        }
        const customMatch = customPresets.find(
          (p) =>
            p.light.toLowerCase() === normalLight &&
            p.dark.toLowerCase() === normalDark
        );
        if (customMatch) {
          warning(
            `This color pair already exists: "${customMatch.name}"`,
            5000
          );
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

  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };

  return (
    <div ref={containerRef} className={styles['pickerContainer']}>
      <div
        role="tablist"
        aria-label="Theme source"
        className={`${styles['tabList']} ${saveTarget !== null ? 'hidden' : ''}`}
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
                if (id === 'main') goToMainPage(0);
              }}
              className={`${styles['tabBtn']} ${
                tab === id ? styles['tabBtnActive'] : styles['tabBtnInactive']
              }`}
            >
              <Icon className={styles['tabIcon']} aria-hidden="true" />
              {label}
            </button>
          </Fragment>
        ))}
      </div>

      {tab === 'main' ? (
        <ul
          className={styles['gridContainer']}
          style={gridStyle}
          aria-label="Board themes"
          {...swipeHandlers}
        >
          {mainSlice.map((tile) => {
            const customId = tile.custom;
            return (
              <li key={tile.key} className={`group ${styles['gridItem']}`}>
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
                  <div className={styles['customActions']}>
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
                      className={`${styles['actionBtn']} ${styles['actionBtnEdit']}`}
                      aria-label={`Edit ${tile.name}`}
                    >
                      <Pencil className={styles['actionIcon']} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePreset(customId)}
                      className={`${styles['actionBtn']} ${styles['actionBtnDelete']}`}
                      aria-label={`Delete ${tile.name}`}
                    >
                      <Trash2 className={styles['actionIcon']} />
                    </button>
                  </div>
                )}

                <span className={styles['itemLabel']}>{tile.name}</span>
              </li>
            );
          })}

          {showMainAddBtn && (
            <li className={styles['addBtnWrapper']}>
              <button
                type="button"
                onClick={handleStartAdd}
                aria-label="Create a custom theme"
                className={styles['addBtn']}
              >
                <Plus className={styles['addBtnIcon']} />
              </button>
              <span className={styles['addBtnLabel']}>Add</span>
            </li>
          )}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          {saveTarget !== null && (
            <div className={styles['saveTargetHeader']}>
              <span className={styles['saveTargetTitle']}>
                {saveTarget.id !== undefined ? 'Edit theme' : 'New theme'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSaveTarget(null);
                  goToMainPage(returnToPageRef.current);
                  setTab('main');
                }}
                className={styles['closeBtn']}
                aria-label="Close and return to presets"
              >
                <X className={styles['closeIcon']} />
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

      {tab === 'main' && mainPages > 1 && (
        <div className={styles['paginationWrapper']}>
          <Pagination
            page={mainPage}
            pageCount={mainPages}
            onChange={goToMainPage}
            label="Board theme pages"
          />
        </div>
      )}
    </div>
  );
});

BoardThemePicker.displayName = 'BoardThemePicker';
