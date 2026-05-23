import React, { useEffect } from 'react';

function Toast({ message, visible, onDismiss }) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [visible, onDismiss, message]);

  if (!visible || !message) return null;

  return (
    <div
      className="toast-position fixed left-1/2 -translate-x-1/2 z-[10003] max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="bg-slate-900 text-white text-body-sm font-bold px-5 py-3 rounded-2xl shadow-xl">
        {message}
      </div>
    </div>
  );
}

export default Toast;
