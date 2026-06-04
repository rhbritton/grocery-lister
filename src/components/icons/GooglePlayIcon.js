import React from 'react';

/** Google Play triangle mark (same paths as website/images/icons/google-play.svg). */
function GooglePlayIcon({ className = 'w-7 h-7', title }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28.99 31.99"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        fill="#EA4335"
        d="M13.54 15.28.12 29.34a3.66 3.66 0 0 0 5.33 2.16l15.1-8.6Z"
      />
      <path
        fill="#FBBC04"
        d="m27.11 12.89-6.53-3.74-7.35 6.45 7.38 7.28 6.48-3.7a3.54 3.54 0 0 0 1.5-4.79 3.62 3.62 0 0 0-1.5-1.5z"
      />
      <path fill="#4285F4" d="M.12 2.66a3.57 3.57 0 0 0-.12.92v24.84a3.57 3.57 0 0 0 .12.92L14 15.64Z" />
      <path
        fill="#34A853"
        d="m13.64 16 6.94-6.85L5.5.51A3.73 3.73 0 0 0 3.63 0 3.64 3.64 0 0 0 .12 2.65Z"
      />
    </svg>
  );
}

export default GooglePlayIcon;
