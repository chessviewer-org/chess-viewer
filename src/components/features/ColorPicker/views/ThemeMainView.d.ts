import { FC, MemoExoticComponent } from 'react';

export interface ThemeMainViewProps {
  currentLight: string;
  currentDark: string;
  onThemeApply: (l: string, d: string) => void;
}

declare const ThemeMainView: MemoExoticComponent<FC<ThemeMainViewProps>>;
export default ThemeMainView;