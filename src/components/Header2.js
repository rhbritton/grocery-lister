import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faSave, 
  faPlus, 
  faTrashAlt, 
  faTag, 
  faListUl, 
  faHashtag,
  faUtensils,
  faUserCircle,
  faSignOutAlt,
  faCalendarAlt,
  faClipboardList,
  faCheck,
  faBook
} from '@fortawesome/free-solid-svg-icons';

function Header(props) {
  const { user } = props;
  const location = useLocation();
  const navigate = useNavigate();

  const isActiveURL = (path) => {
    if (path === '/' && location.pathname === path)
        return true;
    else if (path === '/')
        return false;

    return location.pathname.includes(path);
  };

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
    heading: 'Recipes Add',
    backButton: '/recipes'
  }
  const recipesEditPath = {
    heading: 'Recipes Edit',
    backButton: '/recipes'
  }
  const recipesViewPath = {
    heading: 'Recipes View',
    backButton: '/recipes'
  }
  const groceryListsAddPath = {
    heading: 'Grocery Lists Add',
    backButton: '/grocery-lists'
  }
  const groceryListsEditPath = {
    heading: 'Grocery Lists Edit',
    backButton: '/grocery-lists'
  }
  const groceryListsViewPath = {
    heading: 'Grocery Lists View',
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

  // Function to toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

    const progressPercent = props.totalItems <= 0 ? 0 : (props.totalItems ? ((props.checkedCount / props.totalItems) * 100) : 100);
    const isFinished = props.totalItems <= 0 ? false : (props.totalItems ? (props.totalItems > 0 && props.checkedCount === props.totalItems) : true);

  return (
    <>
      {user &&
        <>
            <header className="bg-[#1976D2] px-6 py-4 shadow-lg sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between relative">
                    {getPathInfo().backButton && <NavLink 
                        to={getPathInfo().backButton}
                        className="text-white/90 hover:text-white transition-all p-1 -ml-2"
                    >
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faChevronLeft} className="text-xl" />
                            <h1 className="text-white text-2xl font-bold tracking-tight"> {getPathInfo().heading}</h1>
                        </div>
                    </NavLink>}

                    {!getPathInfo().backButton && <div className="flex items-center gap-3">
                        {getPathInfo().icon && <FontAwesomeIcon icon={getPathInfo().icon} className="text-xl text-white" />}
                        <h1 className="text-white text-2xl font-bold tracking-tight"> {getPathInfo().heading}</h1>
                    </div>}
            
                    <div className="relative">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-colors focus:outline-none"
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
                                    <p className="text-sm font-bold text-slate-800 leading-tight">Ryan Britton</p>
                                    <p className="text-base text-slate-500 font-medium">ryanhbritton@gmail.com</p>
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
            {!!(props.hasProgressPercent && props.totalItems) &&
                <div className="bg-[#1976D2] h-6 shadow-lg sticky top-[90px] z-40">
                    <div className="w-full h-6 bg-blue-900/20 relative flex items-center justify-center overflow-hidden">    
                        {/* PROGRESS FILL */}
                        <div 
                            className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out
                                ${isFinished ? 'bg-green-700' : 'bg-white'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                        
                        {/* CENTERED ITEM COUNT */}
                        {props.totalItems > 0 && <span 
                        className="relative z-10 text-[16px] font-black uppercase tracking-widest text-white transition-colors duration-300"
                        style={{
                            /* Creates a sharp 1px outline using your brand blue */
                            textShadow: isFinished ? 'none' : `
                            1.5px  1.5px 0 #1976D2,
                            -1.5px -1.5px 0 #1976D2,
                            1.5px -1.5px 0 #1976D2,
                            -1.5px  1.5px 0 #1976D2,
                            1.5px  0px 0 #1976D2,
                            -1.5px  0px 0 #1976D2,
                            0px  1.5px 0 #1976D2,
                            0px -1.5px 0 #1976D2
                            `
                        }}>
                        {props.checkedCount} / {props.totalItems} Items Completed
                        </span>}
                    </div>
                </div>
            }
        </>
      }

      {!user &&
      <header className="bg-white p-6 rounded-lg shadow-md mb-4 flex justify-between items-center">
        <button
          onClick={props.handleGoogleLogin}
          className="w-full flex items-center justify-center py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          GroceryLister | Sign in with Google
        </button>
      </header>
      }
    </>
  );
}

export default Header;