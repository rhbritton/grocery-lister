import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './auth/firebaseConfig';
import { userLogout } from './auth/authActions';

import { BrowserRouter, Routes, Route, NavLink, useLocation, useSearchParams, Navigate, useNavigate } from 'react-router-dom';

import { useSelector, useDispatch } from 'react-redux';

import Header from './components/Header2.js';

import GroceryLists from './features/grocery-lists/GroceryLists2.js';
import AddGroceryList from './features/grocery-lists/views/AddGroceryList2.js';
import EditGroceryList from './features/grocery-lists/views/EditGroceryList.js';
import ViewGroceryList from './features/grocery-lists/views/ViewGroceryList2.js';
import ViewSharedGroceryList from './features/grocery-lists/views/ViewSharedGroceryList.js';

import Recipes from './features/recipes/views/Recipes2.js';
import AddRecipe from './features/recipes/views/AddRecipe2.js';
import EditRecipe from './features/recipes/views/EditRecipe2.js';
import ViewRecipe from './features/recipes/views/ViewRecipe2.js';

import TestRecipeList from './TestRecipeList.js';
import TestRecipeView from './TestRecipeView.js';
import TestRecipeEdit from './TestRecipeEdit.js';

import TestGroceryListListView from './TestGroceryListList.js';
import TestGroceryListView from './TestGroceryListView.js';
import TestGroceryListEdit from './TestGroceryListEdit.js';



import { 
  getAllRecipesFromFirestore, 
  getAllFavoriteRecipesFromFirestore, 
  selectMaxRecipeTimestamp,
  syncRecipesFromFirestore
} from './features/recipes/slices/recipesSlice.ts';
import { 
  getAllGroceryListsFromFirestore, 
  syncGroceryListsFromFirestore,
  selectMaxGroceryListTimestamp
} from './features/grocery-lists/slices/groceryListsSlice.ts';

import './App.css';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

