import { memo } from 'react';
import { motion } from 'framer-motion';

import type { BoardPreset } from '@/shared/types';

import PaginationDots from './PaginationDots';
import PresetCard from './PresetCard';
import { TOTAL_PRESET_PAGES } from './useThemeCustomization';

interface PresetGridPanelProps {
  presetPages: { id: string; items: BoardPreset[] }[];
  currentPresetPage: number;
  hasSecondPresetPage: boolean;
  previewLight: string;
  previewDark: string;
  editMode: boolean;
  dragOverId: string | null;
  onPresetClick: (preset: BoardPreset) => void;
  onEditPreset: (preset: BoardPreset) => void;
  onDeletePreset: (id: string) => void;
  onRenamePreset: (id: string, newName: string) => void;
  onDragStart: (event: React.DragEvent, preset: BoardPreset) => void;
  onDragOver: (event: React.DragEvent, preset: BoardPreset) => void;
  onDragEnd: () => void;
  onDrop: (event: React.DragEvent, preset: BoardPreset) => void;
  onPageChange: (page: number) => void;
}

const PresetGridPanel = memo(function PresetGridPanel({
  presetPages,
  currentPresetPage,
  hasSecondPresetPage,
  previewLight,
  previewDark,
  editMode,
  dragOverId,
  onPresetClick,
  onEditPreset,
  onDeletePreset,
  onRenamePreset,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onPageChange
}: PresetGridPanelProps) {
  return (
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
                      onClick={onPresetClick}
                      editMode={editMode}
                      onEdit={onEditPreset}
                      onDelete={onDeletePreset}
                      onRename={onRenamePreset}
                      dragOverId={dragOverId}
                      onDragStart={onDragStart}
                      onDragOver={onDragOver}
                      onDrop={onDrop}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full min-h-35 flex items-center justify-center text-center text-xs text-text-muted">
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
        onPageChange={onPageChange}
        isPageDisabled={(pageNum) => pageNum === 1 && !hasSecondPresetPage}
      />
    </div>
  );
});

PresetGridPanel.displayName = 'PresetGridPanel';
export default PresetGridPanel;
