import React, { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  dismissStorePromo,
  getStorePromoTarget,
  shouldShowStorePromoBanner,
} from '../utils/storePromo.js';

function StorePromoBanner() {
  const [visible, setVisible] = useState(() =>
    shouldShowStorePromoBanner(Capacitor.isNativePlatform())
  );

  const target = useMemo(() => getStorePromoTarget(), []);

  if (!visible || !target) {
    return null;
  }

  const handleDismiss = () => {
    dismissStorePromo();
    setVisible(false);
  };

  return (
    <div
      className="w-full bg-slate-100 px-3 py-2.5 sm:px-4 flex items-center justify-between gap-3 z-[10001] border-b border-slate-200 shadow-sm"
      role="region"
      aria-label="Download the GroceryLister app"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-10 rounded-lg overflow-hidden shrink-0" aria-hidden="true">
          <img
            className="w-full h-full object-contain block"
            src={`${process.env.PUBLIC_URL}/images/logo_color.png`}
            alt=""
            width={40}
            height={40}
          />
        </span>
        <div className="min-w-0 text-left">
          <p className="text-sm font-bold leading-tight text-slate-900 truncate">
            Get GroceryLister
          </p>
          <p className="text-xs text-slate-600 truncate">
            Shop faster in the app
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-3.5 py-2 rounded-full transition-colors uppercase tracking-wide whitespace-nowrap min-h-[2.75rem] inline-flex items-center"
        >
          {target.cta}
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-2 min-w-[2.75rem] min-h-[2.75rem] inline-flex items-center justify-center rounded-lg"
          aria-label="Dismiss app download banner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default StorePromoBanner;
