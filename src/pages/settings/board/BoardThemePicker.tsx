import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Check,
  Palette,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X
} from 'lucide-react';

import { useNotifications, useThemePresets } from '@hooks';
import { BOARD_THEMES } from '@constants';

import {
  hexToRgb,
  hsvToRgb,
  rgbToHex,
  rgbToHsv
} from '@utils/colorConversions';
import { sanitizeHexColor, sanitizeInput } from '@utils/validation';

/** Props for the Settings → Board theme picker. */
export interface BoardThemePickerProps {
  /** Active light square colour (used to mark the selected swatch). */
  lightSquare: string;
  /** Active dark square colour (used to mark the selected swatch). */
  darkSquare: string;
  /** Apply a light/dark pair to the board. */
  onApply: (light: string, dark: string) => void;
}

// ─── constants ───────────────────────────────────────────────────────────────

const MAX_NAME_LEN = 10;
const MAX_PAGES = 2;
const ROWS = 4;
const DEFAULT_LIGHT = BOARD_THEMES['classic']?.light ?? '#f0d9b5';
const DEFAULT_DARK = BOARD_THEMES['classic']?.dark ?? '#b58863';

/** All built-in themes as a flat ordered list. */
const MAIN_THEMES = Object.entries(BOARD_THEMES).map(([key, t]) => ({
  key,
  name: t.name,
  light: t.light,
  dark: t.dark
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Derive column count from a measured pixel width (Settings is roomy). */
function colsFromWidth(px: number): number {
  if (px >= 700) return 10;
  if (px >= 600) return 9;
  if (px >= 500) return 8;
  if (px >= 380) return 7;
  if (px >= 280) return 6;
  return 5;
}

// ─── 2D saturation / value field ──────────────────────────────────────────────

/**
 * Classic 2D colour field: horizontal = saturation, vertical = value. The
 * background is the pure hue with white (left) and black (bottom) gradients
 * layered over it. A draggable thumb marks the current s/v. Pointer events make
 * it work for mouse and touch.
 */
function SaturationField({
  hue,
  s,
  v,
  onChange,
  className
}: {
  hue: number;
  s: number;
  v: number;
  onChange: (s: number, v: number) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ns = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const nv =
        1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      onChange(ns, nv);
    },
    [onChange]
  );

  const hueRgb = hsvToRgb(hue, 1, 1);
  const hueHex = rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b);

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Saturation and brightness"
      aria-valuetext={`Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`}
      tabIndex={0}
      className={`relative ${className ?? 'h-28 w-full cursor-crosshair touch-none overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25)]'}`}
      style={{
        backgroundColor: hueHex,
        backgroundImage:
          'linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))'
      }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) pick(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onKeyDown={(e) => {
        const step = 0.04;
        if (e.key === 'ArrowLeft') onChange(Math.max(0, s - step), v);
        else if (e.key === 'ArrowRight') onChange(Math.min(1, s + step), v);
        else if (e.key === 'ArrowUp') onChange(s, Math.min(1, v + step));
        else if (e.key === 'ArrowDown') onChange(s, Math.max(0, v - step));
        else return;
        e.preventDefault();
      }}
    >
      <span
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
        style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
      />
    </div>
  );
}

// ─── inline color picker ──────────────────────────────────────────────────────

/**
 * The colour picker is the heart of the Custom tab. It has two modes:
 *
 *   - "live"  → no name field, no buttons. Choosing colours applies them to the
 *     board immediately via `onLiveChange` (Custom's default browsing mode —
 *     pick a colour without saving a theme).
 *   - "save"  → a compact name input + Save button on one row at the bottom.
 *     Reached by pressing "+" on the Presets tab, or Edit on a saved swatch. The
 *     header X (in the parent) closes the form, so there is no Cancel button.
 */
function ColorPickerPanel({
  mode,
  initial,
  onLiveChange,
  onSave
}: {
  mode: 'live' | 'save';
  initial: { name: string; light: string; dark: string };
  onLiveChange?: (light: string, dark: string) => void;
  onSave?: (name: string, light: string, dark: string) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [light, setLight] = useState(initial.light);
  const [dark, setDark] = useState(initial.dark);
  const [active, setActive] = useState<'light' | 'dark'>('light');

  const selectedHex = active === 'light' ? light : dark;

  // Every colour change pushes BOTH squares to the board so the preview and the
  // live board update dynamically as the user drags — in live AND save mode.
  const setSelected = useCallback(
    (hex: string) => {
      const nextLight = active === 'light' ? hex : light;
      const nextDark = active === 'dark' ? hex : dark;
      if (active === 'light') setLight(hex);
      else setDark(hex);
      onLiveChange?.(nextLight, nextDark);
    },
    [active, light, dark, onLiveChange]
  );

  const hsv = useMemo(() => {
    const rgb = hexToRgb(selectedHex);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [selectedHex]);

  const handleHue = useCallback(
    (hue: number) => {
      const { r, g, b } = hsvToRgb(hue / 360, hsv.s, hsv.v);
      setSelected(rgbToHex(r, g, b));
    },
    [hsv.s, hsv.v, setSelected]
  );

  const handleSv = useCallback(
    (s: number, v: number) => {
      const { r, g, b } = hsvToRgb(hsv.h, s, v);
      setSelected(rgbToHex(r, g, b));
    },
    [hsv.h, setSelected]
  );

  // live mode: SaturationField grows to fill all available height.
  // save mode: fixed compact height so it fits alongside the Presets grid.
  const fieldClass =
    mode === 'live'
      ? 'flex-1 min-h-[7rem] w-full cursor-crosshair touch-none overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25)]'
      : 'h-28 w-full cursor-crosshair touch-none overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25)]';

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Light / Dark toggles with live hex */}
      <div className="grid grid-cols-2 gap-2">
        {(['light', 'dark'] as const).map((side) => {
          const hex = side === 'light' ? light : dark;
          const label = side === 'light' ? 'Light square' : 'Dark square';
          return (
            <button
              key={side}
              type="button"
              onClick={() => setActive(side)}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors ${
                active === side
                  ? 'border-accent bg-accent/10'
                  : 'border-border/60 hover:bg-surface'
              }`}
            >
              <span
                className="h-5 w-5 shrink-0 rounded-md border border-border/40"
                style={{ backgroundColor: hex }}
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-text-primary">
                  {label}
                </span>
                <span className="block font-mono text-xs uppercase text-text-secondary">
                  {hex}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Color Picker label */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        Color Picker
      </span>

      {/* 2D saturation/value field — grows in live mode, fixed in save mode */}
      <SaturationField
        hue={hsv.h}
        s={hsv.s}
        v={hsv.v}
        onChange={handleSv}
        className={fieldClass}
      />

      {/* Hue slider with label, pushed down with mt-1 */}
      <div className="mt-1 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Hue
        </span>
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(hsv.h * 360)}
          onChange={(e) => handleHue(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: `linear-gradient(to right,
              hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),
              hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),
              hsl(360,100%,50%))`
          }}
          aria-label="Hue"
        />
      </div>

      {/* Save row — save mode only */}
      {mode === 'save' && (
        <div className="mt-auto flex items-center gap-2 pt-1">
          <input
            id="board-theme-name"
            autoFocus
            value={name}
            maxLength={MAX_NAME_LEN}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            aria-label="Theme name"
            className="min-w-0 flex-1 rounded-lg border border-border/60 bg-surface px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
          <button
            type="button"
            onClick={() =>
              onSave?.(
                sanitizeInput(name).trim().slice(0, MAX_NAME_LEN),
                sanitizeHexColor(light, DEFAULT_LIGHT),
                sanitizeHexColor(dark, DEFAULT_DARK)
              )
            }
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

// ─── circular swatch ──────────────────────────────────────────────────────────

function Swatch({
  light,
  dark,
  name,
  isSelected,
  onClick
}: {
  light: string;
  dark: string;
  name: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      title={name}
      aria-label={`Apply ${name} theme`}
      className={`relative flex h-11 w-11 overflow-hidden rounded-full border-2 transition-[border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isSelected
          ? 'border-accent ring-2 ring-accent/30'
          : 'border-border/60 hover:border-text-muted'
      }`}
    >
      <span className="h-full w-1/2" style={{ backgroundColor: light }} />
      <span className="h-full w-1/2" style={{ backgroundColor: dark }} />
      {isSelected && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <Check className="h-4 w-4 text-white drop-shadow" aria-hidden />
        </span>
      )}
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type ActiveTab = 'main' | 'custom';

const BoardThemePicker = memo(function BoardThemePicker({
  lightSquare,
  darkSquare,
  onApply
}: BoardThemePickerProps) {
  const { customPresets, savePreset, deletePreset, updatePreset } =
    useThemePresets();
  const { warning } = useNotifications();

  const [tab, setTab] = useState<ActiveTab>('main');
  const [mainPage, setMainPage] = useState(0);

  /**
   * Save-mode target. `null` = Custom shows its default LIVE picker (pick a
   * colour, applied straight to the board, nothing saved). Non-null = the
   * name+buttons "save" form is shown for a NEW theme (no `id`) or an EDIT
   * (with `id`).
   */
  const [saveTarget, setSaveTarget] = useState<{
    id?: number;
    name: string;
    light: string;
    dark: string;
  } | null>(null);

  // Responsive columns from measured width.
  const containerRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(8);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      if (entry) setCols(colsFromWidth(entry.contentRect.width));
    });
    obs.observe(el);
    setCols(colsFromWidth(el.getBoundingClientRect().width));
    return () => obs.disconnect();
  }, []);

  const perPage = ROWS * cols;

  // ── Presets ("Main") = built-ins + saved custom themes, then a "+" tile ────
  // Saved custom themes appear in the Presets grid right after the built-ins so
  // the user sees their new theme where they expect it. Each tile is tagged
  // with its source; custom tiles carry the preset id for edit/delete.
  type Tile = {
    key: string;
    name: string;
    light: string;
    dark: string;
    custom?: number; // preset id when custom
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
  const maxMainColors = MAX_PAGES * perPage - 1; // reserve one slot for "+"
  const allMainTiles = [...builtInTiles, ...customTiles].slice(
    0,
    maxMainColors
  );
  const mainItemCount = allMainTiles.length + 1; // +1 for the "+" tile
  const mainPages = Math.max(
    1,
    Math.min(MAX_PAGES, Math.ceil(mainItemCount / perPage))
  );
  const mainSlice = allMainTiles.slice(
    mainPage * perPage,
    (mainPage + 1) * perPage
  );
  const showMainAddBtn = mainPage === mainPages - 1;

  // Clamp the Presets page when cols/data shrink the page count.
  useEffect(() => {
    setMainPage((p) => Math.min(p, mainPages - 1));
  }, [mainPages]);
  // Reset to the first page when switching tabs.
  useEffect(() => {
    setMainPage(0);
  }, [tab]);

  const handleSaveCustom = useCallback(
    (name: string, light: string, dark: string) => {
      // Duplicate colour check: search built-ins then custom presets for the same
      // light+dark pair (case-insensitive hex). Skip when editing an existing
      // preset so a user can rename without a false positive.
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

      // Blank name → auto-name "Custom N" using the lowest free index, capped to
      // MAX_NAME_LEN so it still fits the swatch label.
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
        // Apply the just-created theme to the board immediately.
        onApply(light, dark);
      }
      // Work is done: close the form and return the user to the Presets tab
      // they came from (the "+" lives there). The new theme now shows in the
      // Presets grid alongside the built-ins.
      setSaveTarget(null);
      setTab('main');
    },
    [saveTarget, customPresets, savePreset, updatePreset, onApply, warning]
  );

  // "+" in Presets → switch to Custom and open the SAVE form for a new theme.
  const handleStartAdd = useCallback(() => {
    setTab('custom');
    setSaveTarget({
      name: '',
      light: lightSquare || DEFAULT_LIGHT,
      dark: darkSquare || DEFAULT_DARK
    });
  }, [lightSquare, darkSquare]);

  // Pagination applies to the Presets grid only.
  const currentPage = mainPage;
  const setCurrentPage = setMainPage;
  const totalPages = mainPages;

  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };

  return (
    <div ref={containerRef} className="flex h-full flex-col gap-4 select-none">
      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Theme source"
        className="flex items-center rounded-lg border border-border/60 bg-surface p-0.5"
      >
        {(
          [
            { id: 'main', label: 'Presets', Icon: Palette },
            { id: 'custom', label: 'Custom', Icon: SlidersHorizontal }
          ] as const
        ).map(({ id, label, Icon }, i) => (
          <>
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
          </>
        ))}
      </div>

      {/* ── Presets (built-in) grid ──────────────────────────────────────── */}
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

                {/* Custom tiles get edit / delete on hover. Built-ins do not. */}
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

          {/* "+" Add tile — last slot of the last Presets page. Opens the Custom
              tab with the colour picker for a new theme. */}
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
                onClick={() => setSaveTarget(null)}
                className="rounded p-1 text-text-muted transition-colors hover:text-text-primary"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
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

      {/* ── Pagination dots (Presets only) ───────────────────────────────── */}
      {tab === 'main' && totalPages > 1 && (
        <div className="mt-auto flex items-center justify-center gap-2 pt-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentPage(i)}
              aria-label={`Page ${i + 1}`}
              aria-current={currentPage === i ? 'page' : undefined}
              className={`h-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                currentPage === i
                  ? 'w-5 bg-accent'
                  : 'w-2 bg-border hover:bg-text-muted'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

BoardThemePicker.displayName = 'BoardThemePicker';
export default BoardThemePicker;
