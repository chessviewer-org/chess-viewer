import { useCallback, useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, GripVertical, Layout, Plus, Trash2, X } from 'lucide-react';

import ChessBoard from '@/components/board/ChessBoard/ChessBoard';
import DisplayOptions from '@/components/features/DisplayOptions/DisplayOptions';
import PieceSelector from '@/components/features/Fen/PieceSelector/PieceSelector';
import { BOARD_THEMES } from '@constants';
import { useThemePresets } from '@hooks';
import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@utils';

import {
  type BoardSizePreset,
  type ExportFormat,
  type ExportResolution,
  useExportWizard
} from '../hooks/useExportWizard';

interface BatchExportOverrides {
  boardSize?: number;
  exportQuality?: number;
}

interface ExportStudioProps {
  homeState: {
    fen: string;
    pieceStyle: string;
    setPieceStyle: (style: string) => void;
    showCoords: boolean;
    setShowCoords: (show: boolean) => void;
    showCoordinateBorder: boolean;
    setShowCoordinateBorder: (show: boolean) => void;
    showThinFrame: boolean;
    setShowThinFrame: (show: boolean) => void;
    lightSquare: string;
    setLightSquare: (color: string) => void;
    darkSquare: string;
    setDarkSquare: (color: string) => void;
    exportQuality: number;
    setExportQuality: (quality: number) => void;
    boardSize: number;
    setBoardSize: (size: number) => void;
    flipped: boolean;
    handleBatchExport: (
      formats: string[],
      names?: string[],
      overrides?: BatchExportOverrides
    ) => Promise<void>;
  };
  onClose: () => void;
}

interface ThemeCard {
  id: string;
  name: string;
  light: string;
  dark: string;
  isSystem: boolean;
  rawId?: number;
  timestamp?: number;
}

interface CustomThemeDraft {
  id: number;
  name: string;
  light: string;
  dark: string;
  timestamp: number;
}

interface ThemePresetLike {
  id: number;
  name: string;
  light: string;
  dark: string;
  timestamp: number;
}

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' }
];

const RESOLUTIONS: ExportResolution[] = [8, 16, 24, 32];
const BOARD_PRESETS: BoardSizePreset[] = [4, 8, 12];
const THEMES_PER_PAGE = 24;
const MAX_THEMES = 48;

function mapPresetToDraft(preset: ThemePresetLike): CustomThemeDraft {
  return {
    id: preset.id,
    name: preset.name,
    light: preset.light,
    dark: preset.dark,
    timestamp: preset.timestamp
  };
}

