import { useCallback, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Download, LayoutGrid } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

import { type PageTabGroup, PageTabs } from '@/components/layout';
import { useNotifications } from '@hooks';
import { useHomeExport } from '@hooks';

import { Seo } from '@shared/ui';
import BoardStyleStep from './components/BoardStyleStep';
import ExportSettingsStep from './components/ExportSettingsStep';
import {
  type BatchExportOverrides,
  type HomeStateForExport
} from './ExportPage.types';
import { useExportWizard } from './hooks/useExportWizard';

const TABS: PageTabGroup[] = [
  {
    items: [
      { id: 'board-style', label: 'Board Style', icon: LayoutGrid },
      { id: 'export-settings', label: 'Export Settings', icon: Download }
    ]
  }
];

export interface ExportPageConfig {
  fen: string;
  pieceStyle: string;
  showCoords: boolean;
  showCoordinateBorder: boolean;
  showThinFrame: boolean;
  lightSquare: string;
  darkSquare: string;
  exportQuality: number;
  boardSize: number;
  flipped: boolean;
  fileName: string;
}

const ExportPage = () => {
  const location = useLocation();
  const initialState = location.state as ExportPageConfig | null;

  // If accessed directly without state, redirect to home.
  if (!initialState) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Seo
        name="Export Studio"
        description="Export chess board images with custom styles."
      />
      <ExportPageInner config={initialState} />
    </>
  );
};

const ExportPageInner = ({ config }: { config: ExportPageConfig }) => {
  const wizard = useExportWizard();
  const [activeTab, setActiveTab] = useState<'board-style' | 'export-settings'>(
    'board-style'
  );
  const { success, error, info } = useNotifications();

  // Local state for the export page, initialized from the config passed via router state.
  const [fen] = useState(config.fen); // FEN is read-only here
  const [flipped] = useState(config.flipped); // Flipped is read-only here
  const [pieceStyle, setPieceStyle] = useState(config.pieceStyle);
  const [showCoords, setShowCoords] = useState(config.showCoords);
  const [showCoordinateBorder, setShowCoordinateBorder] = useState(
    config.showCoordinateBorder
  );
  const [showThinFrame, setShowThinFrame] = useState(config.showThinFrame);
  const [lightSquare, setLightSquare] = useState(config.lightSquare);
  const [darkSquare, setDarkSquare] = useState(config.darkSquare);
  const [exportQuality, setExportQuality] = useState(config.exportQuality);
  const [boardSize, setBoardSize] = useState(config.boardSize);

  // Initialize the export API
  const exportApi = useHomeExport({
    fen,
    fileName: config.fileName,
    boardSize,
    exportQuality,
    showCoords,
    showCoordinateBorder,
    showThinFrame,
    lightSquare,
    darkSquare,
    flipped,
    saveExportFen: () => {},
    notify: { success, error, info }
  });

  const homeState: HomeStateForExport = {
    fen,
    flipped,
    pieceStyle,
    setPieceStyle,
    showCoords,
    setShowCoords,
    showCoordinateBorder,
    setShowCoordinateBorder,
    showThinFrame,
    setShowThinFrame,
    lightSquare,
    setLightSquare,
    darkSquare,
    setDarkSquare,
    exportQuality,
    setExportQuality,
    boardSize,
    setBoardSize,
    handleBatchExport: exportApi.handleBatchExport
  };

  const handleFinish = useCallback(() => {
    const selectedFormats = [...wizard.selectedFormats];
    const names = selectedFormats.map(
      (format) => wizard.resolvedFileNames[format]
    );
    const overrides: BatchExportOverrides = {
      boardSize: wizard.activeBoardSize,
      exportQuality: wizard.resolution
    };
    setBoardSize(wizard.activeBoardSize);
    setExportQuality(wizard.resolution);
    void exportApi.handleBatchExport(selectedFormats, names, overrides);
  }, [exportApi, wizard]);

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-container flex flex-col gap-6 py-6 sm:py-10 md:flex-row md:gap-8 lg:gap-10">
        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="shrink-0 mb-6 md:mb-0 md:border-r md:border-border md:pr-8 md:w-52 lg:w-56">
          <div className="md:sticky md:top-10 flex flex-col gap-6">
            <PageTabs
              groups={TABS}
              activeId={activeTab}
              onSelect={(id) =>
                setActiveTab(id as 'board-style' | 'export-settings')
              }
              ariaLabel="Export Studio sections"
            />
          </div>
        </div>

        {/* ── Content area ──────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
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
                <ExportSettingsStep wizard={wizard} onExport={handleFinish} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
