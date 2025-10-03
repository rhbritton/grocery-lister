import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

function Header(props) {
  const { user } = props;
  const location = useLocation();

  const isActiveURL = (path) => {
    if (path === '/' && location.pathname === path)
        return true;
    else if (path === '/')
        return false;

    return location.pathname.includes(path);
  };

  // State to manage dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Function to toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div>
      <header className="bg-white p-6 rounded-lg shadow-md mb-4 flex justify-between items-center">
        {/* This div groups Recipes and Grocery Lists together on the left */}
        <div className="flex space-x-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-2xl font-bold cursor-pointer hover:text-blue-500 ${
                isActiveURL('/') || isActiveURL('/recipes') ? 'text-blue-500' : 'text-gray-800'
              }`
            }
          >
            <h1>Recipes</h1>
          </NavLink>
          <NavLink
            to="/grocery-lists"
            className={({ isActive }) =>
              `text-2xl font-bold cursor-pointer hover:text-blue-500 ${
                isActiveURL('/grocery-lists') ? 'text-blue-500' : 'text-gray-800'
              }`
            }
          >
            <h1>Grocery Lists</h1>
          </NavLink>
        </div>

        {/* The user profile icon remains on the right */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="text-gray-800 text-2xl hover:text-blue-500 focus:outline-none"
          >
            <FontAwesomeIcon icon={faUserCircle} />
          </button>
          {isDropdownOpen && (
            <ul className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
              <li className="text-right flex items-center px-4 py-2 text-sm text-gray-700">
                {user.displayName}
              </li>
              <li className="flex items-center px-4 py-2 text-sm text-gray-700">
                {user.email}
              </li>
              <li
                onClick={() => {
                  props.handleLogout();
                  setIsDropdownOpen(false);
                }}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                Logout
              </li>
            </ul>
          )}
        </div>
      </header>
    </div>
  );
}

export default Header;