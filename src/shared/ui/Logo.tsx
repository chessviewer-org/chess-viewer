import { memo } from 'react';

import logoSrc from '@/assets/logo/Logo.svg?inline';

interface LogoProps {
  className?: string;
}

const LogoComponent = ({ className }: LogoProps) => {
  return <img src={logoSrc} alt="ChessViewer" className={className} />;
};

export const Logo = memo(LogoComponent);

LogoComponent.displayName = 'Logo';