const appId = firebaseConfig.projectId;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  const [groceryListHasChanged, setGroceryListHasChanged] = useState(false);
  
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  const [spaceForFloatingButton, setSpaceForFloatingButton] = useState('');
  
  const dispatch = useDispatch();

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
  //     if (currentUser) {
  //       setUser(currentUser);
  //       const userId = currentUser.uid;
  //       const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profiles/${userId}`);

  //       await fetchInitialUserData(dispatch, userId);
        
  //       onSnapshot(userProfileRef, (docSnap) => {
  //         if (docSnap.exists()) {
  //           setUserProfile(docSnap.data());
  //         } else {
  //           setUserProfile(null);
  //         }
  //       }, (error) => {
  //         console.error("Error listening to user profile:", error);
  //       });
  //     } else {
  //       setUser(null);
  //       setUserProfile(null);
  //     }
  //     setLoading(false);
  //   });

  //   return () => unsubscribe();
  // }, []);

  // 1. Auth Observer: Only handles the Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Authentication check is done
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Profile & Data Observer: Runs only when user.uid exists
  useEffect(() => {
    if (!user) return;

    const userId = user.uid;
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profiles/${userId}`);

    // Trigger Data Fetch
    fetchInitialUserData(dispatch, userId);

    // Setup Profile Listener
    const unsubscribeSnapshot = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        setUserProfile(null);
      }
    }, (error) => {
      console.error("Error listening to user profile:", error);
    });

    // CLEANUP: This is the most important part. 
    // It kills the listener when the user logs out or the ID changes.
    return () => unsubscribeSnapshot();
  }, [user?.uid, dispatch]);

  const lastSync = useSelector(selectMaxRecipeTimestamp);
  const lastSyncGL = useSelector(selectMaxGroceryListTimestamp);  

  const fetchInitialUserData = async (dispatch, userId) => {
    await Promise.all([
      dispatch(getAllFavoriteRecipesFromFirestore(userId)),
      dispatch(syncRecipesFromFirestore({ userId, lastSyncTimestamp: lastSync })),
      dispatch(syncGroceryListsFromFirestore({ userId, lastSyncTimestamp: lastSyncGL }))
    ])
  };

  // Handle Google Sign-in
  const handleGoogleLogin = async () => {
    if (!auth || !db) {
      console.error("Firebase services are not initialized.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      const userProfileRef = doc(db, `artifacts/${appId}/users/${googleUser.uid}/profiles/${googleUser.uid}`);
      await setDoc(userProfileRef, {
        uid: googleUser.uid,
        displayName: googleUser.displayName,
        email: googleUser.email,
        photoURL: googleUser.photoURL,
        lastLogin: new Date().toISOString()
      }, { merge: true });

    } catch (error) {
      console.error("Error during Google login:", error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    if (auth) {
      dispatch(userLogout());

      await signOut(auth);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-medium">Loading...</div>
      </div>
    );
  }

  // if (!user) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
  //       <div className="w-full max-w-sm p-8 bg-gray-800 rounded-2xl shadow-2xl text-white text-center">
  //         <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600">
  //           Welcome to GroceryLister
  //         </h1>
  //         <p className="text-gray-400 mb-8 font-light">
  //           Your personal grocery list and recipe manager. Please sign in to get started!
  //         </p>
  //         <button
  //           onClick={handleGoogleLogin}
  //           className="w-full flex items-center justify-center py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
  //         >
  //           <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
  //             <path d="M22.618 10.289h-2.158v-2.031h-2.031v2.031h-2.158v2.031h2.158v2.158h2.031v-2.158h2.158v-2.031zM11.691 10.289c1.928 0 3.737 0.643 5.216 1.839l-1.42 1.42c-1.125-0.892-2.585-1.428-4.084-1.428-3.328 0-6.143 2.031-7.18 4.881l-1.89-1.391c1.375-3.09 4.607-5.187 8.358-5.187zM11.691 22.846c-5.875 0-10.643-4.768-10.643-10.643s4.768-10.643 10.643-10.643c2.723 0 5.24 1.054 7.152 2.768l-2.089 2.089c-1.464-1.071-3.214-1.714-5.063-1.714-3.522 0-6.42 2.531-7.116 5.866l-2.107-1.554c1.196-2.589 3.866-4.393 6.821-4.393 2.045 0 3.964 0.696 5.518 1.897l-0.995 1.139c-1.286-0.875-2.884-1.428-4.527-1.428-3.076 0-5.625 2.232-6.286 5.232h12.563c0.165-0.781 0.268-1.589 0.268-2.429 0-0.741-0.089-1.464-0.214-2.161h-6.232v-2.031h8.286c-0.125-0.714-0.357-1.428-0.67-2.098l-2.857-2.857c-2.054-1.991-4.857-3.214-7.902-3.214-5.875 0-10.643 4.768-10.643 10.643s4.768 10.643 10.643 10.643c4.768 0 8.875-3.143 10.295-7.464h-2.161c-1.295 3.036-4.223 5.259-7.134 5.259z"/>
  //           </svg>
  //           Sign in with Google
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  const loginPage = 
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-sm p-8 bg-gray-800 rounded-2xl shadow-2xl text-white text-center">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600">
          Welcome to GroceryLister
        </h1>
        <p className="text-gray-400 mb-8 font-light">
          Your personal grocery list and recipe manager. Please sign in to get started!
        </p>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.618 10.289h-2.158v-2.031h-2.031v2.031h-2.158v2.031h2.158v2.158h2.031v-2.158h2.158v-2.031zM11.691 10.289c1.928 0 3.737 0.643 5.216 1.839l-1.42 1.42c-1.125-0.892-2.585-1.428-4.084-1.428-3.328 0-6.143 2.031-7.18 4.881l-1.89-1.391c1.375-3.09 4.607-5.187 8.358-5.187zM11.691 22.846c-5.875 0-10.643-4.768-10.643-10.643s4.768-10.643 10.643-10.643c2.723 0 5.24 1.054 7.152 2.768l-2.089 2.089c-1.464-1.071-3.214-1.714-5.063-1.714-3.522 0-6.42 2.531-7.116 5.866l-2.107-1.554c1.196-2.589 3.866-4.393 6.821-4.393 2.045 0 3.964 0.696 5.518 1.897l-0.995 1.139c-1.286-0.875-2.884-1.428-4.527-1.428-3.076 0-5.625 2.232-6.286 5.232h12.563c0.165-0.781 0.268-1.589 0.268-2.429 0-0.741-0.089-1.464-0.214-2.161h-6.232v-2.031h8.286c-0.125-0.714-0.357-1.428-0.67-2.098l-2.857-2.857c-2.054-1.991-4.857-3.214-7.902-3.214-5.875 0-10.643 4.768-10.643 10.643s4.768 10.643 10.643 10.643c4.768 0 8.875-3.143 10.295-7.464h-2.161c-1.295 3.036-4.223 5.259-7.134 5.259z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>;

  const _404 = 
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-sm p-8 bg-gray-800 rounded-2xl shadow-2xl text-white text-center">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600">
          404 Page Not Found
        </h1>
        <p className="text-gray-400 mb-8 font-light">
          Your personal grocery list and recipe manager. Please sign in to get started!
        </p>
      </div>
    </div>;

  

  const QueryRedirectHandler = ({ user }) => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const grocerylistId = searchParams.get('grocerylist');
    const recipeId = searchParams.get('recipe');

    if (grocerylistId)
      return <Navigate to={`/grocery-lists/view/${grocerylistId}`} replace />;

    if (recipeId)
      return <Navigate to={`/recipes/view/${recipeId}`} replace />;

    if (location.pathname === '/' || location.pathname === '/gl' && user)
      return <Navigate to="/recipes" replace />;

    return user ? _404 : loginPage;
  };

  return (
    <div className="App bg-gray-100 min-h-screen">
        {groceryListHasChanged && (
            <div 
                onClick={handleRefresh}
                className="bg-blue-100 border-t-4 border-blue-500 rounded-b text-blue-900 px-4 py-2 shadow-md flex justify-between items-center" 
                role="alert"
            >
                <div className="flex items-center">
                    <p className="font-bold">This Grocery List was updated by another user</p>
                    <p className="text-sm ml-2">Click to refresh to see the changes.</p>
                </div>
            </div>
        )}

        <BrowserRouter basename="/gl">

        <main className={`min-h-screen bg-[#F8FAFC] font-sans text-slate-900 ${spaceForFloatingButton}`}>
            {user && <Header user={user} handleGoogleLogin={handleGoogleLogin} handleLogout={handleLogout} hasProgressPercent={true} checkedCount={checkedCount} totalItems={totalItems} />}
            <Routes>
              {user && <Route path="/recipes" element={<Recipes user={user} setSpaceForFloatingButton={setSpaceForFloatingButton} />} />}
              {user && <Route path="/recipes/add" element={<AddRecipe user={user} />} />}
              {user && <Route path="/recipes/edit/:recipeId" element={<EditRecipe />} />}
              
              {user && <Route path="/grocery-lists" element={<GroceryLists user={user} setSpaceForFloatingButton={setSpaceForFloatingButton} />} />}
              {user && <Route path="/grocery-lists/add" element={<AddGroceryList user={user} />} />}
              {user && <Route path="/grocery-lists/edit/:groceryListId" element={<EditGroceryList />} />}
              {user && <Route path="/grocery-lists/view/:groceryListId" element={<ViewGroceryList basename="/gl" userId={user.uid} groceryListHasChanged={groceryListHasChanged} setGroceryListHasChanged={setGroceryListHasChanged} setCheckedCount={setCheckedCount} setTotalItems={setTotalItems} setSpaceForFloatingButton={setSpaceForFloatingButton} />} />}
              
              <Route path="/recipes/view/:recipeId" element={<ViewRecipe basename="/gl" userId={user?.uid} Header={<Header user={user} handleGoogleLogin={handleGoogleLogin} handleLogout={handleLogout} checkedCount={checkedCount} totalItems={totalItems} />} />} />
              <Route path="/test" element={<TestRecipeList user={user} />} />
              <Route path="/test-recipe-view" element={<TestRecipeView user={user} />} />
              <Route path="/test-recipe-edit" element={<TestRecipeEdit user={user} />} />
              <Route path="/test-grocerylist-list" element={<TestGroceryListListView user={user} />} />
              <Route path="/test-grocerylist-view" element={<TestGroceryListView user={user} />} />
              <Route path="/test-grocerylist-edit" element={<TestGroceryListEdit user={user} />} />
              <Route path="*" element={<QueryRedirectHandler user={user} />} />
            </Routes>
        </main>
        
        </BrowserRouter>
    </div>
  );
}

export default App;