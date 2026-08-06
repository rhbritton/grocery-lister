import React, { useEffect, useRef } from 'react';

function ModalShell({
  onClose,
  titleId,
  children,
  panelClassName = 'bg-white rounded-3xl shadow-2xl overflow-hidden',
  overlayClassName = '',
  /** `sheet` = bottom sheet on phones, centered on sm+; `center` = always centered */
  placement = 'center',
  /** Cap width on large screens (default 24rem / max-w-sm). */
  maxWidth = '24rem',
}) {
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

  const isSheet = placement === 'sheet';

  return (
    <div
      className={`fixed inset-0 z-[10050] flex bg-slate-900/60 backdrop-blur-sm ${
        isSheet
          ? 'items-end justify-center sm:items-center p-0 sm:p-4'
          : 'items-center justify-center p-4'
      } ${overlayClassName}`}
      onClick={() => onCloseRef.current()}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`box-border min-w-0 w-full ${panelClassName}`}
        style={{ maxWidth }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default ModalShell;
