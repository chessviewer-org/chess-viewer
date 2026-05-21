import React, { memo } from 'react';
import { motion, Variants } from 'framer-motion';
import { ControlPanel } from '@/components/features';

interface HomePageSidebarProps {
  itemVariants: Variants;
  fen: string;
  setFen: (fen: string) => void;
  pieceStyle: string;
  setPieceStyle: (style: string) => void;
  showCoords: boolean;
  setShowCoords: (show: boolean) => void;
  showCoordinateBorder: boolean;
  setShowCoordinateBorder: (show: boolean) => void;
  showThinFrame: boolean;
  setShowThinFrame: (show: boolean) => void;
  exportQuality: number;
  addToFavoritesRef: React.MutableRefObject<(() => void) | null>;
  setIsFavorite: (fav: boolean) => void;
  saveManualFen: () => void;
  saveExportFen: (fen: string) => void;
  addCurrentToFavorites: () => void;
  handleNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const HomePageSidebar: React.FC<HomePageSidebarProps> = memo(({
  itemVariants,
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
  exportQuality,
  addToFavoritesRef,
  setIsFavorite,
  saveManualFen,
  saveExportFen,
  addCurrentToFavorites,
  handleNotification
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className="w-full min-w-0 xl:w-[clamp(400px,35vw,600px)] xl:flex-none xl:sticky xl:top-24"
    >
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
    </motion.div>
  );
});

HomePageSidebar.displayName = 'HomePageSidebar';
