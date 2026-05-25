import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';

import DeleteAccountModal from '../../../components/DeleteAccountModal.js';
import BottomNav from '../../../components/BottomNav.js';
import { getDeleteAccountErrorMessage } from '../../../services/accountDeletion.js';

function AccountSettings({
  user,
  isDeletingAccount = false,
  handleDeleteAccount,
  finishAccountDeletionRedirect,
}) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');

    try {
      await handleDeleteAccount();
      setShowDeleteModal(false);
      navigate('/', { replace: true });
      finishAccountDeletionRedirect?.();
    } catch (error) {
      setDeleteError(getDeleteAccountErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const deleting = isDeleting || isDeletingAccount;
  const displayName = user?.displayName || 'GroceryLister user';
  const email = user?.email || '';

  return (
    <>
      <main className="page-main pb-nav-clear">
        <div className="max-w-xl mx-auto space-y-6">
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
              <h2 className="text-label font-black uppercase tracking-widest text-slate-500">
                Signed in as
              </h2>
            </div>
            <div className="px-6 py-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faUserCircle} className="text-2xl" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900 truncate">
                  {displayName}
                </p>
                {email ? (
                  <p className="text-base text-slate-500 truncate">{email}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-red-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-red-100 bg-red-50/40">
              <h2 className="text-label font-black uppercase tracking-widest text-red-700">
                Danger zone
              </h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Permanently delete your account, recipes, grocery lists, and favorites. Shared links you sent will stop working. This cannot be undone.
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-red-600 hover:text-red-700 underline underline-offset-2 disabled:opacity-50"
                disabled={deleting}
                onClick={() => {
                  setDeleteError('');
                  setShowDeleteModal(true);
                }}
              >
                Delete account…
              </button>
            </div>
          </section>
        </div>
      </main>

      <BottomNav />

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => {
            if (!deleting) {
              setShowDeleteModal(false);
              setDeleteError('');
            }
          }}
          onConfirm={handleConfirmDelete}
          isDeleting={deleting}
          errorMessage={deleteError}
        />
      )}
    </>
  );
}

export default AccountSettings;
