import { memo } from 'react';

import { ArrowLeft, Save } from 'lucide-react';

import { Button } from '@shared/ui';

/** Props for the `ToolPageHeader` full-screen page header. */
export interface ToolPageHeaderProps {
  title: string;
  onBack: () => void;
  onSave?: () => void;
  showSave?: boolean;
  saveLabel?: string;
  rightSlot?: React.ReactNode;
}

/** Reusable back-and-save header bar used by full-screen tool pages. */
const ToolPageHeader = memo(function ToolPageHeader({
  title,
  onBack,
  onSave,
  showSave = true,
  saveLabel = 'Save',
  rightSlot = null
}: ToolPageHeaderProps) {
  return (
    <header className="shrink-0 bg-surface border-b border-border">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              className="px-3 sm:px-4 py-2 sm:py-2.5 text-text-secondary hover:text-text-primary shrink-0"
              aria-label="Go back"
            >
              <span className="text-xs sm:text-sm font-semibold">Back</span>
            </Button>
            <div className="h-6 sm:h-8 w-px bg-border shrink-0 hidden xs:block" />
            <h1 className="text-lg sm:text-2xl font-display font-bold text-text-primary truncate">
              {title}
            </h1>
          </div>

          {rightSlot ||
            (showSave && (
              <>
                <Button
                  onClick={onSave ?? onBack}
                  size="sm"
                  icon={Save}
                  className="px-3 sm:px-6 py-2 sm:py-2.5 bg-accent hover:bg-accent-hover text-bg shadow-sm shrink-0"
                  aria-label="Save and close"
                >
                  <span className="text-xs sm:text-sm">{saveLabel}</span>
                </Button>
              </>
            ))}
        </div>
      </div>
    </header>
  );
});

ToolPageHeader.displayName = 'ToolPageHeader';
export default ToolPageHeader;
