import { forwardRef, SVGProps, createElement } from 'react';

export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement>>;

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  absoluteStrokeWidth?: boolean;
}

const defaultAttributes = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export type IconNode = [string, Record<string, string>];

export const createLucideIcon = (
  iconName: string,
  iconNode: IconNode[]
): LucideIcon => {
  const Component = forwardRef<SVGSVGElement, IconProps>(
    (
      {
        color = 'currentColor',
        size = 24,
        strokeWidth = 2,
        absoluteStrokeWidth,
        className = '',
        children,
        ...rest
      },
      ref
    ) => {
      return createElement(
        'svg',
        {
          ref,
          ...defaultAttributes,
          width: size,
          height: size,
          stroke: color,
          strokeWidth: absoluteStrokeWidth
            ? (Number(strokeWidth) * 24) / Number(size)
            : strokeWidth,
          className: `lucide lucide-${iconName} ${className}`.trim(),
          ...rest
        },
        [
          ...iconNode.map(([tag, attrs]) => createElement(tag, attrs)),
          ...(Array.isArray(children) ? children : [children])
        ]
      );
    }
  );
  Component.displayName = iconName;
  return Component as LucideIcon;
};
