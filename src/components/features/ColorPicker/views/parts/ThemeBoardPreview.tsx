import { memo } from 'react';

/** Props for the `ThemeBoardPreview` board grid preview. */
interface ThemeBoardPreviewProps {
  currentLight: string;
  currentDark: string;
}

const ThemeBoardPreview = memo(function ThemeBoardPreview({
  currentLight,
  currentDark
}: ThemeBoardPreviewProps) {
  return (
    <div className="flex items-center justify-center min-h-0">
      <div className="relative inline-flex flex-col items-center">
        <div className="flex items-center">
          <div
            className="flex flex-col justify-between pr-2"
            style={{ height: 'min(65vh, 60vw)' }}
          >
            {[8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
              <div
                key={num}
                className="text-sm font-semibold text-text-muted flex items-center justify-center select-none"
                style={{ height: 'calc(min(65vh, 60vw) / 8)' }}
              >
                {num}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-8 border-2 border-border shadow-2xl"
            style={{
              width: 'min(65vh, 60vw)',
              height: 'min(65vh, 60vw)',
              contain: 'strict'
            }}
          >
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isLight = (row + col) % 2 === 0;
              return (
                <div
                  key={`sq-${row}-${col}`}
                  style={{
                    backgroundColor: isLight ? currentLight : currentDark,
                    outline: '1px solid transparent'
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex mt-2 justify-between" style={{ width: 'min(65vh, 60vw)' }}>
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((letter) => (
            <div
              key={letter}
              className="text-sm font-semibold text-text-muted text-center select-none"
              style={{ width: 'calc(min(65vh, 60vw) / 8)' }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

ThemeBoardPreview.displayName = 'ThemeBoardPreview';
export default ThemeBoardPreview;
