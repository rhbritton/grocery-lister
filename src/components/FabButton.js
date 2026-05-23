import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function FabShell({ children }) {
  return (
    <span className="w-16 h-16 rounded-2xl bg-brand text-white shadow-lg shadow-blue-300/40 text-3xl flex items-center justify-center hover:bg-brand-dark active:scale-95 transition-all">
      {children}
    </span>
  );
}

function FabButton({ to, icon, label = 'Add' }) {
  return (
    <NavLink to={to} className="fab-position fixed z-50" aria-label={label}>
      <FabShell>
        <FontAwesomeIcon icon={icon} />
      </FabShell>
    </NavLink>
  );
}

export function ActionFab({ onClick, icon, label = 'Add', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fab-action-position fixed z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand ${className}`}
      aria-label={label}
    >
      <FabShell>
        <FontAwesomeIcon icon={icon} />
      </FabShell>
    </button>
  );
}

export default FabButton;
