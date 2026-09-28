import React from 'react';

/**
 * LostBoxIcon: Matches the screenshot graphic of the cardboard box
 * with items sticking out (blue folder, yellow document, red umbrella)
 * and question mark on the box.
 */
export const LostBoxIcon: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Red Umbrella Handle poking out */}
      <path
        d="M68 18 C68 12, 75 12, 75 18 L75 40"
        stroke="#E53935"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M75 18 C75 22, 72 24, 70 24"
        stroke="#E53935"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Blue Folder / Document */}
      <rect
        x="36"
        y="18"
        width="22"
        height="28"
        rx="2"
        transform="rotate(-8 47 32)"
        fill="#3B82F6"
        stroke="#2563EB"
        strokeWidth="1.5"
      />
      <line x1="40" y1="26" x2="52" y2="24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="41" y1="31" x2="51" y2="29" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

      {/* Yellow / Orange Document */}
      <rect
        x="48"
        y="16"
        width="18"
        height="26"
        rx="2"
        transform="rotate(10 57 29)"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="1.5"
      />
      <line x1="53" y1="24" x2="61" y2="25.5" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="52" y1="28" x2="60" y2="29.5" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" />

      {/* Box Back & Flaps */}
      <polygon
        points="22,44 14,36 30,36 36,44"
        fill="#D49A62"
        stroke="#A76B34"
        strokeWidth="1.2"
      />
      <polygon
        points="78,44 70,36 86,36 78,44"
        fill="#C98B52"
        stroke="#A76B34"
        strokeWidth="1.2"
      />

      {/* Main Box Body */}
      <path
        d="M22 44 L78 44 L72 82 L28 82 Z"
        fill="#E8B582"
        stroke="#A76B34"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Box shading / 3D depth */}
      <path
        d="M28 82 L72 82 L78 44 L72 44 L66 82 Z"
        fill="#C98B52"
        opacity="0.35"
      />

      {/* Front Label Tape */}
      <rect
        x="36"
        y="54"
        width="28"
        height="18"
        rx="1.5"
        fill="#FAF3EB"
        stroke="#C09D7D"
        strokeWidth="1"
      />

      {/* Question mark or text on tape */}
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fontFamily="sans-serif"
        fill="#78350F"
      >
        ?
      </text>

      {/* Little parcel tape line */}
      <line x1="50" y1="44" x2="50" y2="54" stroke="#B87D43" strokeWidth="2" />
      <line x1="50" y1="72" x2="50" y2="82" stroke="#B87D43" strokeWidth="2" />
    </svg>
  );
};

/**
 * FoundMagnifierIcon: Matches the screenshot graphic of the magnifying glass
 * with blue circular lens and green checkmark circle badge.
 */
export const FoundMagnifierIcon: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Lens gradient */}
        <radialGradient id="lensGrad" cx="42" cy="42" r="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CDE4FD" />
          <stop offset="65%" stopColor="#81B4F8" />
          <stop offset="100%" stopColor="#4682E6" />
        </radialGradient>
        {/* Checkmark gradient */}
        <linearGradient id="checkGrad" x1="42" y1="30" x2="42" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5CD463" />
          <stop offset="100%" stopColor="#2EAA35" />
        </linearGradient>
      </defs>

      {/* Magnifier Handle */}
      <rect
        x="63"
        y="63"
        width="14"
        height="32"
        rx="6"
        transform="rotate(-45 63 63)"
        fill="#475569"
        stroke="#1E293B"
        strokeWidth="2.5"
      />
      {/* Handle grip highlight */}
      <rect
        x="67"
        y="68"
        width="6"
        height="22"
        rx="3"
        transform="rotate(-45 67 68)"
        fill="#64748B"
        opacity="0.8"
      />

      {/* Lens Outer Metallic Rim */}
      <circle
        cx="44"
        cy="44"
        r="28"
        fill="#DDE5ED"
        stroke="#64748B"
        strokeWidth="3.5"
      />

      {/* Inner Rim Bevel */}
      <circle
        cx="44"
        cy="44"
        r="25.5"
        stroke="#94A3B8"
        strokeWidth="1.5"
      />

      {/* Glass Lens with Blue Gradient */}
      <circle
        cx="44"
        cy="44"
        r="24"
        fill="url(#lensGrad)"
      />

      {/* Glass Glare Reflection Highlight */}
      <path
        d="M26 36 C29 28, 40 23, 50 25 C43 27, 34 32, 30 40 Z"
        fill="white"
        opacity="0.65"
      />

      {/* Green Checkmark Circle Badge in the center */}
      <circle
        cx="44"
        cy="44"
        r="14.5"
        fill="url(#checkGrad)"
        stroke="#FFFFFF"
        strokeWidth="2"
      />

      {/* White Checkmark */}
      <path
        d="M38 44.5 L42 48.5 L50 39.5"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
