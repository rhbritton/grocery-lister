import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faCloudArrowUp,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';

const BANNER_CONFIG = {
  offline: {
    message: "You're offline",
    detail: 'Changes saved locally will sync when you reconnect',
    icon: faTriangleExclamation,
    barClass: 'bg-amber-500',
    panelClass: 'bg-amber-50 text-amber-950 border-amber-200',
    iconClass: 'text-amber-600',
  },
  syncing: {
    message: 'Syncing changes',
    detail: 'Uploading your offline edits…',
    icon: faCloudArrowUp,
    barClass: 'bg-[#1976D2]',
    panelClass: 'bg-blue-50 text-blue-950 border-blue-200',
    iconClass: 'text-[#1976D2]',
  },
  online: {
    message: 'Back online',
    detail: 'Everything is up to date',
    icon: faCircleCheck,
    barClass: 'bg-emerald-500',
    panelClass: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    iconClass: 'text-emerald-600',
  },
};

function ConnectionStatusBanner({ status }) {
  const isVisible = status && status !== 'hidden';
  const config = BANNER_CONFIG[status];

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[10000] pointer-events-none transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      role="status"
      aria-live="polite"
      aria-hidden={!isVisible}
    >
      {config && (
        <div
          className={`border-b shadow-sm backdrop-blur-sm ${config.panelClass}`}
        >
          <div className={`h-0.5 ${config.barClass}`} />
          <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shrink-0 shadow-sm ${config.iconClass}`}
            >
              <FontAwesomeIcon
                icon={config.icon}
                className={`text-sm ${status === 'syncing' ? 'animate-pulse' : ''}`}
                spin={status === 'syncing'}
              />
            </div>
            <div className="min-w-0 text-left flex-1">
              <p className="text-sm font-bold leading-tight truncate">
                {config.message}
              </p>
              <p className="text-xs opacity-80 leading-snug truncate">
                {config.detail}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectionStatusBanner;
