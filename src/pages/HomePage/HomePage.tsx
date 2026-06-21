import React from 'react';

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { ExportProgress, FenToolbar } from '@/components/features';
import { ChessEditor } from '@/components/interactions';
import { getRouteSeo, SOFTWARE_APP_SCHEMA, WEBSITE_SCHEMA } from '@constants';

import { NotificationContainer, Seo } from '@shared/ui';
import { useHome } from './hooks/useHome';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Primary workspace combining the DnD board editor, control panel, and export studio trigger. */
const HomePage: React.FC = () => {
  const {
    fen,
    setFen,
    pieceStyle,
    showCoords,
    setShowCoords,
    showCoordinateBorder,
    showThinFrame,
    setShowThinFrame,
    lightSquare,
    darkSquare,
    boardSize,
    exportQuality,
    flipped,
    setIsFavorite,
    addToFavoritesRef,
    exportState,
    notifications,
    removeNotification,
    fileName,
    saveManualFen,
    saveExportFen,
    addCurrentToFavorites,

    handlePieceImagesChange,
    handleCancelExport,
    handlePause,
    handleResume,
    handleEditorFenChange,
    handleFlip,
    handleNotification,
    toggleProgress,
    getExportConfig
  } = useHome();

  const navigate = useNavigate();
  const handleDownloadClick = () => {
    navigate('/export', {
      state: {
        fen,
        pieceStyle,
        showCoords,
        showCoordinateBorder,
        showThinFrame,
        lightSquare,
        darkSquare,
        exportQuality,
        boardSize,
        flipped,
        fileName
      }
    });
  };

  const isCustomFen = fen && fen !== STARTING_FEN;
  // If user is viewing a custom FEN, append it to canonical URL and point to
  // the Supabase Edge Function for dynamic OG image generation.
  const dynamicParams = isCustomFen
    ? `?fen=${encodeURIComponent(fen)}`
    : undefined;

  // Use VITE_SUPABASE_URL to construct the absolute URL to the Edge Function.
  // We cannot use SITE_URL/api/og because Nginx does not proxy it by default.
  const supabaseUrl =
    import.meta.env['VITE_SUPABASE_URL']?.replace(/\/$/, '') ||
    'https://placeholder.supabase.co';
  const dynamicOgImage = isCustomFen
    ? `${supabaseUrl}/functions/v1/og-image${dynamicParams}`
    : undefined;

  return (
    <>
      <Seo
        {...getRouteSeo('/')}
        dynamicParams={dynamicParams}
        image={dynamicOgImage ?? getRouteSeo('/').image}
        schema={[WEBSITE_SCHEMA, SOFTWARE_APP_SCHEMA]}
      />
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full h-auto lg:h-full lg:overflow-hidden min-h-0 bg-bg py-2 overflow-x-hidden"
      >
        {/* Same width formula as the navbar inner container (Navbar.tsx) so the
            page edges line up pixel-exact with the ChessVision logo on the left
            and the account menu on the right. No extra outer px-* padding — that
            would shrink the page narrower than the navbar.

            Layout skeleton is a CSS Grid (NOT a flex column): a `auto`-sized
            row for the FEN/control toolbar and a `minmax(0,1fr)` row for the
            board card. The grid resolves the board card's height deterministically
            from the remaining track instead of relying on `flex-1` reflow, and
            `min-h-0` on the rows lets the card's own scroll/overflow take over
            cleanly. Vertical rhythm via the fluid `gap-fluid-xs` token. */}
        <div className="grid grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:content-center gap-fluid-xs lg:gap-[12px] page-container h-auto lg:h-full min-h-0 pt-[5px] lg:pt-0">
          <div className="min-w-0">
            <FenToolbar
              fen={fen}
              setFen={setFen}
              addToFavoritesRef={addToFavoritesRef}
              onFavoriteStatusChange={setIsFavorite}
              saveManualFen={saveManualFen}
              saveExportFen={saveExportFen}
              addCurrentToFavorites={addCurrentToFavorites}
              onNotification={handleNotification}
            />
          </div>
          <div className="min-w-0 min-h-0 self-start w-full">
            <div className="workspace-container lg:overscroll-trap bg-surface border border-border/40 rounded-xl p-fluid-xs sm:p-fluid-sm h-auto lg:max-h-full overflow-visible lg:overflow-hidden">
              <ChessEditor
                fen={fen}
                onFenChange={handleEditorFenChange}
                pieceStyle={pieceStyle}
                showCoords={showCoords}
                setShowCoords={setShowCoords}
                showThinFrame={showThinFrame}
                setShowThinFrame={setShowThinFrame}
                exportQuality={exportQuality}
                showCoordinateBorder={showCoordinateBorder}
                lightSquare={lightSquare}
                darkSquare={darkSquare}
                flipped={flipped}
                onFlip={handleFlip}
                onNotify={handleNotification}
                onDownload={handleDownloadClick}
                onPieceImagesChange={handlePieceImagesChange}
              />
            </div>
          </div>
        </div>

        <NotificationContainer
          notifications={notifications}
          onRemove={removeNotification}
        />

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
    </>
  );
};

export default HomePage;
