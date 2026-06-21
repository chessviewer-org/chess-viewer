import { memo } from 'react';

import defaultLogo from '@/assets/logo/default.png';

/** Props for the `Logo` mark. */
interface LogoProps {
  className?: string;
}

/**
 * ChessVision knight logo. A single default mark with a transparent background.
 */
function LogoComponent({ className }: LogoProps) {
  return <img src={defaultLogo} alt="ChessVision" className={className} />;
}

export const Logo = memo(LogoComponent);
