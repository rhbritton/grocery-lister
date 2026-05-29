import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './auth/firebaseConfig';
import { resetUserSession } from './auth/authActions';
import {
  shouldFullRefreshUserData,
  shouldResetUserSession,
} from './auth/sessionLifecycle.js';

import { BrowserRouter, Routes, Route, NavLink, useLocation, useSearchParams, Navigate, useNavigate, useParams } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ConnectionStatusBanner, { CONNECTION_BANNER_HEIGHT_PX } from './components/ConnectionStatusBanner';
import StorePromoBanner from './components/StorePromoBanner';
import PageLoader from './components/PageLoader';

import { useDispatch } from 'react-redux';

import Header from './components/Header2.js';

import GroceryLists from './features/grocery-lists/GroceryLists2.js';
import AddGroceryList from './features/grocery-lists/views/AddGroceryList2.js';
import ViewGroceryList from './features/grocery-lists/views/ViewGroceryList2.js';

import Recipes from './features/recipes/views/Recipes2.js';
import AddRecipe from './features/recipes/views/AddRecipe2.js';
import EditRecipe from './features/recipes/views/EditRecipe2.js';
import ViewRecipe from './features/recipes/views/ViewRecipe2.js';
import AccountSettings from './features/account/views/AccountSettings.js';

import { 
  getAllRecipesFromFirestore, 
  getAllFavoriteRecipesFromFirestore, 
  selectMaxRecipeTimestamp,
  syncRecipesFromFirestore,
  applyPendingRecipesFromSyncQueue,
} from './features/recipes/slices/recipesSlice.ts';
import { 
  getAllGroceryListsFromFirestore, 
  syncGroceryListsFromFirestore,
  selectMaxGroceryListTimestamp
} from './features/grocery-lists/slices/groceryListsSlice.ts';
import { clearPendingSync } from './features/sync/pendingSyncSlice.ts';
import { store, persistor } from './app/store.ts';
import { deleteAccount } from './services/accountDeletion.js';
import { signInWithGoogle, getSignInErrorMessage } from './auth/signIn.js';
import { upsertUserProfile } from './auth/userProfile.js';
import { handleFirestoreNetworkError, isBrowserOffline } from './services/offlineSync.ts';
import { useConnectionBannerStatus } from './services/useConnectionBannerStatus.ts';

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

function GroceryListEditRedirect() {
  const { groceryListId } = useParams();
  return <Navigate to={`/grocery-lists/view/${groceryListId}`} replace />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [lastRemoteUpdateAt, setLastRemoteUpdateAt] = useState(null);

  const handleRemoteListUpdate = useCallback(() => {
    setLastRemoteUpdateAt(Date.now());
  }, []);
  
  const [spaceForFloatingButton, setSpaceForFloatingButton] = useState('');

  const dispatch = useDispatch();

  const { connectionStatus, connectionBannerVisible } =
    useConnectionBannerStatus(user?.uid);

  const previousUserIdRef = useRef(undefined);
  const isDeletingAccountRef = useRef(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const clearUiSessionState = useCallback(() => {
    setUserProfile(null);
    setCheckedCount(0);
    setTotalItems(0);
    setLastRemoteUpdateAt(null);
    setSpaceForFloatingButton('');
  }, []);

  const fetchInitialUserData = useCallback(async (userId, { fullRefresh = false } = {}) => {
    await dispatch(applyPendingRecipesFromSyncQueue());

    if (isBrowserOffline()) {
      return;
    }

    const state = store.getState();
    const lastSync = fullRefresh ? 0 : selectMaxRecipeTimestamp(state);
    const lastSyncGL = fullRefresh ? 0 : selectMaxGroceryListTimestamp(state);

    if (fullRefresh) {
      await Promise.all([
        dispatch(getAllFavoriteRecipesFromFirestore(userId)),
        dispatch(getAllRecipesFromFirestore(userId)),
        dispatch(getAllGroceryListsFromFirestore(userId)),
      ]);
      return;
    }

    await Promise.all([
      dispatch(getAllFavoriteRecipesFromFirestore(userId)),
      dispatch(syncRecipesFromFirestore({ userId, lastSyncTimestamp: lastSync })),
      dispatch(syncGroceryListsFromFirestore({ userId, lastSyncTimestamp: lastSyncGL })),
    ]);
  }, [dispatch]);

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

  // Profile & data: reset session on logout/account switch, then load the active user.
  useEffect(() => {
    let cancelled = false;
    const nextUserId = user?.uid ?? null;
    const previousUserId = previousUserIdRef.current;

    const loadSession = async () => {
      if (shouldResetUserSession(previousUserId, nextUserId) && !isDeletingAccountRef.current) {
        await resetUserSession(dispatch, persistor);
        clearUiSessionState();
      }

      previousUserIdRef.current = nextUserId;

      if (!nextUserId || cancelled) {
        return;
      }

      await fetchInitialUserData(nextUserId, {
        fullRefresh: shouldFullRefreshUserData(previousUserId, nextUserId),
      });
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, dispatch, clearUiSessionState, fetchInitialUserData]);

  useEffect(() => {
    if (!user?.uid) return;

    const userId = user.uid;
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profiles/${userId}`);

    const unsubscribeSnapshot = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        setUserProfile(null);
      }
    }, (error) => {
      console.error("Error listening to user profile:", error);
      handleFirestoreNetworkError(error);
    });

    return () => unsubscribeSnapshot();
  }, [user?.uid]);

  // Handle Google Sign-in
  const handleGoogleLogin = async () => {
    if (!auth || !db) {
      console.error("Firebase services are not initialized.");
      return;
    }

    try {
      const result = await signInWithGoogle();
      await upsertUserProfile(result.user);
    } catch (error) {
      console.error("Error during Google login:", getSignInErrorMessage(error), error);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;

    await resetUserSession(dispatch, persistor);
    clearUiSessionState();
    await signOut(auth);
  };

  const handleDeleteAccount = async () => {
    isDeletingAccountRef.current = true;
    setIsDeletingAccount(true);

    try {
      dispatch(clearPendingSync());
      await deleteAccount();
      await resetUserSession(dispatch, persistor);
      clearUiSessionState();
    } catch (error) {
      isDeletingAccountRef.current = false;
      setIsDeletingAccount(false);
      throw error;
    }
  };

  const finishAccountDeletionRedirect = () => {
    isDeletingAccountRef.current = false;
    setIsDeletingAccount(false);
  };

  if (loading) {
    return <PageLoader message="Starting GroceryLister…" />;
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

  const loginPage = (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-sm p-10 bg-white rounded-[2rem] shadow-xl border border-slate-100 text-center">
        {/* App Logo */}
        <div className="flex justify-center mb-6">
          <span className="w-20 h-20 rounded-2xl overflow-hidden inline-flex">
            <img
              className="w-full h-full object-contain block"
              src={`${process.env.PUBLIC_URL}/images/logo_color.png`}
              alt="GroceryLister Logo"
              width={80}
              height={80}
            />
          </span>
        </div>

        <h1 className="text-3xl font-black mb-3 tracking-tight text-slate-900">
          GroceryLister
        </h1>
        
        <p className="text-slate-500 mb-10 font-medium leading-relaxed">
          Your personal grocery list and recipe manager. Please sign in to get started!
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center py-4 px-6 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-lg shadow-blue-200"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );

  const _404 = (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-md p-10 bg-white rounded-[2rem] shadow-xl border border-slate-100 text-center">
        <div className="text-6xl mb-6">🤔</div>
        
        <h1 className="text-4xl font-black mb-4 tracking-tight text-slate-900">
          404
        </h1>
        
        <p className="text-slate-500 mb-8 font-medium leading-relaxed">
          Oops! We can't find the page you're looking for. It might have been moved or deleted.
        </p>

        <NavLink
          to="/recipes"
          className="inline-block py-4 px-10 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all shadow-lg"
        >
          Back to Recipes
        </NavLink>
      </div>
    </div>
  );

  

  const QueryRedirectHandler = ({ user, isDeletingAccount }) => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const grocerylistId = searchParams.get('grocerylist');
    const recipeId = searchParams.get('recipe');

    if (grocerylistId)
      return <Navigate to={`/grocery-lists/view/${grocerylistId}`} replace />;

    if (recipeId)
      return <Navigate to={`/recipes/view/${recipeId}`} replace />;

    if (location.pathname === '/' && user)
      return <Navigate to="/recipes" replace />;

    if (isDeletingAccount) {
      return <PageLoader message="Signing you out…" />;
    }

    return user ? _404 : loginPage;
  };

  return (
    <div
      className="App bg-[#F8FAFC] min-h-screen"
      style={
        connectionBannerVisible
          ? {
              '--connection-banner-offset': `calc(${CONNECTION_BANNER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`,
            }
          : undefined
      }
    >
        <StorePromoBanner />

        <BrowserRouter>

        <ScrollToTop />

        {user && <ConnectionStatusBanner status={connectionStatus} />}

        <main
          className={`min-h-screen bg-[#F8FAFC] font-sans text-slate-900 ${spaceForFloatingButton} ${
            connectionBannerVisible ? 'pt-[var(--connection-banner-offset)]' : ''
          }`}
        >
            <Header
              user={user}
              handleGoogleLogin={handleGoogleLogin}
              handleLogout={handleLogout}
              hasProgressPercent={true}
              checkedCount={checkedCount}
              totalItems={totalItems}
              lastRemoteUpdateAt={lastRemoteUpdateAt}
              setLastRemoteUpdateAt={setLastRemoteUpdateAt}
              connectionBannerActive={connectionBannerVisible}
            />
            <Routes>
              {user && <Route path="/recipes" element={<Recipes user={user} setSpaceForFloatingButton={setSpaceForFloatingButton} />} />}
              {user && <Route path="/recipes/add" element={<AddRecipe user={user} />} />}
              {user && <Route path="/recipes/edit/:recipeId" element={<EditRecipe />} />}
              
              {user && <Route path="/grocery-lists" element={<GroceryLists user={user} setSpaceForFloatingButton={setSpaceForFloatingButton} />} />}
              {user && <Route path="/grocery-lists/add" element={<AddGroceryList user={user} />} />}
              {user && <Route path="/grocery-lists/edit/:groceryListId" element={<GroceryListEditRedirect />} />}
              {(user || isDeletingAccount) && (
                <Route
                  path="/account"
                  element={
                    <AccountSettings
                      user={user}
                      isDeletingAccount={isDeletingAccount}
                      handleDeleteAccount={handleDeleteAccount}
                      finishAccountDeletionRedirect={finishAccountDeletionRedirect}
                    />
                  }
                />
              )}
              <Route path="/grocery-lists/view/:groceryListId" element={<ViewGroceryList userId={user?.uid} setCheckedCount={setCheckedCount} setTotalItems={setTotalItems} setSpaceForFloatingButton={setSpaceForFloatingButton} setLastRemoteUpdateAt={setLastRemoteUpdateAt} onRemoteListUpdate={handleRemoteListUpdate} />} />
              
              <Route path="/recipes/view/:recipeId" element={<ViewRecipe userId={user?.uid} totalItems={totalItems} setCheckedCount={setCheckedCount} setTotalItems={setTotalItems} setSpaceForFloatingButton={setSpaceForFloatingButton} setLastRemoteUpdateAt={setLastRemoteUpdateAt} />} />
              <Route path="*" element={<QueryRedirectHandler user={user} isDeletingAccount={isDeletingAccount} />} />
            </Routes>
        </main>
        
        </BrowserRouter>
    </div>
  );
}

export default App;