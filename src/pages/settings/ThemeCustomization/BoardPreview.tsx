import { memo } from 'react';

import { BOARD_SIZE_EXPR, CELL_SIZE_EXPR, RANK_GUTTER } from '@constants';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const BoardPreview = memo(function BoardPreview({ light, dark }) {
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return (
    <div className="flex items-center justify-center min-h-0 h-full w-full select-none">
      <div className="inline-flex flex-col p-2 sm:p-3">
        <div className="flex">
          <div
            className="flex flex-col flex-shrink-0"
            style={{
              width: RANK_GUTTER
            }}
          >
            {ranks.map((n) => (
              <div
                key={n}
                className="flex items-center justify-center text-[12px] font-semibold text-text-primary/90"
                style={{
                  height: CELL_SIZE_EXPR
                }}
              >
                {n}
              </div>
            ))}
          </div>
          <div
            className="grid grid-cols-8 overflow-hidden border border-border/70"
            style={{
              width: BOARD_SIZE_EXPR,
              height: BOARD_SIZE_EXPR,
              contain: 'strict'
            }}
          >
            {Array.from({
              length: 64
            }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isLight = (row + col) % 2 === 0;
              return (
                <div
                  key={`sq-${row}-${col}`}
                  className="transition-colors duration-200"
                  style={{
                    backgroundColor: isLight ? light : dark,
                    outline: '1px solid transparent'
                  }}
                />
              );
            })}
          </div>
        </div>
        <div
          className="flex"
          style={{
            paddingLeft: RANK_GUTTER
          }}
        >
          {files.map((l) => (
            <div
              key={l}
              className="text-[12px] font-semibold text-text-primary/90 text-center mt-1"
              style={{
                width: CELL_SIZE_EXPR
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
BoardPreview.displayName = 'BoardPreview';
export default BoardPreview;
