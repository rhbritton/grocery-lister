import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobileScreen } from '@fortawesome/free-solid-svg-icons';

import ModalShell from './ModalShell.js';
import IosInstallGuideSvg from './IosInstallGuideSvg.js';

function isIosNonSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua) && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

function IosInstallModal({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  const needsSafari = isIosNonSafari();

  return (
    <ModalShell
      titleId="ios-install-modal-title"
      onClose={onClose}
      panelClassName="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
    >
      <div className="bg-brand px-6 py-5 text-white text-center">
        <FontAwesomeIcon icon={faMobileScreen} className="text-2xl mb-2" aria-hidden="true" />
        <h2 id="ios-install-modal-title" className="text-title-sm font-bold tracking-tight">
          Install GroceryLister
        </h2>
      </div>

      <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
        {needsSafari ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 leading-relaxed">
            Open this site in <strong>Safari</strong> first — iPhone only allows Home Screen installs from Safari.
          </div>
        ) : (
          <p className="text-sm text-slate-600 mb-4 text-center leading-relaxed">
            Two quick taps in Safari.
          </p>
        )}

        <IosInstallGuideSvg />

        <ol className="mt-5 space-y-3 text-sm text-slate-700 leading-relaxed list-decimal pl-5">
          <li>
            Tap the <strong>Share</strong> button in Safari.
          </li>
          <li>
            Scroll and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
          </li>
        </ol>
      </div>

      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-touch rounded-2xl bg-brand text-white font-bold text-sm"
        >
          Got it
        </button>
      </div>
    </ModalShell>
  );
}

export default IosInstallModal;
