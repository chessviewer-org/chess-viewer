import { memo } from 'react';

import { Eye, Layers, Monitor, Sparkles, Zap } from '@/assets/icons';

import { useColorVisionSetting, useReducedMotionSetting } from '@hooks';

import type {
  ColorVisionPreference,
  ReducedMotionPreference
} from '@utils';
import { CustomSelect } from '@ui';
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
    <div className="space-y-8 stagger-children">
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
            <div className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-xs leading-relaxed text-text-muted">
              <p className="mb-2">
                This follows your operating system&apos;s motion setting. To
                change it, open:
              </p>
              <ul className="space-y-1">
                <li>
                  <span className="font-semibold text-text-secondary">
                    GNOME:
                  </span>{' '}
                  Settings → Accessibility → Seeing → Reduce Animation
                </li>
                <li>
                  <span className="font-semibold text-text-secondary">
                    macOS:
                  </span>{' '}
                  System Settings → Accessibility → Display → Reduce Motion
                </li>
                <li>
                  <span className="font-semibold text-text-secondary">
                    Windows:
                  </span>{' '}
                  Settings → Accessibility → Visual effects → Animation effects
                </li>
              </ul>
            </div>
          )}
        </div>
      </SettingsBlock>
    </div>
  );
});

AccessibilitySection.displayName = 'AccessibilitySection';
export default AccessibilitySection;
