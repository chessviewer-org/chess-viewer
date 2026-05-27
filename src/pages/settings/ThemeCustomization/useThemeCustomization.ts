import { useCallback, useEffect, useState } from 'react';
import { MAX_TOTAL_PRESETS, WOOD_PRESET } from '@constants';
import type { BoardPreset } from '@/shared/types';
import { usePresetColors } from './hooks/usePresetColors';
import { usePresetDnd } from './hooks/usePresetDnd';
import {
  PAGE_SIZE,
  TOTAL_PRESET_PAGES,
  usePresetPagination
} from './hooks/usePresetPagination';

export { PAGE_SIZE, TOTAL_PRESET_PAGES };

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
  const {
    savedLight,
    savedDark,
    previewLight,
    previewDark,
    setPreviewLight,
    setPreviewDark,
    presets,
    setPresets,
    persist,
    restoreSaved
  } = usePresetColors();

  const {
    visiblePresets,
    presetPages,
    hasSecondPresetPage,
    currentPresetPage,
    setPresetPage
  } = usePresetPagination(presets);

  const dnd = usePresetDnd({ setPresets });

  const [presetsBackup, setPresetsBackup] = useState<BoardPreset[] | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [activePanelTab, setActivePanelTab] = useState<'main' | 'custom'>('main');
  const [draftPresetName, setDraftPresetName] = useState<string>('');

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

  const resetUiState = useCallback(() => {
    setEditingPresetId(null);
    setIsAddingNew(false);
    setDraftPresetName('');
    setActivePanelTab('main');
  }, []);

  const handleEnableEditMode = useCallback(() => {
    setPresetsBackup(structuredClone(presets));
    setEditMode(true);
    resetUiState();
  }, [presets, resetUiState]);

  const handleCancelEditMode = useCallback(() => {
    if (presetsBackup) setPresets(presetsBackup);
    setPresetsBackup(null);
    setEditMode(false);
    resetUiState();
    restoreSaved();
  }, [presetsBackup, restoreSaved, resetUiState, setPresets]);

  const handleApplyChanges = useCallback(() => {
    persist(presets, previewLight, previewDark);
    setPresetsBackup(null);
    setEditMode(false);
    resetUiState();
  }, [presets, previewLight, previewDark, persist, resetUiState]);

  const handlePresetClick = useCallback(
    (preset: BoardPreset) => {
      if (editMode) return;
      setPreviewLight(preset.light);
      setPreviewDark(preset.dark);
    },
    [editMode, setPreviewLight, setPreviewDark]
  );

  const handleSave = useCallback(() => {
    persist(presets, previewLight, previewDark);
  }, [presets, previewLight, previewDark, persist]);

  const handleCustomColorChange = useCallback(
    (light: string, dark: string) => {
      setPreviewLight(light);
      setPreviewDark(dark);
    },
    [setPreviewLight, setPreviewDark]
  );

  const handleEditColorChange = useCallback(
    (light: string, dark: string) => {
      setPreviewLight(light);
      setPreviewDark(dark);
      if (editingPresetId !== null) {
        setPresets((prev) =>
          prev.map((preset) =>
            preset.id === editingPresetId ? { ...preset, light, dark } : preset
          )
        );
      }
    },
    [editingPresetId, setPresets, setPreviewLight, setPreviewDark]
  );

  const handleEditPreset = useCallback(
    (preset: BoardPreset) => {
      setEditingPresetId(preset.id);
      setPreviewLight(preset.light);
      setPreviewDark(preset.dark);
      setDraftPresetName(preset.name);
      setIsAddingNew(false);
      setActivePanelTab('custom');
    },
    [setPreviewLight, setPreviewDark]
  );

  const handleDeletePreset = useCallback(
    (id: string) => {
      if (id === WOOD_PRESET.id) return;
      setPresets((prev) => prev.filter((preset) => preset.id !== id));
      if (editingPresetId === id) resetUiState();
    },
    [editingPresetId, setPresets, resetUiState]
  );

  const handleRenamePreset = useCallback(
    (id: string, newName: string) => {
      const trimmed = newName.trim();
      setPresets((prev) =>
        prev.map((preset) =>
          preset.id === id ? { ...preset, name: trimmed || preset.name } : preset
        )
      );
    },
    [setPresets]
  );

  const handleAddPreset = useCallback(() => {
    if (!canAddPreset) return;
    const nextCustomIndex = getNextCustomIndex();
    setEditingPresetId(null);
    setIsAddingNew(true);
    setDraftPresetName(`Custom ${nextCustomIndex}`);
    setPreviewLight('#e8d5b5');
    setPreviewDark('#a0784c');
    setActivePanelTab('custom');
  }, [canAddPreset, getNextCustomIndex, setPreviewLight, setPreviewDark]);

  const appendPreset = useCallback(
    (name: string) => {
      const nextCustomIndex = getNextCustomIndex();
      const newPreset: BoardPreset = {
        id: `custom-${nextCustomIndex}`,
        name: name.trim() || `Custom ${nextCustomIndex}`,
        light: previewLight,
        dark: previewDark,
        isDefault: false,
        isDeletable: true
      };
      setPresets((prev) => [...prev, newPreset]);
      const nextCount = Math.min(presets.length + 1, MAX_TOTAL_PRESETS);
      setPresetPage(nextCount > PAGE_SIZE ? 1 : 0);
    },
    [presets, previewLight, previewDark, getNextCustomIndex, setPresets, setPresetPage]
  );

  const handleConfirmAdd = useCallback(() => {
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
    appendPreset(draftPresetName);
    setIsAddingNew(false);
    setDraftPresetName('');
    setActivePanelTab('main');
  }, [presets, previewLight, previewDark, draftPresetName, appendPreset]);

  const handleDuplicateRename = useCallback(() => {
    appendPreset(draftPresetName);
    setDuplicateCheck(null);
    setIsAddingNew(false);
    setDraftPresetName('');
    setActivePanelTab('main');
  }, [draftPresetName, appendPreset]);

  const handleDuplicateMerge = useCallback(() => {
    setDuplicateCheck(null);
    setIsAddingNew(false);
    setDraftPresetName('');
    setActivePanelTab('main');
  }, []);

  const handleDuplicateCancel = useCallback(() => setDuplicateCheck(null), []);

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

  const handleCustomDoneClick = useCallback(() => resetUiState(), [resetUiState]);

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
    dragOverId: dnd.dragOverId,
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
    handleDragStart: dnd.handleDragStart,
    handleDragOver: dnd.handleDragOver,
    handleDragEnd: dnd.handleDragEnd,
    handleDrop: dnd.handleDrop,
    handleChangePanelTab,
    handlePresetNameCommit,
    handleCustomDoneClick
  };
}
