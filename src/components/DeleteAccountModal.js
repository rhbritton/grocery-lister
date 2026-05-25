import React from 'react';
import ModalShell from './ModalShell.js';

function DeleteAccountModal({
  onClose,
  onConfirm,
  isDeleting = false,
  errorMessage = '',
}) {
  return (
    <ModalShell
      onClose={isDeleting ? () => {} : onClose}
      titleId="delete-account-title"
      overlayClassName="!z-[10002]"
    >
      <div className="bg-red-500 px-6 py-4">
        <h2 id="delete-account-title" className="text-white font-black text-lg tracking-tight">
          Delete account?
        </h2>
      </div>
      <div className="p-6">
        <p className="text-slate-600 font-medium leading-relaxed mb-4">
          This permanently deletes your GroceryLister account, recipes, grocery lists, and favorites.
          Shared links you sent will stop working for your content.
        </p>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          This cannot be undone. If your session is older, Google may ask you to confirm before deletion finishes.
        </p>
        {errorMessage ? (
          <p className="text-red-600 text-sm font-semibold mb-4" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default DeleteAccountModal;
