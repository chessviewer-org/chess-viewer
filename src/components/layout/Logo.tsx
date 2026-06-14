import { memo } from 'react';

import blueLogo from '@/assets/logo/blue.png';
import goldLogo from '@/assets/logo/gold.png';
import greenLogo from '@/assets/logo/green.png';
import purpleLogo from '@/assets/logo/purple.png';
import redLogo from '@/assets/logo/red.png';
import tealLogo from '@/assets/logo/teal.png';
import { useAccentSetting } from '@hooks';

/** Maps an accent theme id to its matching coloured knight logo (transparent). */
const LOGO_BY_ACCENT: Record<string, string> = {
  gold: goldLogo,
  green: greenLogo,
  blue: blueLogo,
  red: redLogo,
  purple: purpleLogo,
  teal: tealLogo
};

/** Props for the `Logo` mark. */
interface LogoProps {
  className?: string;
}

/**
 * ChessVision knight logo. Picks the coloured variant matching the active
 * accent theme so it changes with the selected site colour. Backgrounds are
 * transparent and each variant is its own image (no `currentColor`).
 */
function LogoComponent({ className }: LogoProps) {
  const [accentId] = useAccentSetting();
  const src = LOGO_BY_ACCENT[accentId] ?? goldLogo;

  return <img src={src} alt="ChessVision" className={className} />;
}

export const Logo = memo(LogoComponent);
