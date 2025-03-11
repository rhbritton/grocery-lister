import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();

  const isActiveURL = (path) => {
    if (path === '/' && location.pathname === path)
        return true;
    else if (path === '/')
        return false;

    return location.pathname.includes(path);
  };

  return (
    <div>
        <header className="bg-white p-6 rounded-lg shadow-md mb-4 flex justify-center space-x-8">
            <img className="absolute left-[2em] h-[2em]" src="/images/logo_color_gradient.png" />
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-2xl font-bold cursor-pointer hover:text-blue-500 ${
                isActiveURL('/') || isActiveURL('/recipes') ? 'text-blue-500' : 'text-gray-800' // Apply blue if active
              }`
            }
          >
            <h1>Recipes</h1>
          </NavLink>
          <NavLink
            to="/grocery-lists"
            className={({ isActive }) =>
              `text-2xl font-bold cursor-pointer hover:text-blue-500 ${
                isActiveURL('/grocery-lists') ? 'text-blue-500' : 'text-gray-800' // Check location.pathname
              }`
            }
          >
            <h1>Grocery Lists</h1>
          </NavLink>
        </header>
    </div>
  );
}

export default Header;