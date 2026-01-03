import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark, faTrash } from '@fortawesome/free-solid-svg-icons';

function UnfavoriteModal({ setShowModal, onConfirm }) {
  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" 
      onClick={() => setShowModal(false)}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section: Red theme for destructive action */}
        <div className="bg-amber-500 p-6 text-white text-center">
          <div className="relative inline-block mb-2">
            <FontAwesomeIcon icon={faBookmark} className="text-2xl opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-8 h-0.5 bg-white" />
          </div>
          <h3 className="text-lg font-bold uppercase tracking-widest">Unsave Recipe?</h3>
        </div>

        <div className="p-8 text-center">
          <p className="text-slate-600 font-medium leading-relaxed mb-8">
            Are you sure you want to remove this recipe from your favorites?
          </p>

          <div className="flex gap-3">
            {/* Cancel Button */}
            <button 
              className="flex-1 py-4 font-black uppercase text-[14px] tracking-[0.15em] text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>

            {/* Confirm Button */}
            <button 
              className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-100 uppercase text-[14px] tracking-[0.15em] hover:bg-red-600 active:scale-95 transition-all"
              onClick={() => {
                onConfirm();
                setShowModal(false);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnfavoriteModal;