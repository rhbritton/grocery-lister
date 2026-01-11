import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

import { getAuth } from 'firebase/auth';

import store from 'store2';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBook, faClipboardList } from '@fortawesome/free-solid-svg-icons';

import { selectGroceryLists, fetchGroceryLists, getGroceryListsFromFirestore } from './slices/groceryListsSlice.ts';

import GroceryListItem from './components/GroceryListItem2.js';
import DeleteModal from './components/DeleteModal.js';

function GroceryLists(props) {
  const { user } = props;
  const userId = user.uid;

  const [deleteModalID, setDeleteModalID] = useState(false);
  const [hasLoadedGroceryLists, setHasLoadedGroceryLists] = useState(false);

  const { allGroceryListsSorted } = useSelector(state => state.groceryLists);
  const dispatch = useDispatch();

  useEffect(() => {
      props.setSpaceForFloatingButton && props.setSpaceForFloatingButton('mb-20');
  }, []);

  // const loadMore = () => {
  //   if (status === 'loading') {
  //     console.log('Already loading. Aborting.');
  //     return;
  //   }
    
  //   if (lastVisibleSearch === undefined) {
  //     console.log('No more grocery lists to load.');
  //     return;
  //   }
    
  //   dispatch(getGroceryListsFromFirestore({ 
  //     userId, 
  //     existingGroceryLists: groceryLists,
  //   }));
  // };

  // const observerTargetRef = useRef(null);
  // const [isCooldown, setIsCooldown] = useState(false);

  // useEffect(() => {
  //   if (allGroceryListsGrabbed) return;

  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       if (entries[0].isIntersecting && !isCooldown && status !== 'loading') {
  //         setIsCooldown(true);

  //         setTimeout(() => {
  //           loadMore();

  //           setTimeout(() => {
  //             setIsCooldown(false);
  //           }, 1500);
  //         }, 300);
  //       }
  //     },
  //     {
  //       root: null,
  //       rootMargin: '0px',
  //       threshold: 0.1,
  //     }
  //   );

  //   const target = observerTargetRef.current;
  //   if (target) observer.observe(target);

  //   return () => {
  //     if (target) observer.unobserve(target);
  //   };
  // }, [loadMore, allGroceryListsGrabbed, isCooldown, status]);

  // useEffect(() => {
  //   if (status === 'idle' && groceryLists && groceryLists.length === 0) {
  //     dispatch(getGroceryListsFromFirestore({ resetPagination: true, userId }));
  //   }
  // }, [dispatch, status, groceryLists.length, userId]);

  // useEffect(() => {
  //   if (!hasLoadedGroceryLists) {
  //     dispatch(getGroceryListsFromFirestore(userId));
  //     setHasLoadedGroceryLists(true);
  //   }
  // }, [dispatch]);

  // let loadDisplay = status === 'loading' ? 'Loading...' : 'Load More';

  return (
    <>
      <main className="max-w-xl mx-auto p-6">
        <div className="space-y-4">
          {allGroceryListsSorted && allGroceryListsSorted.length ? allGroceryListsSorted.map((gl, i) => (
            <GroceryListItem key={gl.fbid+i} gl={gl} setDeleteModalID={setDeleteModalID} />
          )) : <div>No grocery lists found.</div>}
        </div>
      </main>

      <NavLink
        to="/grocery-lists/add"
        className="fixed bottom-24 right-6 z-50"
      >
        <button className="w-16 h-16 rounded-2xl bg-blue-500 text-white shadow-lg text-3xl flex items-center justify-center hover:bg-blue-600 active:bg-blue-800 transition-colors">
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </NavLink>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-stretch h-20 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <NavLink 
              to={`/`}
              className="flex-1 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200"
          >
              <FontAwesomeIcon icon={faBook} className="text-xl mb-1" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Recipes</span>
          </NavLink>

          <button className="flex-1 flex flex-col items-center justify-center bg-[#1976D2] text-white transition-all duration-200 group">
              <FontAwesomeIcon icon={faClipboardList} className="text-xl mb-1" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Grocery Lists</span>
          </button>
      </nav>

      {deleteModalID && <DeleteModal deleteModalID={deleteModalID} setDeleteModalID={setDeleteModalID} />}
    </>
  );
}

export default GroceryLists;