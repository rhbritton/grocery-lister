import React from 'react';

/**
 * Two-step Safari install guide: Share → Add to Home Screen.
 */
function IosInstallGuideSvg() {
  return (
    <svg
      viewBox="0 0 420 280"
      className="w-full max-w-[360px] mx-auto"
      role="img"
      aria-label="Two steps: tap Share, then Add to Home Screen"
    >
      <defs>
        <filter id="gl-soft-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* ——— Step 1 ——— */}
      <g transform="translate(10, 8)">
        <text
          x="95"
          y="16"
          textAnchor="middle"
          fill="#64748B"
          fontSize="11"
          fontWeight="600"
          letterSpacing="0.04em"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          1 · TAP SHARE
        </text>

        <g filter="url(#gl-soft-shadow)">
          {/* Phone */}
          <rect x="30" y="28" width="130" height="232" rx="26" fill="#1E293B" />
          <rect x="36" y="40" width="118" height="196" rx="6" fill="#FFFFFF" />
          <rect x="72" y="33" width="46" height="8" rx="4" fill="#0F172A" />

          {/* Header */}
          <rect x="36" y="40" width="118" height="32" fill="#1976D2" />
          <text
            x="95"
            y="61"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="600"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            GroceryLister
          </text>

          {/* Soft content placeholders */}
          <rect x="48" y="88" width="70" height="6" rx="3" fill="#E2E8F0" />
          <rect x="48" y="102" width="94" height="6" rx="3" fill="#F1F5F9" />
          <rect x="48" y="116" width="58" height="6" rx="3" fill="#F1F5F9" />

          {/* Toolbar */}
          <rect x="36" y="208" width="118" height="28" fill="#F8FAFC" />
          <line x1="36" y1="208" x2="154" y2="208" stroke="#E2E8F0" strokeWidth="1" />

          {/* Share control — iOS-style square+arrow */}
          <g transform="translate(95, 222)">
            <circle cx="0" cy="0" r="14" fill="#EFF6FF" />
            <path
              d="M0 -6 V4 M0 -6 L-3.5 -2.5 M0 -6 L3.5 -2.5"
              fill="none"
              stroke="#1976D2"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M-5 1.5 V6.5 C-5 7.5 -4 8.5 -3 8.5 H3 C4 8.5 5 7.5 5 6.5 V1.5"
              fill="none"
              stroke="#1976D2"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </g>

      {/* Connector */}
      <g transform="translate(198, 140)" opacity="0.55">
        <circle cx="0" cy="0" r="10" fill="#F1F5F9" />
        <path
          d="M-3 0 H3 M1 -2.5 L3.5 0 L1 2.5"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ——— Step 2 ——— */}
      <g transform="translate(220, 8)">
        <text
          x="95"
          y="16"
          textAnchor="middle"
          fill="#64748B"
          fontSize="11"
          fontWeight="600"
          letterSpacing="0.04em"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          2 · ADD TO HOME SCREEN
        </text>

        <g filter="url(#gl-soft-shadow)">
          <rect x="30" y="28" width="130" height="232" rx="26" fill="#1E293B" />
          <rect x="36" y="40" width="118" height="196" rx="6" fill="#FFFFFF" />
          <rect x="72" y="33" width="46" height="8" rx="4" fill="#0F172A" />

          {/* Dim overlay */}
          <rect x="36" y="40" width="118" height="196" rx="6" fill="#0F172A" opacity="0.28" />

          {/* Share sheet */}
          <rect x="44" y="92" width="102" height="128" rx="16" fill="#FFFFFF" />

          {/* Grabber */}
          <rect x="82" y="100" width="26" height="3" rx="1.5" fill="#E2E8F0" />

          {/* Quiet rows */}
          <text
            x="56"
            y="128"
            fill="#CBD5E1"
            fontSize="10"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            Copy
          </text>
          <line x1="52" y1="138" x2="138" y2="138" stroke="#F1F5F9" strokeWidth="1" />

          {/* Focused row */}
          <rect x="50" y="146" width="90" height="32" rx="10" fill="#EFF6FF" />
          <circle cx="66" cy="162" r="9" fill="#1976D2" />
          <path
            d="M66 157.5 V166.5 M61.5 162 H70.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <text
            x="80"
            y="160"
            fill="#0F172A"
            fontSize="8.5"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            Add to Home
          </text>
          <text
            x="80"
            y="170"
            fill="#64748B"
            fontSize="8"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            Screen
          </text>

          <line x1="52" y1="188" x2="138" y2="188" stroke="#F1F5F9" strokeWidth="1" />
          <text
            x="56"
            y="206"
            fill="#CBD5E1"
            fontSize="10"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            Bookmark
          </text>
        </g>
      </g>
    </svg>
  );
}

export default IosInstallGuideSvg;
