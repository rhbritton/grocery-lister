import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

import { getAuth } from 'firebase/auth';

import store from 'store2';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';

import { selectGroceryLists, fetchGroceryLists, getGroceryListsFromFirestore } from './slices/groceryListsSlice.ts';

import GroceryListItem from './components/GroceryListItem';
import DeleteModal from './components/DeleteModal.js';

function GroceryLists(props) {
  const { user } = props;
  const userId = user.uid;

  const [deleteModalID, setDeleteModalID] = useState(false);
  const [hasLoadedGroceryLists, setHasLoadedGroceryLists] = useState(false);

  const { groceryLists, status, lastVisibleSearch, allGroceryListsGrabbed } = useSelector(state => state.groceryLists);
  const dispatch = useDispatch();

  const loadMore = () => {
    if (status === 'loading') {
      console.log('Already loading. Aborting.');
      return;
    }
    
    if (lastVisibleSearch === undefined) {
      console.log('No more grocery lists to load.');
      return;
    }
    
    dispatch(getGroceryListsFromFirestore({ 
      userId, 
      existingGroceryLists: groceryLists,
    }));
  };

  const observerTargetRef = useRef(null);
  const [isCooldown, setIsCooldown] = useState(false);

  useEffect(() => {
    if (allGroceryListsGrabbed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isCooldown && status !== 'loading') {
          setIsCooldown(true);

          setTimeout(() => {
            loadMore();

            setTimeout(() => {
              setIsCooldown(false);
            }, 1500);
          }, 300);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    const target = observerTargetRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [loadMore, allGroceryListsGrabbed, isCooldown, status]);

  useEffect(() => {
    if (status === 'idle' && groceryLists && groceryLists.length === 0) {
      dispatch(getGroceryListsFromFirestore({ resetPagination: true, userId }));
    }
  }, [dispatch, status, groceryLists.length, userId]);

  // useEffect(() => {
  //   if (!hasLoadedGroceryLists) {
  //     dispatch(getGroceryListsFromFirestore(userId));
  //     setHasLoadedGroceryLists(true);
  //   }
  // }, [dispatch]);

  let loadDisplay = status === 'loading' ? 'Loading...' : 'Load More';

  return (
    <div>
      <NavLink
        to="/grocery-lists/add"
        className="fixed bottom-6 right-6 z-50"
      >
        <button className="w-16 h-16 rounded-2xl bg-blue-500 text-white shadow-lg text-3xl flex items-center justify-center hover:bg-blue-600 active:bg-blue-800 transition-colors">
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </NavLink>

      <section className="App-body GroceryLists w-full space-y-4 pb-20">
        {groceryLists && groceryLists.length ? groceryLists.map((gl, i) => (
          <GroceryListItem key={gl.fbid+i} gl={gl} setDeleteModalID={setDeleteModalID} />
        )) : (status !== 'loading' && <div>No grocery lists found.</div>)}

        {status === 'loading' ? <div>Loading...</div> : (!allGroceryListsGrabbed && <div onClick={loadMore}>Load More</div>)}

        {!allGroceryListsGrabbed && (
          <div
            ref={observerTargetRef}
            style={{ height: '1px' }}
          />
        )}
      </section>

      {deleteModalID && <DeleteModal deleteModalID={deleteModalID} setDeleteModalID={setDeleteModalID} />}
    </div>
  );
}

export default GroceryLists;