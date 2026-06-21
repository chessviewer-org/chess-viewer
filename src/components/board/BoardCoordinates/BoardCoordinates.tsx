import { memo } from 'react';

/** Shared props for the coordinate label components. */
interface CoordinatesProps {
  flipped: boolean;
}

export const FileCoordinates = memo(function FileCoordinates({
  flipped
}: CoordinatesProps) {
  const files = flipped
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div
      className="flex mt-1 shrink-0 w-full"
      style={{ paddingLeft: 'var(--gutter-size)' }}
    >
      <div className="grid grid-cols-8 w-full">
        {files.map((file) => (
          <div
            key={file}
            className="flex items-center justify-center text-sm sm:text-base font-bold text-text-secondary select-none lowercase"
          >
            {file}
          </div>
        ))}
      </div>
    </div>
  );
});

export const RankCoordinates = memo(function RankCoordinates({
  flipped
}: CoordinatesProps) {
  const ranks = flipped
    ? ['1', '2', '3', '4', '5', '6', '7', '8']
    : ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div
      className="flex flex-col shrink-0 h-full"
      style={{ width: 'var(--gutter-size)' }}
    >
      {ranks.map((rank) => (
        <div
          key={rank}
          className="flex-1 flex items-center justify-center text-sm sm:text-base font-bold text-text-secondary select-none"
        >
          {rank}
        </div>
      ))}
    </div>
  );
});
