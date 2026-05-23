import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';
import ModalShell from '../../../components/ModalShell.js';

function UnfavoriteModal({ setShowModal, onConfirm }) {
  const handleClose = () => setShowModal(false);

  return (
    <ModalShell onClose={handleClose} titleId="unfavorite-modal-title">
      <div className="bg-amber-500 p-6 text-white text-center">
        <div className="relative inline-block mb-2">
          <FontAwesomeIcon icon={faBookmark} className="text-2xl opacity-50" aria-hidden="true" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-8 h-0.5 bg-white" />
        </div>
        <h3 id="unfavorite-modal-title" className="text-lg font-bold uppercase tracking-widest">
          Unsave Recipe?
        </h3>
      </div>

      <div className="p-8 text-center">
        <p className="text-slate-600 font-medium leading-relaxed mb-8">
          Are you sure you want to remove this recipe from your favorites?
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 py-4 font-black uppercase text-[14px] tracking-[0.15em] text-slate-400 hover:text-slate-600 transition-colors"
            onClick={handleClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-100 uppercase text-[14px] tracking-[0.15em] hover:bg-red-600 active:scale-95 transition-all"
            onClick={() => {
              onConfirm();
              handleClose();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default UnfavoriteModal;
