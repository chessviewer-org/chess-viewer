import { useCallback, useEffect, useMemo, useState } from 'react';

import { MAX_TOTAL_PRESETS, STORAGE_KEYS, WOOD_PRESET } from '@constants';
import { loadPresets, readSquare, savePresets } from '@utils';
import type { BoardPreset } from '@/shared/types';

export const PAGE_SIZE = 40;
export const TOTAL_PRESET_PAGES = 2;

export interface ThemeEditControls {
  editMode: boolean;
  onEnableEditMode: () => void;
  onCancelEditMode: () => void;
  onApplyChanges: () => void;
}

interface DuplicateCheck {
  light: string;
  dark: string;
  existingId: string;
}

interface UseThemeCustomizationOptions {
  onEditControlsChange?: ((controls: ThemeEditControls | null) => void) | undefined;
}

export function useThemeCustomization({
  onEditControlsChange
}: UseThemeCustomizationOptions) {
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

  const handleDuplicateCancel = useCallback(function handleDuplicateCancel() {
    setDuplicateCheck(null);
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

  const handleCustomDoneClick = useCallback(() => {
    setIsAddingNew(false);
    setEditingPresetId(null);
    setDraftPresetName('');
    setActivePanelTab('main');
  }, []);

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

  return {
    previewLight,
    previewDark,
    presetPages,
    hasSecondPresetPage,
    currentPresetPage,
    hasChanges,
    canAddPreset,
    customPresetCount,
    visiblePresets,
    editingPreset,
    editingPresetId,
    editMode,
    isAddingNew,
    activePanelTab,
    duplicateCheck,
    dragOverId,
    draftPresetName,
    setDraftPresetName,
    setPresetPage,
    handlePresetClick,
    handleSave,
    handleEditPreset,
    handleDeletePreset,
    handleRenamePreset,
    handleAddPreset,
    handleConfirmAdd,
    handleCustomColorChange,
    handleEditColorChange,
    handleDuplicateRename,
    handleDuplicateMerge,
    handleDuplicateCancel,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleChangePanelTab,
    handlePresetNameCommit,
    handleCustomDoneClick
  };
}
