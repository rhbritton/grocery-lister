import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 animate-in fade-in duration-500">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand flex items-center justify-center mb-5 shadow-sm border border-blue-100">
          <FontAwesomeIcon icon={icon} className="text-2xl" />
        </div>
      )}
      <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">{title}</h2>
      {description && (
        <p className="text-slate-500 font-medium max-w-xs mb-6 leading-relaxed">{description}</p>
      )}
      {actionLabel && actionTo && (
        <NavLink
          to={actionTo}
          className="inline-flex items-center justify-center px-6 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl shadow-lg shadow-blue-200/60 transition-all active:scale-[0.98]"
        >
          {actionLabel}
        </NavLink>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-6 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl shadow-lg shadow-blue-200/60 transition-all active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
