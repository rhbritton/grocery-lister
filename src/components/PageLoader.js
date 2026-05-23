import React from 'react';

function PageLoader({ message = 'Loading…', fullScreen = true }) {
  const wrapperClass = fullScreen
    ? 'flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]'
    : 'flex flex-col items-center justify-center py-20';

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand animate-spin" />
      </div>
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{message}</p>
    </div>
  );
}

export default PageLoader;
