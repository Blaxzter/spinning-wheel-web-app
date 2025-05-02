"use client";

import { useTheme } from "next-themes";

export function ThemeLogo({
  className = "w-8 h-8 mr-2",
}: {
  className?: string;
}) {
  const { theme } = useTheme();

  // Use currentColor for stroke and fill which will respect text color in the current theme
  const strokeColor = "currentColor";
  const fillColor = "currentColor";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
    >
      {/* Group for animation */}
      <g id="wheel">
        <circle
          cx="32"
          cy="32"
          r="24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
        />
        <line
          x1="14.3"
          y1="14.3"
          x2="49.7"
          y2="49.7"
          stroke={strokeColor}
          strokeWidth="2"
        />
        <line
          x1="14.3"
          y1="49.7"
          x2="49.7"
          y2="14.3"
          stroke={strokeColor}
          strokeWidth="2"
        />
        <circle cx="32" cy="32" r="4" fill={fillColor} />
      </g>

      {/* Triangle pointer */}
      <path d="M 27 4 L 37 4 L 32 12 Z" fill={fillColor} />

      {/* Animation styles */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        #wheel {
          transform-origin: 32px 32px;
          animation: spin 8s linear infinite;
        }
      `}</style>
    </svg>
  );
}
