import React, { useEffect, useRef } from 'react';

function ModalShell({ onClose, titleId, children, panelClassName = 'w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200', overlayClassName = '' }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);
    const preferredFocus =
      dialogRef.current?.querySelector('[autofocus]') ||
      dialogRef.current?.querySelector(
        'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea'
      );
    const firstFocusable =
      preferredFocus ||
      dialogRef.current?.querySelector(
        'button, select, [href], [tabindex]:not([tabindex="-1"])'
      );
    firstFocusable?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10050] p-4 animate-in fade-in duration-200 ${overlayClassName}`}
      onClick={() => onCloseRef.current()}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClassName}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default ModalShell;
