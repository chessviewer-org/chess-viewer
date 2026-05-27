import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, LayoutGrid, Palette, SlidersHorizontal } from 'lucide-react';

import { Button } from '@shared/ui';

interface ThemeStudioHeaderProps {
  editMode: boolean;
  hasChanges: boolean;
  activePanelTab: 'main' | 'custom';
  visiblePresetsCount: number;
  customPresetCount: number;
  onSave: () => void;
  onChangePanelTab: (tabId: 'main' | 'custom') => void;
}

const ThemeStudioHeader = memo(function ThemeStudioHeader({
  editMode,
  hasChanges,
  activePanelTab,
  visiblePresetsCount,
  customPresetCount,
  onSave,
  onChangePanelTab
}: ThemeStudioHeaderProps) {
  return (
    <div className="shrink-0 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-text-primary">Theme Studio</h2>
          <AnimatePresence>
            {editMode && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20"
              >
                Edit Mode
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <Button
          onClick={onSave}
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
            onClick={() => onChangePanelTab('main')}
            className={`h-9 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${activePanelTab === 'main' ? 'bg-accent/15 text-accent border border-accent/30' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Main
          </button>
          <button
            onClick={() => onChangePanelTab('custom')}
            className={`h-9 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${activePanelTab === 'custom' ? 'bg-accent/15 text-accent border border-accent/30' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>
      </div>

      <div className="text-[11px] text-text-muted flex items-center justify-between px-0.5">
        <span>{visiblePresetsCount} presets loaded</span>
        <span>{customPresetCount} custom</span>
      </div>
    </div>
  );
});

ThemeStudioHeader.displayName = 'ThemeStudioHeader';
export default ThemeStudioHeader;
