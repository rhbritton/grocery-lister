import React, { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import GooglePlayIcon from './icons/GooglePlayIcon';
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

  const isAndroid = target.platform === 'android';

  const handleDismiss = () => {
    dismissStorePromo();
    setVisible(false);
  };

  return (
    <div
      className={`w-full max-w-[100vw] px-2 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 sm:gap-3 z-[10001] border-b shadow-sm overflow-hidden ${
        isAndroid
          ? 'bg-emerald-50 border-emerald-100/80'
          : 'bg-slate-100 border-slate-200'
      }`}
      role="region"
      aria-label="Download the GroceryLister app"
    >
      <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
        {isAndroid ? (
          <span
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border border-emerald-100 shadow-sm flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <GooglePlayIcon className="w-6 h-[1.4rem] sm:w-[1.65rem] sm:h-[1.85rem]" />
          </span>
        ) : (
          <span
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden shrink-0"
            aria-hidden="true"
          >
            <img
              className="w-full h-full object-contain block"
              src={`${process.env.PUBLIC_URL}/images/logo_color.png`}
              alt=""
              width={40}
              height={40}
            />
          </span>
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs sm:text-sm font-bold leading-snug text-slate-900 truncate">
            {isAndroid ? 'GroceryLister' : 'Get GroceryLister'}
          </p>
          <p className="text-[11px] sm:text-xs leading-snug text-slate-600 truncate">
            {isAndroid ? 'Free on Google Play' : `Install from ${target.storeName}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <a
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full transition-colors sm:uppercase sm:tracking-wide whitespace-nowrap min-h-[2.5rem] sm:min-h-[2.75rem] inline-flex items-center ${
            isAndroid
              ? 'bg-[#01875f] hover:bg-[#016b4d]'
              : 'bg-brand hover:bg-brand-dark'
          }`}
        >
          {target.cta}
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1.5 sm:p-2 min-w-[2.5rem] min-h-[2.5rem] sm:min-w-[2.75rem] sm:min-h-[2.75rem] inline-flex items-center justify-center rounded-lg shrink-0"
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
