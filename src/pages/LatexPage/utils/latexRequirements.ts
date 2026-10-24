import { type LatexPackage } from '@chessviewer-org/chess-viewer';
import type { StudioSettings } from './latexProject';

const CTAN_PACKAGE: Record<LatexPackage, string> = {
  skak: 'skak',
  chessboard: 'chessboard',
  diagram: 'chess-problem-diagrams'
};

const PACKAGE_DEPENDENCIES: Record<LatexPackage, string[]> = {
  skak: ['chessfss', 'lambda-lists', 'skaknew'],
  chessboard: ['chessfss', 'pgf', 'skaknew', 'xifthen'],
  diagram: ['bartel-chess-fonts', 'pgf', 'xstring']
};

const STANDALONE_DEPENDENCIES = ['varwidth'];

export interface LatexRequirements {
  packages: string[];
  install: string;
  compile: (fileName: string) => string;
}

export function latexRequirements(settings: StudioSettings): LatexRequirements {
  const packages = [CTAN_PACKAGE[settings.latexPackage]];
  if (settings.mode === 'document') packages.push('geometry');
  if (settings.mode === 'standalone') packages.push('standalone');

  const dependencies = [
    ...PACKAGE_DEPENDENCIES[settings.latexPackage],
    ...(settings.mode === 'standalone' ? STANDALONE_DEPENDENCIES : [])
  ];

  return {
    packages,
    install: `tlmgr install ${[...packages, ...dependencies].join(' ')}`,
    compile: (fileName) => `pdflatex ${fileName}.tex`
  };
}
