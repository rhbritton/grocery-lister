import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';

import ModalShell from '../../../components/ModalShell.js';

function SignInToFavoriteModal({ onClose, onSignIn }) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage('');
    try {
      await onSignIn?.();
      onClose?.();
    } catch (error) {
      setErrorMessage(error?.message || 'Sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <ModalShell onClose={onClose} titleId="sign-in-to-favorite-title">
      <div className="bg-brand p-6 text-white text-center">
        <FontAwesomeIcon icon={faBookmark} className="text-2xl mb-2" aria-hidden="true" />
        <h3 id="sign-in-to-favorite-title" className="text-lg font-bold tracking-tight">
          Sign in to save favorites
        </h3>
      </div>

      <div className="p-6 text-center">
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Create a free account to favorite this recipe and find it later in your library.
        </p>

        {errorMessage ? (
          <p className="mb-4 text-sm text-red-600 leading-relaxed">{errorMessage}</p>
        ) : null}

        <button
          type="button"
          disabled={isSigningIn}
          onClick={handleSignIn}
          className="w-full min-h-touch rounded-2xl bg-brand hover:bg-brand-dark text-white font-bold text-sm transition-colors disabled:opacity-60"
        >
          {isSigningIn ? 'Signing in…' : 'Sign in with Google'}
        </button>

        <button
          type="button"
          disabled={isSigningIn}
          onClick={onClose}
          className="mt-3 w-full min-h-touch text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
        >
          Not now
        </button>
      </div>
    </ModalShell>
  );
}

export default SignInToFavoriteModal;
