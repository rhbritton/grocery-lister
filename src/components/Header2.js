import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faUserCircle,
  faSignOutAlt,
  faClipboardList,
  faBook
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
  }
  const groceryListsPath = {
    heading: 'Grocery Lists',
    backButton: false,
    icon: faClipboardList
  }
  const recipesAddPath = {
    heading: 'New Recipe',
    backButton: '/recipes'
  }
  const recipesEditPath = {
    heading: 'Edit Recipe',
    backButton: '/recipes'
  }
  const recipesViewPath = {
    heading: 'Recipe',
    backButton: '/recipes'
  }
  const groceryListsAddPath = {
    heading: 'New List',
    backButton: '/grocery-lists'
  }
  const groceryListsEditPath = {
    heading: 'Edit List',
    backButton: '/grocery-lists'
  }
  const groceryListsViewPath = {
    heading: 'Grocery List',
    backButton: '/grocery-lists'
  }

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
    });

    return pathInfos[location.pathname] || pathInfos[pathNameContains] || getDefaultPathInfo();
  }

  const getDefaultPathInfo = () => {
    return {
        heading: '',
        backButton: true
    }
  }

  // State to manage dropdown visibility
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

  return (
    <>
      {user &&
        <>
            <header className="bg-brand px-page pb-4 pt-safe-base shadow-lg sticky top-0 z-[9999]">
                <div className="max-w-xl mx-auto flex items-center justify-between relative">
                    {getPathInfo().backButton && <NavLink 
                        to={getPathInfo().backButton}
                        className="text-white/90 hover:text-white transition-all min-h-touch flex items-center -ml-1"
                    >
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faChevronLeft} className="text-xl" />
                            <h1 className="text-white text-title font-bold tracking-tight"> {getPathInfo().heading}</h1>
                        </div>
                    </NavLink>}

                    {!getPathInfo().backButton && <div className="flex items-center gap-3">
                        {getPathInfo().icon && <FontAwesomeIcon icon={getPathInfo().icon} className="text-xl text-white" />}
                        <h1 className="text-white text-title font-bold tracking-tight"> {getPathInfo().heading}</h1>
                    </div>}
            
                    <div className="relative">
                        <button 
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
                            ></div>
                        
                            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">{user.displayName}</p>
                                    <p className="text-base text-slate-500 font-medium">{user.email}</p>
                                </div>
                        
                                {/* Action Buttons */}
                                <div className="px-2 pb-2 pt-0">
                                <button 
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 font-bold hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group"
                                    onClick={() => {
                                        props.handleLogout();
                                        setIsDropdownOpen(false);
                                        navigate('/');
                                    }}
                                >
                                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                    <FontAwesomeIcon 
                                        icon={faSignOutAlt} 
                                        className="text-slate-400 group-hover:text-red-600 transition-colors text-lg" 
                                    />
                                    </div>
                                    <span className="uppercase tracking-wider text-base">Logout</span>
                                </button>
                                </div>
                            </div>
                            </>
                        )}
                    </div>
                </div>
            </header>
            {!!(props.hasProgressPercent && props.totalItems) && (
              <div className="sticky top-[var(--app-header-height)] z-[9998] shadow-lg">
                <div className="bg-brand h-6">
                  <div className="w-full h-6 bg-blue-900/20 relative flex items-center justify-center overflow-hidden">
                    
                    {/* 1. PROGRESS FILL (Stays behind everything) */}
                    <div
                      className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out
                                  ${isFinished ? 'bg-green-700' : 'bg-white'}`}
                      style={{ width: `${progressPercent}%` }}
                    />

                    {/* 2. TEXT WITH BLACK BACKGROUND PILL */}
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
      }

      {!user &&
      <header className="bg-white p-6 rounded-lg shadow-md mb-4 flex justify-between items-center">
        <button
          onClick={props.handleGoogleLogin}
          className="w-full flex items-center justify-center py-4 px-6 bg-blue-600 hover:bg-brand-dark text-white font-medium rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          GroceryLister | Sign in with Google
        </button>
      </header>
      }
    </>
  );
}

export default Header;