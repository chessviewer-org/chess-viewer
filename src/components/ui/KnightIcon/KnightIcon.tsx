import React from 'react';

/**
 * Custom SVG Knight Icon with a glass-filling hover effect.
 * The SVG uses a linear gradient where the offset is animated via CSS.
 */
export default function KnightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      // "group" class ensures hovering ANY part of the SVG triggers the CSS transition
      className="group w-16 h-16 cursor-pointer"
    >
      <defs>
        {/* y1="1" to y2="0" creates a Bottom-to-Top fill direction. 
            Change to y1="0" y2="1" for Top-to-Bottom. */}
        <linearGradient id="knightFill" x1="0" x2="0" y1="1" y2="0">
          <stop 
            className="liquid-fill-stop" 
            stopColor="#FFD700" 
          />
          <stop 
            className="liquid-fill-stop" 
            stopColor="transparent" 
          />
        </linearGradient>
      </defs>

      {/* 
        You can replace the 'd' attribute below with your own custom Knight SVG path.
      */}
      <path
        d="M12 2C8.686 2 6 4.686 6 8c0 1.942.923 3.666 2.36 4.761C8.134 13.565 8 14.515 8 15.5c0 1.488.46 2.868 1.24 4.025A5.98 5.98 0 0 0 10 22h4a5.98 5.98 0 0 0 .76-2.475C15.54 18.368 16 16.988 16 15.5c0-.985-.134-1.935-.36-2.739C17.077 11.666 18 9.942 18 8c0-3.314-2.686-6-6-6z"
        stroke="#FFD700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#knightFill)"
      />
    </svg>
  );
}
