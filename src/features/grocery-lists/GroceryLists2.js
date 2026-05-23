import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { faPlus, faClipboardList } from '@fortawesome/free-solid-svg-icons';

import GroceryListItem from './components/GroceryListItem2.js';
import DeleteModal from './components/DeleteModal.js';
import EmptyState from '../../components/EmptyState.js';
import FabButton from '../../components/FabButton.js';
import BottomNav from '../../components/BottomNav.js';

function GroceryLists(props) {
  const [deleteModalID, setDeleteModalID] = useState(false);

  const { groceryLists } = useSelector(state => state.groceryLists);

  useEffect(() => {
      props.setSpaceForFloatingButton && props.setSpaceForFloatingButton('mb-20');
  }, [props]);

  return (
    <>
      <main className="page-main pb-nav-clear">
        <div className="space-y-4">
          {groceryLists && groceryLists.length ? groceryLists.map((gl) => (
            <GroceryListItem key={`${gl.fbid}_${gl.updatedAt}`} gl={gl} setDeleteModalID={setDeleteModalID} />
          )) : (
            <EmptyState
              icon={faClipboardList}
              title="No grocery lists yet"
              description="Create a list from your recipes and start shopping."
              actionLabel="Create a list"
              actionTo="/grocery-lists/add"
            />
          )}
        </div>
      </main>

      <FabButton to="/grocery-lists/add" icon={faPlus} label="Create grocery list" />

      <BottomNav active="grocery-lists" />

      {deleteModalID && <DeleteModal deleteModalID={deleteModalID} setDeleteModalID={setDeleteModalID} />}
    </>
  );
}

export default GroceryLists;
