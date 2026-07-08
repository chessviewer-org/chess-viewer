import { memo } from 'react';

import defaultLogo from '@/assets/logo/Logo.png';

interface LogoProps {
  className?: string;
}

const LogoComponent = ({ className }: LogoProps) => {
  return <img src={defaultLogo} alt="ChessViewer" className={className} />;
};

export const Logo = memo(LogoComponent);

LogoComponent.displayName = 'Logo';
