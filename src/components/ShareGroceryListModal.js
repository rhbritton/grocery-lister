import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareAlt } from '@fortawesome/free-solid-svg-icons';
import ModalShell from './ModalShell.js';
import { formatShareExpiryDate } from '../features/grocery-lists/utils/groceryListShare.ts';

function ShareGroceryListModal({ onClose, onShare, expiresAt, isSharing = false }) {
  return (
    <ModalShell titleId="share-grocery-list-title" onClose={onClose}>
      <div className="bg-brand px-6 py-5 text-white text-center">
        <FontAwesomeIcon icon={faShareAlt} className="text-2xl mb-2" aria-hidden="true" />
        <h2 id="share-grocery-list-title" className="text-title-sm font-bold tracking-tight">
          Share for shopping
        </h2>
      </div>

      <div className="px-6 py-5 space-y-4 text-left">
        <p className="text-body-sm text-slate-600 leading-relaxed">
          Anyone with the link can check items off for <strong>7 days</strong>. They cannot add, edit, or delete items.
        </p>
        <p className="text-body-sm text-slate-600 leading-relaxed">
          Sharing again resets the 7-day window.
        </p>
        {expiresAt ? (
          <p className="text-label font-bold uppercase tracking-widest text-brand bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            Current link expires {formatShareExpiryDate(expiresAt)}
          </p>
        ) : null}
      </div>

      <div className="px-6 pb-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 min-h-touch py-3 font-black uppercase text-label tracking-widest text-slate-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={isSharing}
          className="flex-[2] min-h-touch py-3 rounded-2xl bg-emerald-600 text-white font-black uppercase text-label tracking-widest shadow-lg shadow-emerald-200 active:scale-[0.98] disabled:opacity-60"
        >
          {isSharing ? 'Sharing…' : 'Share link'}
        </button>
      </div>
    </ModalShell>
  );
}

export default ShareGroceryListModal;
