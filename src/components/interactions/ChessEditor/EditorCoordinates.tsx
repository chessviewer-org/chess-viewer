import { memo } from 'react';

/** Shared props for the coordinate label components. */
interface CoordinatesProps {
  flipped: boolean;
  cellSize: number;
  gutterSize: number;
}

export const FileCoordinates = memo(function FileCoordinates({
  flipped,
  cellSize,
  gutterSize
}: CoordinatesProps) {
  const files = flipped
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="flex mt-1" style={{ paddingLeft: `${gutterSize}px` }}>
      {files.map((file) => (
        <div
          key={file}
          className="text-[11px] font-semibold text-text-secondary text-center select-none"
          style={{ width: `${cellSize}px` }}
        >
          {file}
        </div>
      ))}
    </div>
  );
});

export const RankCoordinates = memo(function RankCoordinates({
  flipped,
  cellSize,
  gutterSize
}: CoordinatesProps) {
  const ranks = flipped
    ? ['1', '2', '3', '4', '5', '6', '7', '8']
    : ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div
      className="flex flex-col shrink-0"
      style={{ width: `${gutterSize}px` }}
    >
      {ranks.map((rank) => (
        <div
          key={rank}
          className="flex items-center justify-center text-[11px] font-bold text-text-secondary select-none"
          style={{ height: `${cellSize}px` }}
        >
          {rank}
        </div>
      ))}
    </div>
  );
});
