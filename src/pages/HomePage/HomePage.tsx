import React, { useState } from 'react';
import {
  ControlPanel,
  ExportProgress
} from '@/components/features';
import ExportStudio from './components/ExportStudio';
import { ChessEditor, DndProvider } from '@/components/interactions';
import { NotificationContainer } from '@shared/ui';
import { motion } from 'framer-motion';
import { useHome } from './hooks/useHome';

/**
 * HomePage component serves as the primary workspace dashboard.
 * Encapsulates the Drag-and-Drop chess editor environment, control settings panels,
 * download actions, and real-time export progress.
 *
 * Employs a highly minimalist, ultra-subtle fade-in page mount transition.
 *
 * @returns Sneppy, instant React workspace panel layout
 */
const HomePage: React.FC = () => {
  const {
    fen,
    setFen,
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
    boardSize,
    setBoardSize,
    exportQuality,
    setExportQuality,
    flipped,
    setIsFavorite,
    addToFavoritesRef,
    exportState,
    notifications,
    removeNotification,

    saveManualFen,
    saveExportFen,
    addCurrentToFavorites,

    handlePieceImagesChange,
    handleBatchExport,
    handleCancelExport,
    handlePause,
    handleResume,
    handleEditorFenChange,
    handleNotification,
    toggleProgress,
    getExportConfig
  } = useHome();

  const [isExportStudioOpen, setIsExportStudioOpen] = useState(false);

  const homeState = {
    fen,
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
    boardSize,
    setBoardSize,
    exportQuality,
    setExportQuality,
    flipped,
    handleBatchExport
  };

  return (
    <DndProvider>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full min-h-0 bg-bg pt-16 sm:pt-20 lg:pt-24 px-3 sm:px-6 lg:px-8 pb-8 sm:pb-12 overflow-y-auto overflow-x-hidden"
      >
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="flex flex-col xl:flex-row xl:items-start gap-4 lg:gap-5 xl:gap-6 min-w-0">
            {/* Left Column — Board + Actions */}
            <div className="w-full xl:flex-1 space-y-3 sm:space-y-4 min-w-0 min-h-0">
              <div className="bg-surface border border-border/40 rounded-xl p-3 sm:p-4">
                <ChessEditor
                  fen={fen}
                  onFenChange={handleEditorFenChange}
                  pieceStyle={pieceStyle}
                  showCoords={showCoords}
                  lightSquare={lightSquare}
                  darkSquare={darkSquare}
                  flipped={flipped}
                  onPieceImagesChange={handlePieceImagesChange}
                />
              </div>

              <div className="bg-surface border border-border/40 rounded-xl p-3 sm:p-4 lg:p-5 flex flex-col xs:flex-row gap-3">
                <button
                  type="button"
                  className="flex-1 flex justify-center items-center px-4 py-3 min-h-11 text-sm font-semibold text-text-primary bg-transparent border border-border/50 rounded-lg hover:bg-surface-hover hover:border-text-muted transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Open in Device
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportStudioOpen(true)}
                  className="flex-1 flex justify-center items-center px-4 py-3 min-h-11 text-sm font-semibold text-bg bg-accent border border-accent/20 rounded-lg hover:bg-accent-hover transition-colors duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  Download
                </button>
              </div>
            </div>

            {/* Right Column — Settings Sidebar */}
            <div className="w-full min-w-0 xl:w-[clamp(360px,32vw,560px)] xl:flex-none xl:sticky xl:top-[6rem]">
              <ControlPanel
                fen={fen}
                setFen={setFen}
                pieceStyle={pieceStyle}
                setPieceStyle={setPieceStyle}
                showCoords={showCoords}
                setShowCoords={setShowCoords}
                showCoordinateBorder={showCoordinateBorder}
                setShowCoordinateBorder={setShowCoordinateBorder}
                showThinFrame={showThinFrame}
                setShowThinFrame={setShowThinFrame}
                exportQuality={exportQuality}
                addToFavoritesRef={addToFavoritesRef}
                onFavoriteStatusChange={setIsFavorite}
                saveManualFen={saveManualFen}
                saveExportFen={saveExportFen}
                addCurrentToFavorites={addCurrentToFavorites}
                onNotification={handleNotification}
              />
            </div>
          </div>
        </div>

        <NotificationContainer
          notifications={notifications}
          onRemove={removeNotification}
        />

        {isExportStudioOpen && (
          <ExportStudio
            homeState={homeState}
            onClose={() => setIsExportStudioOpen(false)}
          />
        )}

        {exportState.showProgress && (
          <ExportProgress
            isExporting={exportState.isExporting}
            progress={exportState.exportProgress}
            currentFormat={exportState.currentFormat || ''}
            config={getExportConfig()}
            isPaused={exportState.isPaused}
            onClose={toggleProgress}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={handleCancelExport}
          />
        )}
      </motion.div>
    </DndProvider>
  );
};

export default HomePage;
