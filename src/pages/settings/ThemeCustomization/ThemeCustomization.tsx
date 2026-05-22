import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  LayoutGrid,
  Palette,
  Plus,
  SlidersHorizontal,
  Wand2
} from 'lucide-react';

import { MAX_TOTAL_PRESETS, STORAGE_KEYS, WOOD_PRESET } from '@constants';
import { Button } from '@shared/ui';
import { loadPresets, readSquare, savePresets } from '@utils';
import type { BoardPreset } from '@/shared/types';

import BoardPreview from './BoardPreview';
import ColorPickerPanel from './ColorPickerPanel';
import DuplicateWarningDialog from './DuplicateWarningDialog';
import PaginationDots from './PaginationDots';
import PresetCard from './PresetCard';

const PAGE_SIZE = 40;
const TOTAL_PRESET_PAGES = 2;

export interface ThemeEditControls {
  editMode: boolean;
  onEnableEditMode: () => void;
  onCancelEditMode: () => void;
  onApplyChanges: () => void;
}

export interface ThemeCustomizationProps {
  onEditControlsChange?: (controls: ThemeEditControls | null) => void;
}

interface DuplicateCheck {
  light: string;
  dark: string;
  existingId: string;
}

/**
 * @returns {JSX.Element}
 */
const ThemeCustomization = memo(function ThemeCustomization({
  onEditControlsChange
}: ThemeCustomizationProps) {
  const [savedLight, setSavedLight] = useState<string>(() =>
    readSquare(STORAGE_KEYS.LIGHT_SQUARE, '#f0d9b5')
  );
  const [savedDark, setSavedDark] = useState<string>(() =>
    readSquare(STORAGE_KEYS.DARK_SQUARE, '#b58863')
  );
  const [previewLight, setPreviewLight] = useState<string>(savedLight);
  const [previewDark, setPreviewDark] = useState<string>(savedDark);
  const [presets, setPresets] = useState<BoardPreset[]>(loadPresets);
  const [presetsBackup, setPresetsBackup] = useState<BoardPreset[] | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [draggedPreset, setDraggedPreset] = useState<BoardPreset | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [activePanelTab, setActivePanelTab] = useState<'main' | 'custom'>('main');
  const [presetPage, setPresetPage] = useState<number>(0);
  const [draftPresetName, setDraftPresetName] = useState<string>('');

  const sortedPresets = useMemo(() => {
    const defaults = presets.filter((p) => p.isDefault);
    const customs = presets.filter((p) => !p.isDefault);
    return [...defaults, ...customs];
  }, [presets]);

  const visiblePresets = useMemo(
    () => sortedPresets.slice(0, MAX_TOTAL_PRESETS),
    [sortedPresets]
  );

  const presetPages = useMemo(
    () => [
      {
        id: 'page-1',
        items: visiblePresets.slice(0, PAGE_SIZE)
      },
      {
        id: 'page-2',
        items: visiblePresets.slice(PAGE_SIZE, PAGE_SIZE * 2)
      }
    ],
    [visiblePresets]
  );

  const hasSecondPresetPage = (presetPages[1]?.items.length ?? 0) > 0;
  const currentPresetPage = hasSecondPresetPage ? presetPage : 0;
  const hasChanges = previewLight !== savedLight || previewDark !== savedDark;
  const canAddPreset = visiblePresets.length < MAX_TOTAL_PRESETS;
  const customPresetCount = visiblePresets.filter((p) => !p.isDefault).length;
  const editingPreset =
    visiblePresets.find((preset) => preset.id === editingPresetId) ?? null;

  const getNextCustomIndex = useCallback(
    () =>
      presets.reduce((max, preset) => {
        const num =
          typeof preset.id === 'string' && preset.id.startsWith('custom-')
            ? parseInt(preset.id.split('-')[1] ?? '', 10)
            : 0;
        return Number.isNaN(num) ? max : Math.max(max, num);
      }, 0) + 1,
    [presets]
  );

  const handleEnableEditMode = useCallback(
    function handleEnableEditMode() {
      setPresetsBackup(structuredClone(presets));
      setEditMode(true);
      setEditingPresetId(null);
      setIsAddingNew(false);
      setDraftPresetName('');
      setActivePanelTab('main');
    },
    [presets]
  );

  const handleCancelEditMode = useCallback(
    function handleCancelEditMode() {
      if (presetsBackup) setPresets(presetsBackup);
      setPresetsBackup(null);
      setEditMode(false);
      setEditingPresetId(null);
      setIsAddingNew(false);
      setDraftPresetName('');
      setActivePanelTab('main');
      setPreviewLight(savedLight);
      setPreviewDark(savedDark);
    },
    [presetsBackup, savedLight, savedDark]
  );

  const handleApplyChanges = useCallback(
    function handleApplyChanges() {
      savePresets(presets);
      localStorage.setItem(STORAGE_KEYS.LIGHT_SQUARE, previewLight);
      localStorage.setItem(STORAGE_KEYS.DARK_SQUARE, previewDark);
      setSavedLight(previewLight);
      setSavedDark(previewDark);
      setPresetsBackup(null);
      setEditMode(false);
      setEditingPresetId(null);
      setIsAddingNew(false);
      setDraftPresetName('');
      setActivePanelTab('main');
      window.dispatchEvent(new Event('storage'));
    },
    [presets, previewLight, previewDark]
  );

  const handlePresetClick = useCallback(
    function handlePresetClick(preset: BoardPreset) {
      if (editMode) return;
      setPreviewLight(preset.light);
      setPreviewDark(preset.dark);
    },
    [editMode]
  );

  const handleSave = useCallback(
    function handleSave() {
      localStorage.setItem(STORAGE_KEYS.LIGHT_SQUARE, previewLight);
      localStorage.setItem(STORAGE_KEYS.DARK_SQUARE, previewDark);
      savePresets(presets);
      setSavedLight(previewLight);
      setSavedDark(previewDark);
      window.dispatchEvent(new Event('storage'));
    },
    [previewLight, previewDark, presets]
  );

  const handleCustomColorChange = useCallback(function handleCustomColorChange(
    light: string,
    dark: string
  ) {
    setPreviewLight(light);
    setPreviewDark(dark);
  }, []);

  const handleEditColorChange = useCallback(
    function handleEditColorChange(light: string, dark: string) {
      setPreviewLight(light);
      setPreviewDark(dark);
      if (editingPresetId !== null) {
        setPresets((prev) =>
          prev.map((preset) =>
            preset.id === editingPresetId
              ? {
                  ...preset,
                  light,
                  dark
                }
              : preset
          )
        );
      }
    },
    [editingPresetId]
  );

  const handleEditPreset = useCallback(function handleEditPreset(preset: BoardPreset) {
    setEditingPresetId(preset.id);
    setPreviewLight(preset.light);
    setPreviewDark(preset.dark);
    setDraftPresetName(preset.name);
    setIsAddingNew(false);
    setActivePanelTab('custom');
  }, []);

  const handleDeletePreset = useCallback(
    function handleDeletePreset(id: string) {
      if (id === WOOD_PRESET.id) return;
      setPresets((prev) => prev.filter((preset) => preset.id !== id));
      if (editingPresetId === id) {
        setEditingPresetId(null);
        setIsAddingNew(false);
        setDraftPresetName('');
        setActivePanelTab('main');
      }
    },
    [editingPresetId]
  );

  const handleRenamePreset = useCallback(function handleRenamePreset(
    id: string,
    newName: string
  ) {
    const trimmedName = newName.trim();
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === id
          ? {
              ...preset,
              name: trimmedName || preset.name
            }
          : preset
      )
    );
  }, []);

  const handleAddPreset = useCallback(
    function handleAddPreset() {
      if (!canAddPreset) return;
      const nextCustomIndex = getNextCustomIndex();
      setEditingPresetId(null);
      setIsAddingNew(true);
      setDraftPresetName(`Custom ${nextCustomIndex}`);
      setPreviewLight('#e8d5b5');
      setPreviewDark('#a0784c');
      setActivePanelTab('custom');
    },
    [canAddPreset, getNextCustomIndex]
  );

  const handleConfirmAdd = useCallback(
    function handleConfirmAdd() {
      const duplicate = presets.find(
        (preset) =>
          preset.light.toLowerCase() === previewLight.toLowerCase() &&
          preset.dark.toLowerCase() === previewDark.toLowerCase()
      );

      if (duplicate) {
        setDuplicateCheck({
          light: previewLight,
          dark: previewDark,
          existingId: duplicate.id
        });
        return;
      }

      const nextCustomIndex = getNextCustomIndex();
      const nextName = draftPresetName.trim() || `Custom ${nextCustomIndex}`;

      const newPreset: BoardPreset = {
        id: `custom-${nextCustomIndex}`,
        name: nextName,
        light: previewLight,
        dark: previewDark,
        isDefault: false,
        isDeletable: true
      };

      setPresets((prev) => [...prev, newPreset]);
      setIsAddingNew(false);
      setDraftPresetName('');
      setActivePanelTab('main');
      const nextCount = Math.min(presets.length + 1, MAX_TOTAL_PRESETS);
      setPresetPage(nextCount > PAGE_SIZE ? 1 : 0);
    },
    [presets, previewLight, previewDark, draftPresetName, getNextCustomIndex]
  );

  const handleDuplicateRename = useCallback(
    function handleDuplicateRename() {
      const nextCustomIndex = getNextCustomIndex();
      const nextName = draftPresetName.trim() || `Custom ${nextCustomIndex}`;

      const newPreset: BoardPreset = {
        id: `custom-${nextCustomIndex}`,
        name: nextName,
        light: previewLight,
        dark: previewDark,
        isDefault: false,
        isDeletable: true
      };

      setPresets((prev) => [...prev, newPreset]);
      setDuplicateCheck(null);
      setIsAddingNew(false);
      setDraftPresetName('');
      setActivePanelTab('main');
      const nextCount = Math.min(presets.length + 1, MAX_TOTAL_PRESETS);
      setPresetPage(nextCount > PAGE_SIZE ? 1 : 0);
    },
    [presets, previewLight, previewDark, draftPresetName, getNextCustomIndex]
  );

  const handleDuplicateMerge = useCallback(function handleDuplicateMerge() {
    setDuplicateCheck(null);
    setIsAddingNew(false);
    setDraftPresetName('');
    setActivePanelTab('main');
  }, []);

  const handleDragStart = useCallback(function handleDragStart(_event: React.DragEvent, preset: BoardPreset) {
    setDraggedPreset(preset);
  }, []);

  const handleDragOver = useCallback(function handleDragOver(event: React.DragEvent, preset: BoardPreset) {
    event.preventDefault();
    setDragOverId(preset.id);
  }, []);

  const handleDragEnd = useCallback(function handleDragEnd() {
    setDraggedPreset(null);
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    function handleDrop(_event: React.DragEvent, targetPreset: BoardPreset) {
      if (!draggedPreset || draggedPreset.id === targetPreset.id) return;

      setPresets((prev) => {
        const nextPresets = [...prev];
        const dragIndex = nextPresets.findIndex(
          (preset) => preset.id === draggedPreset.id
        );
        const targetIndex = nextPresets.findIndex(
          (preset) => preset.id === targetPreset.id
        );

        if (dragIndex === -1 || targetIndex === -1) return prev;
        const [removed] = nextPresets.splice(dragIndex, 1);
        nextPresets.splice(targetIndex, 0, removed!);
        return nextPresets;
      });

      setDraggedPreset(null);
      setDragOverId(null);
    },
    [draggedPreset]
  );

  const handleChangePanelTab = useCallback(
    (tabId: 'main' | 'custom') => {
      setActivePanelTab(tabId);
      if (tabId === 'main' && !isAddingNew) {
        setEditingPresetId(null);
        setDraftPresetName('');
      }
    },
    [isAddingNew]
  );

  const handlePresetNameCommit = useCallback(() => {
    if (!editMode || isAddingNew || editingPresetId === null) return;
    const trimmed = draftPresetName.trim();
    if (!trimmed) {
      setDraftPresetName(editingPreset?.name ?? '');
      return;
    }
    handleRenamePreset(editingPresetId, trimmed);
    setDraftPresetName(trimmed);
  }, [
    editMode,
    isAddingNew,
    editingPresetId,
    draftPresetName,
    editingPreset,
    handleRenamePreset
  ]);

  useEffect(() => {
    if (!hasSecondPresetPage && presetPage !== 0) {
      setPresetPage(0);
    }
  }, [hasSecondPresetPage, presetPage]);

  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && editMode) handleCancelEditMode();
    }

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [editMode, handleCancelEditMode]);

  useEffect(() => {
    if (!onEditControlsChange) return;
    onEditControlsChange({
      editMode,
      onEnableEditMode: handleEnableEditMode,
      onCancelEditMode: handleCancelEditMode,
      onApplyChanges: handleApplyChanges
    });
  }, [
    onEditControlsChange,
    editMode,
    handleEnableEditMode,
    handleCancelEditMode,
    handleApplyChanges
  ]);

  useEffect(
    () => () => {
      onEditControlsChange?.(null);
    },
    [onEditControlsChange]
  );

  return (
    <div className="h-full max-h-full min-h-0 flex flex-col xl:flex-row overflow-hidden rounded-2xl border border-border/40 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.08),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent)] shadow-[0_20px_45px_-38px_rgba(0,0,0,0.55)]">
      <div className="xl:basis-[51%] xl:border-r border-border/30 p-2 sm:p-3 xl:p-4 flex items-center justify-center min-h-0">
        <BoardPreview light={previewLight} dark={previewDark} />
      </div>

      <div className="xl:basis-[49%] flex flex-col min-h-0">
        <div className="shrink-0 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-text-primary">
                Theme Studio
              </h2>
              <AnimatePresence>
                {editMode && (
                  <motion.span
                    initial={{
                      opacity: 0,
                      y: 4
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    exit={{
                      opacity: 0,
                      y: 4
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20"
                  >
                    Edit Mode
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={handleSave}
              disabled={!hasChanges || editMode}
              size="sm"
              icon={Check}
              className={`px-3 py-1.5 text-xs font-semibold ${!hasChanges || editMode ? 'bg-surface-elevated text-text-muted' : ''}`}
            >
              Save
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 mb-2 p-1 rounded-lg border border-border/60 bg-surface-elevated">
            <div className="grid grid-cols-2 flex-1 gap-1">
              <button
                onClick={() => handleChangePanelTab('main')}
                className={`h-9 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${activePanelTab === 'main' ? 'bg-accent/15 text-accent border border-accent/30' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Main
              </button>
              <button
                onClick={() => handleChangePanelTab('custom')}
                className={`h-9 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${activePanelTab === 'custom' ? 'bg-accent/15 text-accent border border-accent/30' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Custom
              </button>
            </div>
          </div>

          <div className="text-[11px] text-text-muted flex items-center justify-between px-0.5">
            <span>{visiblePresets.length} presets loaded</span>
            <span>{customPresetCount} custom</span>
          </div>
        </div>

        <div className="relative w-full flex-1 overflow-hidden px-3 pb-3 sm:px-4 sm:pb-4 min-h-0">
          <AnimatePresence>
            {editMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute inset-0 rounded-xl bg-accent/3"
              />
            )}
          </AnimatePresence>

          <div className="relative h-full min-h-0">
            {activePanelTab === 'main' ? (
              <div className="h-full min-h-0 flex flex-col">
                <div className="relative flex-1 min-h-0 overflow-hidden">
                  <motion.div
                    className="flex h-full"
                    animate={{ x: `-${currentPresetPage * 100}%` }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {presetPages.map((page, pageIndex) => (
                      <div
                        key={page.id}
                        className="w-full h-full shrink-0 overflow-y-auto pr-1"
                        role="group"
                        aria-label={`Theme preset page ${pageIndex + 1}`}
                      >
                        {page.items.length > 0 ? (
                          <div className="grid grid-cols-8 gap-1.5 sm:gap-2 transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] content-start pb-1">
                            {page.items.map((preset) => (
                              <PresetCard
                                key={preset.id}
                                preset={preset}
                                isActive={
                                  preset.light === previewLight &&
                                  preset.dark === previewDark
                                }
                                onClick={handlePresetClick}
                                editMode={editMode}
                                onEdit={handleEditPreset}
                                onDelete={handleDeletePreset}
                                onRename={handleRenamePreset}
                                dragOverId={dragOverId}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onDragEnd={handleDragEnd}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="h-full min-h-[140px] flex items-center justify-center text-center text-xs text-text-muted">
                            No presets on this page yet.
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                </div>

                <PaginationDots
                  currentPage={currentPresetPage}
                  totalPages={TOTAL_PRESET_PAGES}
                  onPageChange={setPresetPage}
                  isPageDisabled={(pageNum) =>
                    pageNum === 1 && !hasSecondPresetPage
                  }
                />
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-surface-elevated p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg border border-border/40 bg-surface">
                  <div
                    className="w-5 h-5 rounded border border-border/50"
                    style={{ backgroundColor: previewLight }}
                  />
                  <div
                    className="w-5 h-5 rounded border border-border/50"
                    style={{ backgroundColor: previewDark }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {isAddingNew
                        ? 'Creating New Preset'
                        : editingPreset
                          ? `Editing ${editingPreset.name}`
                          : 'Custom Color Mixer'}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      Hue slider and canvas are active for both squares.
                    </p>
                  </div>
                </div>

                {editMode && (
                  <div className="mb-3">
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1.5">
                      Theme Name
                    </label>
                    <input
                      value={draftPresetName}
                      onChange={(event) =>
                        setDraftPresetName(event.target.value.slice(0, 20))
                      }
                      onBlur={handlePresetNameCommit}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handlePresetNameCommit();
                        }
                      }}
                      placeholder="Custom theme name"
                      className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60"
                    />
                  </div>
                )}

                <ColorPickerPanel
                  currentLight={previewLight}
                  currentDark={previewDark}
                  onColorChange={
                    editMode && editingPresetId !== null
                      ? handleEditColorChange
                      : handleCustomColorChange
                  }
                />

                {editMode && (
                  <div className="mt-4 flex gap-2">
                    {isAddingNew ? (
                      <button
                        onClick={handleConfirmAdd}
                        className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-accent hover:bg-accent-hover text-bg shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Wand2 className="w-4 h-4" />
                        Add Theme
                      </button>
                    ) : (
                      <button
                        onClick={handleAddPreset}
                        disabled={!canAddPreset}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors duration-200 flex items-center justify-center gap-2 ${canAddPreset ? 'bg-accent hover:bg-accent-hover text-bg shadow-md' : 'bg-surface-elevated text-text-muted opacity-60 cursor-not-allowed'}`}
                      >
                        <Plus className="w-4 h-4" />
                        New Theme
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditingPresetId(null);
                        setDraftPresetName('');
                        setActivePanelTab('main');
                      }}
                      className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary transition-colors duration-200"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {duplicateCheck && (
        <DuplicateWarningDialog
          light={duplicateCheck.light}
          dark={duplicateCheck.dark}
          onRename={handleDuplicateRename}
          onMerge={handleDuplicateMerge}
          onCancel={() => setDuplicateCheck(null)}
        />
      )}
    </div>
  );
});

ThemeCustomization.displayName = 'ThemeCustomization';
export default ThemeCustomization;
