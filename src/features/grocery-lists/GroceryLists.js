import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

import store from 'store2';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';

import { selectGroceryLists, fetchGroceryLists } from './slices/groceryListsSlice.ts';

import GroceryListItem from './components/GroceryListItem';
import DeleteModal from './components/DeleteModal.js';

function GroceryLists() {
  const [deleteModalID, setDeleteModalID] = useState(false);

  const groceryLists = useSelector((state) => selectGroceryLists(state));
  const dispatch = useDispatch();

  // initial load
  useEffect(() => {
    if (groceryLists.length === 0) {
      const storedGroceryLists = store('grocery-lists');

      if (storedGroceryLists) {
        dispatch(fetchGroceryLists(storedGroceryLists));
      } else {
        dispatch(fetchGroceryLists([]));
      }
    }
  }, []);

  return (
    <div>
      <NavLink
        to="/grocery-lists/add"
      >
        <button className="mb-4 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800">
          Add Grocery List <FontAwesomeIcon icon={faPlus} />
        </button>
      </NavLink>

      <section className="GroceryLists w-full space-y-4">
        {groceryLists.length === 0 ? (
          <div>No grocery lists found.</div>
        ) : (
          groceryLists.map((gl, i) => (
            <GroceryListItem key={gl.id+i} gl={gl} setDeleteModalID={setDeleteModalID} />
          ))
        )}
      </section>

      {deleteModalID && <DeleteModal deleteModalID={deleteModalID} setDeleteModalID={setDeleteModalID} />}
    </div>
  );
}

export default GroceryLists;