import { useCallback, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Download, LayoutGrid } from 'lucide-react';

import { type PageTabGroup, PageTabs } from '@/components/layout';

import { useExportWizard } from '../hooks/useExportWizard';
import BoardStyleStep from './BoardStyleStep';
import ExportSettingsStep from './ExportSettingsStep';
import {
  type BatchExportOverrides,
  type HomeStateForExport
} from './ExportStudio.types';

/** Props for the full-screen export studio overlay. */
interface ExportStudioProps {
  homeState: HomeStateForExport;
  onClose: () => void;
}

const TABS: PageTabGroup[] = [
  {
    items: [
      { id: 'board-style', label: 'Board Style', icon: LayoutGrid },
      { id: 'export-settings', label: 'Export Settings', icon: Download }
    ]
  }
];

/** Full-screen export studio with a Settings-style sidebar and content area. */
const ExportStudio = ({ homeState, onClose }: ExportStudioProps) => {
  const wizard = useExportWizard();
  const [activeTab, setActiveTab] = useState<'board-style' | 'export-settings'>(
    'board-style'
  );

  // Lock background scroll (including mobile Safari) and close on Escape.
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY.toString()}px`;
    document.body.style.width = '100%';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleFinish = useCallback(() => {
    const selectedFormats = [...wizard.selectedFormats];
    const names = selectedFormats.map(
      (format) => wizard.resolvedFileNames[format]
    );
    const overrides: BatchExportOverrides = {
      boardSize: wizard.activeBoardSize,
      exportQuality: wizard.resolution
    };
    homeState.setBoardSize(wizard.activeBoardSize);
    homeState.setExportQuality(wizard.resolution);
    void homeState.handleBatchExport(selectedFormats, names, overrides);
    onClose();
  }, [homeState, onClose, wizard]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-studio-title"
      className="fixed inset-x-0 z-49 bg-bg border-t border-border overflow-hidden"
      style={{
        top: 'calc(var(--navbar-height) + max(0px, env(safe-area-inset-top)))',
        height:
          'calc(100dvh - var(--navbar-height) - max(0px, env(safe-area-inset-top)))'
      }}
    >
      <h2 id="export-studio-title" className="sr-only">
        Export Studio
      </h2>

      {/* Two-column layout: sticky sidebar left, content right — mirrors
          Settings/About page structure (GitHub-settings pattern).
          `page-container` aligns the inner edges with the navbar logo/menu. */}
      <div className="page-container flex h-full overflow-hidden py-6 sm:py-8 gap-8 lg:gap-10">
        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 flex-col justify-between gap-6 border-r border-border pr-8 w-44 sm:w-48 lg:w-52">
          <PageTabs
            groups={TABS}
            activeId={activeTab}
            onSelect={(id) =>
              setActiveTab(id as 'board-style' | 'export-settings')
            }
            ariaLabel="Export Studio sections"
          />

          {/* Bottom actions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleFinish}
              className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-bold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ── Content area ──────────────────────────────────────────────────── */}
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'board-style' && (
              <motion.div
                key="board-style"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="h-full"
              >
                <BoardStyleStep homeState={homeState} />
              </motion.div>
            )}

            {activeTab === 'export-settings' && (
              <motion.div
                key="export-settings"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="h-full"
              >
                <ExportSettingsStep wizard={wizard} homeState={homeState} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ExportStudio;
