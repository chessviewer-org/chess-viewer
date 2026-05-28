import { memo, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';

import { BOARD_THEMES } from '@constants';
import { ThemeConfig } from '@app-types';
import { useOutsideClick } from '@hooks';
import ThemePresetButton from '@/components/features/ColorPicker/views/parts/ThemePresetButton';

/** Props for the in-board Quick Theme popover. */
export interface QuickThemePopoverProps {
  open: boolean;
  currentLight: string;
  currentDark: string;
  onApply: (light: string, dark: string) => void;
  onClose: () => void;
  /** Anchor wrapper containing both the trigger and this popover; the
   *  outside-click handler treats clicks inside as in-range. */
  anchorRef: React.RefObject<HTMLElement | null>;
}

function getLightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r + g + b) / 3;
}

const QuickThemePopover = memo(function QuickThemePopover({
  open,
  currentLight,
  currentDark,
  onApply,
  onClose,
  anchorRef
}: QuickThemePopoverProps) {
  const headingId = useRef(
    `quick-theme-heading-${Math.random().toString(36).slice(2, 9)}`
  );

  // Match the existing ThemeMainView sort so users see the same ordering they
  // see in the Custom theme studio — avoids cognitive whiplash between entry
  // points.
  const sortedThemes = useMemo(
    () =>
      Object.entries(BOARD_THEMES)
        .slice(0, 19)
        .sort(([, a], [, b]) => getLightness(b.light) - getLightness(a.light)),
    []
  );

  const handleApply = useCallback(
    (_key: string, theme: ThemeConfig) => {
      onApply(theme.light, theme.dark);
    },
    [onApply]
  );

  useOutsideClick(anchorRef, onClose, open);

  if (!open) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId.current}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className="absolute left-0 top-full mt-2 z-40 w-screen max-w-sm bg-surface-elevated border border-border rounded-xl shadow-lg p-3"
    >
      <h3
        id={headingId.current}
        className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider px-1 pb-2"
      >
        <Palette className="w-3.5 h-3.5 text-accent" />
        Quick Theme
      </h3>
      <div
        className="grid grid-cols-4 gap-2"
        role="group"
        aria-label="Theme preset options"
      >
        {sortedThemes.map(([key, theme]) => {
          const isActive =
            theme.light === currentLight && theme.dark === currentDark;
          return (
            <ThemePresetButton
              key={key}
              themeKey={key}
              theme={theme}
              isActive={isActive}
              onClick={handleApply}
            />
          );
        })}
      </div>
    </motion.div>
  );
});

QuickThemePopover.displayName = 'QuickThemePopover';
export default QuickThemePopover;
