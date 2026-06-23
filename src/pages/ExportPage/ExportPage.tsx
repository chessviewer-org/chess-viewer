import { useCallback, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Download, LayoutGrid } from 'lucide-react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

import { type PageTabGroup, PageTabs } from '@/components/layout';
import { useHomeExport, useNotifications, usePieceImages } from '@hooks';

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

  // Seo renders before the redirect so Googlebot sees the canonical tag and
  // description on /export even when no router state is present (direct visit).
  if (!initialState) {
    return (
      <>
        <Seo
          name="Export Chess Diagram"
          path="/export"
          description="Export your chess diagram as a high-resolution PNG, JPEG, or SVG. Choose DPI, board size, piece style, and colors — then download instantly. Free, no watermarks."
        />
        <Navigate to="/" replace />
      </>
    );
  }

  return (
    <>
      <Seo
        name="Export Chess Diagram"
        path="/export"
        description="Export your chess diagram as a high-resolution PNG, JPEG, or SVG. Choose DPI, board size, piece style, and colors — then download instantly. Free, no watermarks."
      />
      <ExportPageInner config={initialState} />
    </>
  );
};

const ExportPageInner = ({ config }: { config: ExportPageConfig }) => {
  const wizard = useExportWizard();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState<
    'board-style' | 'export-settings'
  >(
    (searchParams.get('tab') as 'board-style' | 'export-settings') ||
      'board-style'
  );

  const setActiveTab = useCallback(
    (tab: 'board-style' | 'export-settings') => {
      setActiveTabState(tab);
      setSearchParams(
        (prev) => {
          prev.set('tab', tab);
          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    const tab = searchParams.get('tab') as 'board-style' | 'export-settings';
    if (tab && tab !== activeTab) {
      setActiveTabState(tab);
    }
  }, [searchParams, activeTab]);

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

  const { pieceImages, isLoading } = usePieceImages(pieceStyle);

  useEffect(() => {
    if (!isLoading && pieceImages) {
      exportApi.handlePieceImagesChange(pieceImages);
    }
  }, [pieceImages, isLoading, exportApi]);

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
    <div className="flex flex-col bg-bg min-h-full lg:h-full lg:overflow-hidden">
      <div className="page-container flex flex-col gap-6 py-6 sm:py-10 md:flex-row md:gap-8 lg:gap-10 h-full">
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
