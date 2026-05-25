import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faUserCircle,
  faSignOutAlt,
  faClipboardList,
  faBook,
  faGear,
} from '@fortawesome/free-solid-svg-icons';
import { formatRelativeUpdateTime, getRemoteUpdateFadeOpacity } from '../services/date.js';

function Header(props) {
  const { user } = props;
  const location = useLocation();
  const navigate = useNavigate();

  const recipesListPath = {
    heading: 'Recipes',
    backButton: false,
    icon: faBook
  };
  const groceryListsPath = {
    heading: 'Grocery Lists',
    backButton: false,
    icon: faClipboardList
  };
  const recipesAddPath = {
    heading: 'New Recipe',
    backButton: '/recipes'
  };
  const recipesEditPath = {
    heading: 'Edit Recipe',
    backButton: '/recipes'
  };
  const recipesViewPath = {
    heading: 'Recipe',
    backButton: '/recipes'
  };
  const groceryListsAddPath = {
    heading: 'New List',
    backButton: '/grocery-lists'
  };
  const groceryListsEditPath = {
    heading: 'Edit List',
    backButton: '/grocery-lists'
  };
  const groceryListsViewPath = {
    heading: 'Grocery List',
    backButton: '/grocery-lists'
  };
  const accountPath = {
    heading: 'Account',
    backButton: '/recipes'
  };

  const getDefaultPathInfo = () => ({
    heading: '',
    backButton: true
  });

  const getPathInfo = () => {
    const pathInfos = {
        '/': recipesListPath,
        '/recipes': recipesListPath,
        '/grocery-lists': groceryListsPath,
        '/recipes/add': recipesAddPath,
        '/recipes/edit': recipesEditPath,
        '/recipes/view': recipesViewPath,
        '/grocery-lists/add': groceryListsAddPath,
        '/grocery-lists/edit': groceryListsEditPath,
        '/grocery-lists/view': groceryListsViewPath,
        '/account': accountPath,
    };

    const pathInfosIncludes = [
        '/recipes/add', 
        '/recipes/edit', 
        '/recipes/view', 
        '/grocery-lists/add', 
        '/grocery-lists/edit', 
        '/grocery-lists/view'
    ];

    let pathNameContains;
    pathInfosIncludes.some((pathInfo) => {
        if (location.pathname.includes(pathInfo)) {
            pathNameContains = pathInfo;
            return true;
        }
        return false;
    });

    return pathInfos[location.pathname] || pathInfos[pathNameContains] || getDefaultPathInfo();
  };

  const isGuestListView = !user && location.pathname.includes('/grocery-lists/view');
  const isGuestRecipeView = !user && location.pathname.includes('/recipes/view');
  const showAppHeader = !!user || isGuestListView || isGuestRecipeView;

  const pathInfo = isGuestListView
    ? { heading: 'Grocery List', backButton: false, icon: faClipboardList }
    : isGuestRecipeView
      ? { heading: 'Recipe', backButton: false, icon: faBook }
      : getPathInfo();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [, setRelativeUpdateTick] = useState(0);

  useEffect(() => {
    if (!props.lastRemoteUpdateAt) return;

    const interval = setInterval(() => {
      setRelativeUpdateTick((t) => t + 1);
      if (getRemoteUpdateFadeOpacity(props.lastRemoteUpdateAt) <= 0) {
        props.setLastRemoteUpdateAt?.(null);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [props.lastRemoteUpdateAt, props.setLastRemoteUpdateAt]);

  const progressPercent = props.totalItems <= 0 ? 0 : (props.totalItems ? ((props.checkedCount / props.totalItems) * 100) : 100);
  const isFinished = props.totalItems <= 0 ? false : (props.totalItems ? (props.totalItems > 0 && props.checkedCount === props.totalItems) : true);
  const remoteUpdateOpacity = props.lastRemoteUpdateAt
    ? getRemoteUpdateFadeOpacity(props.lastRemoteUpdateAt)
    : 0;

  if (!showAppHeader) {
    return null;
  }

  return (
    <>
      <header className="bg-brand px-page pb-4 pt-safe-base shadow-lg sticky top-0 z-[9999]">
        <div className="max-w-xl mx-auto flex items-center justify-between relative">
          {pathInfo.backButton ? (
            <NavLink 
              to={pathInfo.backButton}
              className="text-white/90 hover:text-white transition-all min-h-touch flex items-center -ml-1"
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faChevronLeft} className="text-xl" />
                <h1 className="text-white text-title font-bold tracking-tight">{pathInfo.heading}</h1>
              </div>
            </NavLink>
          ) : (
            <div className="flex items-center gap-3">
              {pathInfo.icon && <FontAwesomeIcon icon={pathInfo.icon} className="text-xl text-white" />}
              <h1 className="text-white text-title font-bold tracking-tight">{pathInfo.heading}</h1>
            </div>
          )}

          {user ? (
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="min-w-touch min-h-touch flex items-center justify-center text-white/90 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full"
                aria-label="Account menu"
                aria-expanded={isDropdownOpen}
              >
                <FontAwesomeIcon icon={faUserCircle} className="text-3xl" />
              </button>

              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-800 leading-tight">{user.displayName}</p>
                      <p className="text-base text-slate-500 font-medium">{user.email}</p>
                    </div>
                    <div className="px-2 py-2">
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 font-bold hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all group"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/account');
                        }}
                      >
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                          <FontAwesomeIcon
                            icon={faGear}
                            className="text-slate-400 group-hover:text-slate-700 transition-colors text-lg"
                          />
                        </div>
                        <span className="uppercase tracking-wider text-base">Account</span>
                      </button>
                      <button 
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 font-bold hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all group"
                        onClick={() => {
                          props.handleLogout();
                          setIsDropdownOpen(false);
                          navigate('/');
                        }}
                      >
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                          <FontAwesomeIcon 
                            icon={faSignOutAlt} 
                            className="text-slate-400 group-hover:text-slate-700 transition-colors text-lg" 
                          />
                        </div>
                        <span className="uppercase tracking-wider text-base">Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={props.handleGoogleLogin}
              className="min-h-touch px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-label font-black uppercase tracking-widest transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {!!(props.hasProgressPercent && props.totalItems) && (
        <div className="sticky top-[var(--app-header-height)] z-[9998] shadow-lg">
          <div className="bg-brand h-6">
            <div className="w-full h-6 bg-blue-900/20 relative flex items-center justify-center overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out
                            ${isFinished ? 'bg-green-700' : 'bg-white'}`}
                style={{ width: `${progressPercent}%` }}
              />
              {props.totalItems > 0 && (
                <span className={`${isFinished ? 'bg-green-700 text-white' : 'bg-white text-black'} relative z-10 px-3 py-0 text-body-sm font-black uppercase tracking-widest shadow-sm`}>
                  {props.checkedCount} / {props.totalItems} Items Completed
                </span>
              )}
            </div>
          </div>
          {props.lastRemoteUpdateAt && remoteUpdateOpacity > 0 && (
            <div
              className="transition-opacity duration-1000 ease-out"
              style={{ opacity: remoteUpdateOpacity }}
            >
              <div
                key={props.lastRemoteUpdateAt}
                className="remote-update-banner flex items-center justify-center gap-2 h-8 bg-[#0D47A1] border-t border-white/25 text-label font-black uppercase tracking-widest text-white"
                aria-live="polite"
              >
                <span className="remote-update-dot w-2 h-2 rounded-full bg-emerald-300 shrink-0" />
                {formatRelativeUpdateTime(props.lastRemoteUpdateAt)}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Header;
