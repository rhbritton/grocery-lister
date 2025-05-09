import React, { useEffect } from 'react';

import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';

import { listenForAuthChanges, logout } from './redux/actions/authActions';
import GoogleSignInButton from './auth/GoogleSignInButton';

import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement, incrementByAmount } from './features/counter/counterSlice.ts';

import Header from './components/Header.js';

import GroceryLists from './features/grocery-lists/GroceryLists';
import AddGroceryList from './features/grocery-lists/views/AddGroceryList.js';
import ViewGroceryList from './features/grocery-lists/views/ViewGroceryList.js';

import Recipes from './features/recipes/views/Recipes.js';
import AddRecipe from './features/recipes/views/AddRecipe.js';
import EditRecipe from './features/recipes/views/EditRecipe.js';
import ViewRecipe from './features/recipes/views/ViewRecipe.js';

import './App.css';

function App() {
  // const dispatch = useDispatch();
  // const isAuthenticated = useSelector((state) => state?.auth?.isAuthenticated);
  // const user = useSelector((state) => state?.auth?.user);

  // useEffect(() => {
  //   const unsubscribe = dispatch(listenForAuthChanges());
  //   return () => unsubscribe();
  // }, [dispatch]);

  // const handleLogout = () => {
  //   dispatch(logout());
  // };
  
  return (
    <div className="App bg-gray-100 min-h-screen p-4">
      
      <BrowserRouter basename="/gl">
      <Header />
      
      <main className="flex flex-col md:flex-col md:space-y-0 md:space-x-4">
        <Routes>
          <Route path="/" element={<Recipes />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/add" element={<AddRecipe />} />
          <Route path="/recipes/edit/:recipeId" element={<EditRecipe />} />
          <Route path="/recipes/view/:recipeId" element={<ViewRecipe />} />

          <Route path="/grocery-lists" element={<GroceryLists />} />
          <Route path="/grocery-lists/add" element={<AddGroceryList />} />
          <Route path="/grocery-lists/view/:groceryListId" element={<ViewGroceryList />} />
        </Routes>
      </main>
      
      </BrowserRouter>
      
    </div>
  );
}

export default App;


// {isAuthenticated ? (
//   <BrowserRouter basename="/gl">
//   <Header />
  
//   <main className="flex flex-col md:flex-col md:space-y-0 md:space-x-4">
//     <Routes>
//       <Route path="/" element={<Recipes />} />
//       <Route path="/recipes" element={<Recipes />} />
//       <Route path="/recipes/add" element={<AddRecipe />} />
//       <Route path="/recipes/edit/:recipeId" element={<EditRecipe />} />
//       <Route path="/recipes/view/:recipeId" element={<ViewRecipe />} />

//       <Route path="/grocery-lists" element={<GroceryLists />} />
//       <Route path="/grocery-lists/add" element={<AddGroceryList />} />
//       <Route path="/grocery-lists/view/:groceryListId" element={<ViewGroceryList />} />
//     </Routes>
//   </main>
  
//   </BrowserRouter>
// ) : (
//   <div>
//     <GoogleSignInButton />
//     {/* Optionally display other sign-in options or messages */}
//   </div>
// )}