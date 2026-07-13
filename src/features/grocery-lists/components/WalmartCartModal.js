import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

import ModalShell from '../../../components/ModalShell.js';
import { buildWalmartProductPageUrl } from '../../recipes/utils/walmartProduct.js';

function WalmartCartModal({
  onClose,
  items,
  cartUrlCount,
  onConfirm,
  isSubmitting,
}) {
  return (
    <ModalShell
      titleId="walmart-cart-modal-title"
      onClose={onClose}
      panelClassName="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
    >
      <div className="bg-[#0071dc] px-6 py-5 text-white text-center">
        <FontAwesomeIcon icon={faCartShopping} className="text-2xl mb-2" aria-hidden="true" />
        <h2 id="walmart-cart-modal-title" className="text-title-sm font-bold tracking-tight">
          Add to Walmart cart
        </h2>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-slate-600 mb-4">
          We&apos;ll open Walmart with the linked items below. Sign in on Walmart if needed, then
          confirm to check them off your list.
        </p>

        {cartUrlCount > 1 ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
            This list opens in {cartUrlCount} Walmart tabs because of URL size limits.
          </p>
        ) : null}

        <ul className="max-h-64 overflow-y-auto space-y-2 mb-6">
          {items.map((item) => (
            <li
              key={item.globalIndex}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  <span className="text-brand mr-1">{item.amount}</span>
                  {item.name}
                </p>
                {item.recipeName ? (
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                    {item.recipeName}
                  </p>
                ) : null}
              </div>
              <a
                href={buildWalmartProductPageUrl(item.usItemId)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                onClick={(event) => event.stopPropagation()}
              >
                View
                <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-touch rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !items.length}
            className="flex-1 min-h-touch rounded-xl bg-[#0071dc] px-4 py-3 text-sm font-bold text-white hover:bg-[#004f9a] disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faCartShopping} />
            Open Walmart &amp; check off
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default WalmartCartModal;
