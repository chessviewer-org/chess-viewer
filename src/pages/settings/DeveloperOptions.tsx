import { memo } from 'react';

const DeveloperOptions = memo(function DeveloperOptions() {
  return (
    <div className="bg-surface-elevated border border-border rounded-2xl p-6">
      <p className="text-sm text-text-secondary">
        No developer options are currently available.
      </p>
    </div>
  );
});

DeveloperOptions.displayName = 'DeveloperOptions';
export default DeveloperOptions;