function reorderThemes(
  themes: CustomThemeDraft[],
  draggedId: number,
  targetId: number
): CustomThemeDraft[] {
  const fromIndex = themes.findIndex((theme) => theme.id === draggedId);
  const toIndex = themes.findIndex((theme) => theme.id === targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return themes;

  const nextThemes = [...themes];
  const [moved] = nextThemes.splice(fromIndex, 1);
  if (!moved) return themes;
  nextThemes.splice(toIndex, 0, moved);
  return nextThemes;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getPreviewBoardSize(sizeSm: number): number {
  const clamped = clamp(sizeSm, 4, 16);
  const ratio = (clamped - 4) / 12;
  return Math.round(260 + ratio * 320);
}

function getCoordinateBorder(boardSize: number, showCoords: boolean): number {
  if (!showCoords) return 0;
  return Math.round(Math.max(18, Math.min(800, boardSize * 0.05))) * 2;
}

const ExportStudio = ({ homeState, onClose }: ExportStudioProps) => {
  const wizard = useExportWizard();
  const { customPresets, savePreset, replacePresets } = useThemePresets();

  const [themeTab, setThemeTab] = useState<'main' | 'custom'>('main');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [draggingThemeId, setDraggingThemeId] = useState<number | null>(null);
  const [draftCustomThemes, setDraftCustomThemes] = useState<CustomThemeDraft[]>([]);

  const systemThemes = useMemo<ThemeCard[]>(
    () =>
      Object.entries(BOARD_THEMES).map(([key, theme]) => ({
        id: key,
        name: theme.name,
        light: theme.light,
        dark: theme.dark,
        isSystem: true
      })),
    []
  );

  useEffect(() => {
    if (!isEditMode) {
      setDraftCustomThemes(customPresets.map((preset) => mapPresetToDraft(preset)));
    }
  }, [customPresets, isEditMode]);

  const customThemes = useMemo<ThemeCard[]>(
    () =>
      (isEditMode ? draftCustomThemes : customPresets).map((theme) => ({
        id: String(theme.id),
        rawId: theme.id,
        name: theme.name,
        light: theme.light,
        dark: theme.dark,
        timestamp: theme.timestamp,
        isSystem: false
      })),
    [customPresets, draftCustomThemes, isEditMode]
  );

  const visibleThemes = useMemo(() => {
    const source = themeTab === 'main' ? systemThemes : customThemes;
    return source.slice(0, MAX_THEMES);
  }, [customThemes, systemThemes, themeTab]);

  const totalPages = Math.max(1, Math.ceil(visibleThemes.length / THEMES_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages - 1) setCurrentPage(0);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(0);
  }, [themeTab]);

  const paginatedThemes = useMemo(() => {
    const start = currentPage * THEMES_PER_PAGE;
    return visibleThemes.slice(start, start + THEMES_PER_PAGE);
  }, [currentPage, visibleThemes]);

  const previewBoardSize = useMemo(
    () => getPreviewBoardSize(wizard.activeBoardSize),
    [wizard.activeBoardSize]
  );
  const previewFrameSize = useMemo(
    () => previewBoardSize + getCoordinateBorder(previewBoardSize, homeState.showCoords),
    [homeState.showCoords, previewBoardSize]
  );

  const beginEditMode = useCallback(() => {
    setDraftCustomThemes(customPresets.map((preset) => mapPresetToDraft(preset)));
    setIsEditMode(true);
  }, [customPresets]);

  const cancelEditMode = useCallback(() => {
    setDraftCustomThemes(customPresets.map((preset) => mapPresetToDraft(preset)));
    setDraggingThemeId(null);
    setIsEditMode(false);
  }, [customPresets]);

  const saveEditMode = useCallback(() => {
    const next = draftCustomThemes.map((theme) => ({
      ...theme,
      name: theme.name.trim() || 'Untitled Theme'
    }));
    replacePresets(next);
    setDraggingThemeId(null);
    setIsEditMode(false);
  }, [draftCustomThemes, replacePresets]);

  const handleRenameDraft = useCallback((id: number, name: string) => {
    setDraftCustomThemes((prev) =>
      prev.map((theme) => (theme.id === id ? { ...theme, name } : theme))
    );
  }, []);

  const handleDeleteDraft = useCallback((id: number) => {
    setDraftCustomThemes((prev) => prev.filter((theme) => theme.id !== id));
  }, []);

  const handleDropTheme = useCallback(
    (targetId: number) => {
      if (draggingThemeId === null) return;
      setDraftCustomThemes((prev) => reorderThemes(prev, draggingThemeId, targetId));
      setDraggingThemeId(null);
    },
    [draggingThemeId]
  );

  const handleThemeSelect = useCallback(
    (theme: ThemeCard) => {
      homeState.setLightSquare(theme.light);
      homeState.setDarkSquare(theme.dark);
    },
    [homeState]
  );

  const handleSaveNewTheme = useCallback(
    (name: string, light: string, dark: string) => {
      if (customPresets.length >= MAX_THEMES) return;
      savePreset(name, light, dark);
      setIsAddingTheme(false);
      setThemeTab('custom');
    },
    [customPresets.length, savePreset]
  );

  const handlePrimaryNavigation = useCallback(() => {
    if (wizard.currentStep < 3) {
      wizard.handleNext();
      return;
    }

    const selectedFormats = [...wizard.selectedFormats];
    const names = selectedFormats.map((format) => wizard.resolvedFileNames[format]);
    const overrides: BatchExportOverrides = {
      boardSize: wizard.activeBoardSize,
      exportQuality: wizard.resolution
    };

    homeState.setBoardSize(wizard.activeBoardSize);
    homeState.setExportQuality(wizard.resolution);
    void homeState.handleBatchExport(selectedFormats, names, overrides);
    onClose();
  }, [homeState, onClose, wizard]);

  const canAddTheme =
    !isEditMode &&
    customThemes.length < MAX_THEMES &&
    currentPage === totalPages - 1;

  return (
    <div className="fixed inset-x-0 top-16 sm:top-20 lg:top-24 z-[60] h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] bg-bg border-t border-border/40">
      <div className="h-full flex flex-col">
        <header className="h-14 shrink-0 border-b border-border/40 bg-surface px-4 sm:px-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            &lt; Back Editor
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            {wizard.currentStep > 1 && (
              <>
                <button
                  type="button"
                  onClick={wizard.handleBack}
                  className="hover:text-text-primary transition-colors"
                >
                  &lt; Back
                </button>
                <span className="text-text-muted">|</span>
              </>
            )}

            <button
              type="button"
              onClick={handlePrimaryNavigation}
              className="text-accent hover:text-accent-hover transition-colors"
            >
              {wizard.currentStep < 3 ? `${wizard.currentStep}/3 Next >` : 'Finish'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-0">
          <div className="min-h-0 border-r border-border/40 bg-surface overflow-y-auto">
            <AnimatePresence mode="wait">
              {wizard.currentStep === 1 && (
                <motion.section
                  key="wizard-step-1"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full relative"
                >
                  <ThemeStudioStep
                    themeTab={themeTab}
                    setThemeTab={setThemeTab}
                    isEditMode={isEditMode}
                    beginEditMode={beginEditMode}
                    cancelEditMode={cancelEditMode}
                    saveEditMode={saveEditMode}
                    isAddingTheme={isAddingTheme}
                    setIsAddingTheme={setIsAddingTheme}
                    paginatedThemes={paginatedThemes}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                    canAddTheme={canAddTheme}
                    onThemeSelect={handleThemeSelect}
                    selectedLight={homeState.lightSquare}
                    selectedDark={homeState.darkSquare}
                    onRenameDraft={handleRenameDraft}
                    onDeleteDraft={handleDeleteDraft}
                    onDragStart={setDraggingThemeId}
                    onDragEnd={() => setDraggingThemeId(null)}
                    onDropTheme={handleDropTheme}
                    onSaveNewTheme={handleSaveNewTheme}
                  />
                </motion.section>
              )}

              {wizard.currentStep === 2 && (
                <motion.section
                  key="wizard-step-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  <PieceDisplayStep homeState={homeState} />
                </motion.section>
              )}

              {wizard.currentStep === 3 && (
                <motion.section
                  key="wizard-step-3"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  <ExportSettingsStep wizard={wizard} />
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          <div className="min-h-0 md:sticky md:top-0 h-full w-full bg-surface-muted/40 p-4 sm:p-6 lg:p-8">
            <div className="h-full w-full flex items-center justify-center">
              <div
                className="relative transition-all duration-300 ease-out"
                style={{
                  width: `${previewFrameSize}px`,
                  height: `${previewFrameSize}px`,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                <div className="absolute -top-6 left-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
                  <Layout className="w-3 h-3" />
                  Live Preview
                </div>
                <ChessBoard
                  fen={homeState.fen}
                  pieceStyle={homeState.pieceStyle}
                  showCoords={homeState.showCoords}
                  lightSquare={homeState.lightSquare}
                  darkSquare={homeState.darkSquare}
                  boardSize={previewBoardSize}
                  flipped={homeState.flipped}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ThemeStudioStepProps {
  themeTab: 'main' | 'custom';
  setThemeTab: (tab: 'main' | 'custom') => void;
  isEditMode: boolean;
  beginEditMode: () => void;
  cancelEditMode: () => void;
  saveEditMode: () => void;
  isAddingTheme: boolean;
  setIsAddingTheme: (open: boolean) => void;
  paginatedThemes: ThemeCard[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  canAddTheme: boolean;
  onThemeSelect: (theme: ThemeCard) => void;
  selectedLight: string;
  selectedDark: string;
  onRenameDraft: (id: number, name: string) => void;
  onDeleteDraft: (id: number) => void;
  onDragStart: (id: number | null) => void;
  onDragEnd: () => void;
  onDropTheme: (targetId: number) => void;
  onSaveNewTheme: (name: string, light: string, dark: string) => void;
}

function ThemeStudioStep({
  themeTab,
  setThemeTab,
  isEditMode,
  beginEditMode,
  cancelEditMode,
  saveEditMode,
  isAddingTheme,
  setIsAddingTheme,
  paginatedThemes,
  currentPage,
  setCurrentPage,
  totalPages,
  canAddTheme,
  onThemeSelect,
  selectedLight,
  selectedDark,
  onRenameDraft,
  onDeleteDraft,
  onDragStart,
  onDragEnd,
  onDropTheme,
  onSaveNewTheme
}: ThemeStudioStepProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  return (
    <div className="h-full p-4 sm:p-6 lg:p-8 flex flex-col gap-5 overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Theme Studio</h2>

          {!isEditMode ? (
            <button
              type="button"
              onClick={beginEditMode}
              className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border/60 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
            >
              Edit Mode
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEditMode}
                className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border/60 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditMode}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent text-bg hover:bg-accent-hover transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 rounded-lg bg-surface-elevated border border-border/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => setThemeTab('main')}
            className={`w-full px-4 py-2 text-xs font-semibold rounded-md border transition-colors ${
              themeTab === 'main'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Main
          </button>
          <button
            type="button"
            onClick={() => setThemeTab('custom')}
            className={`w-full px-4 py-2 text-xs font-semibold rounded-md border transition-colors ${
              themeTab === 'custom'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto pr-2"
        onTouchStart={(event) => {
          if (totalPages > 1) {
            setTouchStartX(event.touches[0]?.clientX ?? null);
          }
        }}
        onTouchEnd={(event) => {
          if (touchStartX === null || totalPages <= 1) return;
          const touchEndX = event.changedTouches[0]?.clientX;
          if (typeof touchEndX !== 'number') return;

          const delta = touchEndX - touchStartX;
          if (Math.abs(delta) < 40) return;
          if (delta < 0 && currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
          } else if (delta > 0 && currentPage > 0) {
            setCurrentPage(currentPage - 1);
          }
          setTouchStartX(null);
        }}
      >
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-x-3 gap-y-6">
          {paginatedThemes.map((theme) => {
            const isSelected =
              selectedLight === theme.light && selectedDark === theme.dark;
            const isEditable = isEditMode && !theme.isSystem && typeof theme.rawId === 'number';

            return (
              <div
                key={theme.id}
                className="flex flex-col items-center gap-2 relative"
                draggable={isEditable}
                onDragStart={(event) => {
                  if (!isEditable || typeof theme.rawId !== 'number') return;
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', String(theme.rawId));
                  onDragStart(theme.rawId);
                }}
                onDragOver={(event) => {
                  if (!isEditable) return;
                  event.preventDefault();
                }}
                onDrop={() => {
                  if (!isEditable || typeof theme.rawId !== 'number') return;
                  onDropTheme(theme.rawId);
                }}
                onDragEnd={onDragEnd}
              >
                {isEditable && (
                  <span className="absolute -top-2 -left-1 text-text-muted">
                    <GripVertical className="w-3.5 h-3.5" />
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onThemeSelect(theme)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent/20'
                      : 'border-border/60 hover:border-text-muted'
                  }`}
                >
                  <div className="h-1/2 w-full" style={{ backgroundColor: theme.light }} />
                  <div className="h-1/2 w-full" style={{ backgroundColor: theme.dark }} />
                </button>

                {isEditable ? (
                  <input
                    value={theme.name}
                    onChange={(event) => {
                      if (typeof theme.rawId === 'number') {
                        onRenameDraft(theme.rawId, event.target.value);
                      }
                    }}
                    className="w-full text-[10px] text-center rounded-md border border-border/50 bg-surface-elevated px-1 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                ) : (
                  <span className="w-full text-[10px] text-center uppercase tracking-wide text-text-muted truncate px-1 py-1">
                    {theme.name}
                  </span>
                )}

                {isEditable && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof theme.rawId === 'number') {
                        onDeleteDraft(theme.rawId);
                      }
                    }}
                    className="absolute -top-2 -right-1 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                    aria-label={`Delete ${theme.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {canAddTheme && (
            <button
              type="button"
              onClick={() => setIsAddingTheme(true)}
              className="flex flex-col items-center gap-2 group"
            >
              <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-border text-text-muted group-hover:text-accent group-hover:border-accent transition-colors flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </span>
              <span className="text-[10px] uppercase tracking-wide text-text-muted group-hover:text-accent transition-colors">
                Add
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="min-h-4 flex justify-center gap-2">
        {totalPages > 1 &&
          Array.from({ length: totalPages }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              onClick={() => setCurrentPage(pageIndex)}
              className={`h-2 rounded-full transition-all ${
                currentPage === pageIndex ? 'w-5 bg-accent' : 'w-2 bg-border'
              }`}
              aria-label={`Go to page ${pageIndex + 1}`}
            />
          ))}
      </div>

      <AnimatePresence>
        {isAddingTheme && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute inset-0 bg-surface border-l border-border/40 p-4 sm:p-6 lg:p-8 z-20"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Add Custom Theme</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingTheme(false)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AddThemePanel
                onSave={onSaveNewTheme}
                onCancel={() => setIsAddingTheme(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AddThemePanelProps {
  onSave: (name: string, light: string, dark: string) => void;
  onCancel: () => void;
}

function AddThemePanel({ onSave, onCancel }: AddThemePanelProps) {
  const [name, setName] = useState('');
  const [light, setLight] = useState('#f0d9b5');
  const [dark, setDark] = useState('#b58863');
  const [activeColor, setActiveColor] = useState<'light' | 'dark'>('light');

  const selectedColor = activeColor === 'light' ? light : dark;
  const currentHsv = useMemo(() => {
    const rgb = hexToRgb(selectedColor);
    if (!rgb) return { h: 0, s: 0, v: 0 };
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [selectedColor]);

  const updateActiveColor = useCallback(
    (nextColor: string) => {
      if (activeColor === 'light') setLight(nextColor);
      else setDark(nextColor);
    },
    [activeColor]
  );

  const handleHueChange = useCallback(
    (hue: number) => {
      const nextRgb = hsvToRgb(hue, currentHsv.s, currentHsv.v);
      updateActiveColor(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
    },
    [currentHsv.s, currentHsv.v, updateActiveColor]
  );

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-text-secondary">
          Add theme name
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Midnight Board"
          className="w-full rounded-lg border border-border/60 bg-surface-elevated px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveColor('light')}
          className={`rounded-xl border px-3 py-3 text-xs font-semibold transition-colors ${
            activeColor === 'light'
              ? 'border-accent bg-accent/10 text-text-primary'
              : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
          }`}
        >
          <span
            className="block w-8 h-8 rounded-full border border-border mx-auto mb-2"
            style={{ backgroundColor: light }}
          />
          Light Square
        </button>
        <button
          type="button"
          onClick={() => setActiveColor('dark')}
          className={`rounded-xl border px-3 py-3 text-xs font-semibold transition-colors ${
            activeColor === 'dark'
              ? 'border-accent bg-accent/10 text-text-primary'
              : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
          }`}
        >
          <span
            className="block w-8 h-8 rounded-full border border-border mx-auto mb-2"
            style={{ backgroundColor: dark }}
          />
          Dark Square
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-text-secondary">Color Picker</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(event) => updateActiveColor(event.target.value)}
            className="w-full h-12 rounded-lg cursor-pointer border border-border/50 bg-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-text-secondary">Hue Slider</label>
          <input
            type="range"
            min={0}
            max={360}
            value={currentHsv.h}
            onChange={(event) => handleHueChange(Number(event.target.value))}
            className="w-full accent-accent"
          />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border/60 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => onSave(name.trim(), light, dark)}
          className="flex-1 rounded-lg bg-accent text-bg py-2 text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function PieceDisplayStep({ homeState }: Pick<ExportStudioProps, 'homeState'>) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Piece Style & Display</h2>
        <p className="text-sm text-text-secondary">
          Configure piece set and display options.
        </p>
      </div>

      <PieceSelector
        pieceStyle={homeState.pieceStyle}
        setPieceStyle={homeState.setPieceStyle}
      />

      <DisplayOptions
        showCoords={homeState.showCoords}
        setShowCoords={homeState.setShowCoords}
        showCoordinateBorder={homeState.showCoordinateBorder}
        setShowCoordinateBorder={homeState.setShowCoordinateBorder}
        showThinFrame={homeState.showThinFrame}
        setShowThinFrame={homeState.setShowThinFrame}
        exportQuality={homeState.exportQuality}
      />
    </div>
  );
}

function ExportSettingsStep({ wizard }: { wizard: ReturnType<typeof useExportWizard> }) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Export Settings</h2>
        <p className="text-sm text-text-secondary">
          Select formats, render density, board size and naming.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Download Formats</h3>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((format) => (
            <button
              key={format.value}
              type="button"
              onClick={() => wizard.toggleFormat(format.value)}
              className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition-colors ${
                wizard.selectedFormats.includes(format.value)
                  ? 'border-accent bg-accent/10 text-text-primary'
                  : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  wizard.selectedFormats.includes(format.value)
                    ? 'border-accent bg-accent text-bg'
                    : 'border-border'
                }`}
              >
                {wizard.selectedFormats.includes(format.value) && (
                  <Check className="w-3 h-3" />
                )}
              </span>
              <span className="text-xs font-semibold">{format.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Export Settings</h3>
        <div className="grid grid-cols-4 gap-2">
          {RESOLUTIONS.map((resolution) => (
            <button
              key={resolution}
              type="button"
              onClick={() => wizard.setResolutionValue(resolution)}
              className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                wizard.resolution === resolution
                  ? 'border-accent bg-accent/10 text-text-primary'
                  : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              {resolution}x
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">BoardSize Control</h3>
        <div className="flex flex-wrap items-center gap-2">
          {BOARD_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => wizard.selectBoardSizePreset(preset)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                wizard.boardSizePreset === preset
                  ? 'border-accent bg-accent/10 text-text-primary'
                  : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              {preset}sm
            </button>
          ))}

          <button
            type="button"
            onClick={() => wizard.selectBoardSizePreset('custom')}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              wizard.boardSizePreset === 'custom'
                ? 'border-accent bg-accent/10 text-text-primary'
                : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
            }`}
          >
            Custom
          </button>

          <input
            type="number"
            min={4}
            max={16}
            step={0.1}
            value={wizard.customBoardSizeInput}
            onFocus={() => wizard.selectBoardSizePreset('custom')}
            onChange={(event) => wizard.updateCustomBoardSize(event.target.value)}
            placeholder="4-16"
            className="w-24 rounded-lg border border-border/60 bg-surface px-2 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        {wizard.customBoardSizeError && (
          <p className="text-xs text-error">{wizard.customBoardSizeError}</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">File Name</h3>
        <input
          value={wizard.fileNamesInput}
          onChange={(event) => wizard.updateFileNames(event.target.value)}
          placeholder="e.g. Position1, Tactic2"
          className="w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        {wizard.fileNameError && (
          <p className="text-xs text-error">{wizard.fileNameError}</p>
        )}
        <p className="text-xs text-text-secondary">
          Use comma-separated names. Unfilled slots fall back to <strong>chessboard</strong>.
        </p>
      </section>
    </div>
  );
}

export default ExportStudio;
