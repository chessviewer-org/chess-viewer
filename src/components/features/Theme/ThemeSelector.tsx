import { Palette } from 'lucide-react';

import { Button } from '@shared/ui';

interface ThemeSelectorProps {
  onOpenModal: () => void;
}

/**
 * @param {ThemeSelectorProps} props
 * @returns {JSX.Element}
 */
function ThemeSelector({ onOpenModal }: ThemeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-text-secondary">
        Board Theme
      </label>
      <Button onClick={onOpenModal} variant="gradient" icon={Palette} fullWidth>
        Customize Theme
      </Button>
    </div>
  );
}
export default ThemeSelector;
