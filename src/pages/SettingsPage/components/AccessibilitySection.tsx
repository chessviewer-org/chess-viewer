import { memo } from 'react';

import { Eye, Layers, Monitor, Sparkles, Zap } from '@/assets/icons';

import { useColorVisionSetting, useReducedMotionSetting } from '@/shared/hooks';

import type {
  ColorVisionPreference,
  ReducedMotionPreference
} from '@/shared/utils';
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

const REDUCED_MOTION_OPTIONS: Array<{
  value: ReducedMotionPreference;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'system',
    label: 'Follow system setting',
    icon: <Monitor className="h-4 w-4" />
  },
  {
    value: 'reduce',
    label: 'Reduce motion',
    icon: <Zap className="h-4 w-4" />
  },
  {
    value: 'full',
    label: 'Always full motion',
    icon: <Sparkles className="h-4 w-4" />
  }
];

const AccessibilitySection = memo(function AccessibilitySection() {
  const [colorVision, setColorVision] = useColorVisionSetting();
  const [reducedMotion, setReducedMotion] = useReducedMotionSetting();

  return (
    <div className="space-y-8 animate-pageEnter">
      <SettingsHeading
        icon={Eye}
        title="Accessibility"
        description="Adapt ChessViewer to your visual needs. These settings are saved on this device and synced when signed in."
      />

      <SettingsBlock
        title="Color vision"
        description="Simulate how the interface appears with common color vision deficiencies. Use this to verify that diagrams and UI remain readable for your condition."
      >
        <div className="space-y-3">
          <div className="max-w-xs">
            <CustomSelect
              value={colorVision}
              onChange={setColorVision}
              options={COLOR_VISION_OPTIONS}
              label="Color vision mode"
            />
          </div>
          {colorVision !== 'none' && (
            <p className="w-full rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-text-secondary">
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
        title="Reduced motion"
        description="Replace animations and transitions with instant changes. ChessViewer follows your operating-system preference by default — choose Reduce or Always full to override it just for this app."
      >
        <div className="space-y-3">
          <div className="max-w-xs">
            <CustomSelect
              value={reducedMotion}
              onChange={setReducedMotion}
              options={REDUCED_MOTION_OPTIONS}
              label="Motion"
            />
          </div>
          {reducedMotion === 'reduce' && (
            <p className="w-full rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-text-secondary">
              <span className="font-semibold text-accent">
                Reduced motion on.
              </span>{' '}
              Animations across the app are replaced with instant transitions,
              regardless of your system setting.
            </p>
          )}
          {reducedMotion === 'system' && (
            <p className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-xs leading-relaxed text-text-muted">
              To change the system preference: GNOME — Settings → Accessibility
              → Seeing → Reduce Animation; macOS — System Settings →
              Accessibility → Display → Reduce Motion; Windows — Settings →
              Accessibility → Visual effects → Animation effects.
            </p>
          )}
        </div>
      </SettingsBlock>
    </div>
  );
});

AccessibilitySection.displayName = 'AccessibilitySection';
export default AccessibilitySection;
