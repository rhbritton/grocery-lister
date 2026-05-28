import React from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faCloudArrowUp,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';

export const CONNECTION_BANNER_HEIGHT_PX = 28;

const BANNER_CONFIG = {
  offline: {
    message: "You're offline — edits saved on this device",
    icon: faTriangleExclamation,
    barClass: 'bg-amber-400',
    panelClass: 'bg-amber-50/95 text-amber-900 border-amber-200/70',
    iconClass: 'text-amber-600',
  },
  syncing: {
    message: 'Syncing changes…',
    icon: faCloudArrowUp,
    barClass: 'bg-brand',
    panelClass: 'bg-blue-50/95 text-blue-900 border-blue-200/70',
    iconClass: 'text-brand',
  },
  online: {
    message: 'Back online',
    icon: faCircleCheck,
    barClass: 'bg-emerald-400',
    panelClass: 'bg-emerald-50/95 text-emerald-900 border-emerald-200/70',
    iconClass: 'text-emerald-600',
  },
  connected: {
    message: 'Online',
    icon: faCircleCheck,
    barClass: 'bg-emerald-400/80',
    panelClass: 'bg-slate-50/95 text-slate-600 border-slate-200/60',
    iconClass: 'text-emerald-500',
  },
};

function ConnectionStatusBanner({ status }) {
  if (!status || status === 'hidden') {
    return null;
  }

  const config = BANNER_CONFIG[status];
  if (!config || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 z-[99999]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      role="status"
      aria-live="polite"
    >
      <div className={`border-b ${config.panelClass}`}>
        <div className={`h-px ${config.barClass}`} />
        <div
          className="max-w-xl mx-auto px-3 py-1 flex items-center gap-2"
          style={{ minHeight: CONNECTION_BANNER_HEIGHT_PX }}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white/70 flex items-center justify-center shrink-0 ${config.iconClass}`}
          >
            <FontAwesomeIcon
              icon={config.icon}
              className={`text-[10px] ${status === 'syncing' ? 'animate-pulse' : ''}`}
              spin={status === 'syncing'}
            />
          </div>
          <p className="min-w-0 flex-1 text-left text-[11px] font-semibold leading-none truncate">
            {config.message}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConnectionStatusBanner;
