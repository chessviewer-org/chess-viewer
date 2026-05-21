import { Settings } from 'lucide-react';

import { Button } from '@shared/ui';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
function ExportSettings({ onOpenModal }) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-text-secondary">
        Export Settings
      </label>
      <Button
        onClick={onOpenModal}
        variant="gradient"
        icon={Settings}
        fullWidth
      >
        Configure Export
      </Button>
    </div>
  );
}
export default ExportSettings;
