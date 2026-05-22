import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import BoardPreview from './BoardPreview';
import CustomMixerPanel from './CustomMixerPanel';
import DuplicateWarningDialog from './DuplicateWarningDialog';
import PresetGridPanel from './PresetGridPanel';
import ThemeStudioHeader from './ThemeStudioHeader';
import { useThemeCustomization, type ThemeEditControls } from './useThemeCustomization';

export type { ThemeEditControls };

export interface ThemeCustomizationProps {
  onEditControlsChange?: (controls: ThemeEditControls | null) => void;
}

const ThemeCustomization = memo(function ThemeCustomization({
  onEditControlsChange
}: ThemeCustomizationProps) {
  const {
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
  } = useThemeCustomization({ onEditControlsChange });

  return (
    <div className="h-full max-h-full min-h-0 flex flex-col xl:flex-row overflow-hidden rounded-2xl border border-border/40 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.08),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent)] shadow-[0_20px_45px_-38px_rgba(0,0,0,0.55)]">
      <div className="xl:basis-[51%] xl:border-r border-border/30 p-2 sm:p-3 xl:p-4 flex items-center justify-center min-h-0">
        <BoardPreview light={previewLight} dark={previewDark} />
      </div>

      <div className="xl:basis-[49%] flex flex-col min-h-0">
        <ThemeStudioHeader
          editMode={editMode}
          hasChanges={hasChanges}
          activePanelTab={activePanelTab}
          visiblePresetsCount={visiblePresets.length}
          customPresetCount={customPresetCount}
          onSave={handleSave}
          onChangePanelTab={handleChangePanelTab}
        />

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
              <PresetGridPanel
                presetPages={presetPages}
                currentPresetPage={currentPresetPage}
                hasSecondPresetPage={hasSecondPresetPage}
                previewLight={previewLight}
                previewDark={previewDark}
                editMode={editMode}
                dragOverId={dragOverId}
                onPresetClick={handlePresetClick}
                onEditPreset={handleEditPreset}
                onDeletePreset={handleDeletePreset}
                onRenamePreset={handleRenamePreset}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                onPageChange={setPresetPage}
              />
            ) : (
              <CustomMixerPanel
                previewLight={previewLight}
                previewDark={previewDark}
                editMode={editMode}
                isAddingNew={isAddingNew}
                canAddPreset={canAddPreset}
                editingPreset={editingPreset}
                editingPresetId={editingPresetId}
                draftPresetName={draftPresetName}
                setDraftPresetName={setDraftPresetName}
                onPresetNameCommit={handlePresetNameCommit}
                onCustomColorChange={handleCustomColorChange}
                onEditColorChange={handleEditColorChange}
                onAddPreset={handleAddPreset}
                onConfirmAdd={handleConfirmAdd}
                onDoneClick={handleCustomDoneClick}
              />
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
          onCancel={handleDuplicateCancel}
        />
      )}
    </div>
  );
});

ThemeCustomization.displayName = 'ThemeCustomization';
export default ThemeCustomization;
