import React from 'react';
import ModalShell from './ModalShell.js';

function DeleteConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
  titleId = 'delete-modal-title',
}) {
  return (
    <ModalShell onClose={onCancel} titleId={titleId} overlayClassName="!z-[10002]">
      <div className="bg-red-500 px-6 py-4">
        <h2 id={titleId} className="text-white font-black text-lg tracking-tight">
          {title}
        </h2>
      </div>
      <div className="p-6">
        <p className="text-slate-600 font-medium leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default DeleteConfirmModal;
