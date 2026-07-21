import React from 'react';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';

function SharedGuestPrompt() {
  return (
    <section className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-center">
      <FontAwesomeIcon icon={faBook} className="text-brand text-lg mb-2" aria-hidden="true" />
      <p className="text-sm font-bold text-slate-800">Like what you see?</p>
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
        Sign in to save recipes, build grocery lists, and share your own.
      </p>
      <Link
        to="/"
        className="inline-flex mt-3 min-h-touch items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors"
      >
        Get started free
      </Link>
    </section>
  );
}

export default SharedGuestPrompt;
