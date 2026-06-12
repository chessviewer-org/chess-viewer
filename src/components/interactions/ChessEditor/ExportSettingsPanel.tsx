import { memo, useCallback, useState } from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Image, Palette } from 'lucide-react';

import type { HomeStateForExport } from '@/pages/HomePage/components/ExportStudio.types';
import PieceDisplayStep from '@/pages/HomePage/components/PieceDisplayStep';

import EditorThemePresets from './EditorThemePresets';

export interface ExportSettingsPanelProps {
  homeState: HomeStateForExport;
}

type SettingsTab = 'theme' | 'pieces';

const TABS: { id: SettingsTab; label: string; Icon: typeof Palette }[] = [
  { id: 'theme', label: 'Theme', Icon: Palette },
  { id: 'pieces', label: 'Pieces', Icon: Image }
];

export const ExportSettingsPanel = memo(function ExportSettingsPanel({
  homeState
}: ExportSettingsPanelProps) {
  const reduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');

  const { setLightSquare, setDarkSquare } = homeState;

  const handleThemeSelect = useCallback(
    (light: string, dark: string) => {
      setLightSquare(light);
      setDarkSquare(dark);
    },
    [setLightSquare, setDarkSquare]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar — two tabs (Theme · Pieces). Sits just below the persistent
          toolbar separator, exactly like ClipboardHistory's content starts
          right below the header separator. */}
      <div
        role="tablist"
        aria-label="Board appearance sections"
        className="grid grid-cols-2 gap-1 pb-2 mb-1 border-b border-border/40 shrink-0"
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-elevated'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable content — one tab at a time with slide transition. */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {activeTab === 'theme' ? (
              // Curated, grouped (2D · 3D) most-used presets only. The full
              // theme studio — edit mode, add, reorder, custom colours — lives
              // in the export flow (ThemeStudioStep), not here.
              <EditorThemePresets
                selectedLight={homeState.lightSquare}
                selectedDark={homeState.darkSquare}
                onSelect={handleThemeSelect}
              />
            ) : (
              // Pieces tab is the piece-set selector ONLY — DisplayOptions is
              // intentionally excluded from this panel (it lives in the editor
              // controls / export flow instead).
              <PieceDisplayStep homeState={homeState} hideHeaders pieceOnly />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

ExportSettingsPanel.displayName = 'ExportSettingsPanel';
export default ExportSettingsPanel;
