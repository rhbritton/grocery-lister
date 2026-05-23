import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faClipboardList } from '@fortawesome/free-solid-svg-icons';

function BottomNav({ active }) {
  const recipesActive = active === 'recipes';
  const listsActive = active === 'grocery-lists';

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {recipesActive ? (
        <span className="bottom-nav-tab bg-brand text-white" aria-current="page">
          <FontAwesomeIcon icon={faBook} className="text-xl" aria-hidden="true" />
          <span className="bottom-nav-label">Recipes</span>
        </span>
      ) : (
        <NavLink to="/recipes" className="bottom-nav-tab text-slate-400 hover:bg-slate-50 hover:text-slate-600">
          <FontAwesomeIcon icon={faBook} className="text-xl" aria-hidden="true" />
          <span className="bottom-nav-label">Recipes</span>
        </NavLink>
      )}

      {listsActive ? (
        <span className="bottom-nav-tab bg-brand text-white" aria-current="page">
          <FontAwesomeIcon icon={faClipboardList} className="text-xl" aria-hidden="true" />
          <span className="bottom-nav-label">Grocery Lists</span>
        </span>
      ) : (
        <NavLink to="/grocery-lists" className="bottom-nav-tab text-slate-400 hover:bg-slate-50 hover:text-slate-600">
          <FontAwesomeIcon icon={faClipboardList} className="text-xl" aria-hidden="true" />
          <span className="bottom-nav-label">Grocery Lists</span>
        </NavLink>
      )}
    </nav>
  );
}

export default BottomNav;
