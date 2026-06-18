import { memo } from 'react';

import { Eye, Layers, Zap } from 'lucide-react';

import { useColorVisionSetting, useContrastSetting } from '@hooks';

import type { ColorVisionPreference, ContrastPreference } from '@utils';
import { CustomSelect } from '@shared/ui';
import { SettingsBlock, SettingsHeading } from './parts';

const COLOR_VISION_OPTIONS: Array<{
  value: ColorVisionPreference;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'none',
    label: 'None — standard colours',
    icon: <Eye className="h-4 w-4" />
  },
  {
    value: 'deuteranopia',
    label: 'Deuteranopia (green-blind)',
    icon: <Layers className="h-4 w-4" />
  },
  {
    value: 'protanopia',
    label: 'Protanopia (red-blind)',
    icon: <Layers className="h-4 w-4" />
  },
  {
    value: 'tritanopia',
    label: 'Tritanopia (blue-blind)',
    icon: <Layers className="h-4 w-4" />
  }
];

const CONTRAST_OPTIONS: Array<{
  value: ContrastPreference;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'normal',
    label: 'Default',
    icon: <Zap className="h-4 w-4" />
  },
  {
    value: 'high',
    label: 'High contrast',
    icon: <Zap className="h-4 w-4" />
  }
];

const AccessibilitySection = memo(function AccessibilitySection() {
  const [colorVision, setColorVision] = useColorVisionSetting();
  const [contrast, setContrast] = useContrastSetting();

  return (
    <div className="space-y-8 animate-pageEnter">
      <SettingsHeading
        icon={Eye}
        title="Accessibility"
        description="Adapt ChessVision to your visual needs. These settings are saved on this device and synced end-to-end encrypted when you are signed in."
      />

      <SettingsBlock
        title="Color vision"
        description="Simulate how the interface appears with common color vision deficiencies. Use this to verify that diagrams and UI remain readable for your condition."
      >
        <div className="max-w-sm space-y-3">
          <div className="max-w-xs">
            <CustomSelect
              value={colorVision}
              onChange={setColorVision}
              options={COLOR_VISION_OPTIONS}
              label="Color vision mode"
            />
          </div>
          {colorVision !== 'none' && (
            <p className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5 text-xs leading-relaxed text-text-secondary">
              <span className="font-semibold text-accent">
                Simulation active.
              </span>{' '}
              The entire interface is rendered through a{' '}
              {colorVision === 'deuteranopia' && 'green-blind (Deuteranopia)'}
              {colorVision === 'protanopia' && 'red-blind (Protanopia)'}
              {colorVision === 'tritanopia' && 'blue-blind (Tritanopia)'}{' '}
              filter. This is a preview tool — it does not alter how others see
              your exported diagrams.
            </p>
          )}
        </div>
      </SettingsBlock>

      <SettingsBlock
        title="Contrast"
        description="Strengthen borders and text for improved readability. This mirrors the setting in Appearance and applies on top of your chosen theme."
      >
        <div className="max-w-xs">
          <CustomSelect
            value={contrast}
            onChange={setContrast}
            options={CONTRAST_OPTIONS}
            label="Contrast level"
          />
        </div>
      </SettingsBlock>

      <SettingsBlock
        title="Reduced motion"
        description="ChessVision automatically respects your operating-system preference. When reduced motion is on, all animations are replaced with instant transitions."
      >
        <div className="space-y-2.5">
          <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2">
              Linux
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              Run in terminal:
            </p>
            <code className="mt-1.5 block rounded-lg bg-bg px-3 py-2 font-mono text-xs text-accent border border-border/60 select-all">
              gsettings set org.gnome.desktop.interface enable-animations false
            </code>
            <p className="mt-2 text-xs text-text-muted">
              Or: Settings → Accessibility → Seeing → Reduce Animation (GNOME)
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2">
              macOS
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              System Settings → Accessibility → Display → Reduce Motion.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2">
              Windows
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              Settings → Ease of Access → Display → turn off "Show animations in
              Windows".
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2">
              Android / iOS
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              Accessibility → Remove Animations (Android) or Reduce Motion
              (iOS).
            </p>
          </div>
        </div>
      </SettingsBlock>
    </div>
  );
});

AccessibilitySection.displayName = 'AccessibilitySection';
export default AccessibilitySection;
