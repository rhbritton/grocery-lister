import React from 'react';
import { useDispatch } from 'react-redux';

import { deleteGroceryListFromFirestore } from '../slices/groceryListsSlice.ts';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal.js';

function DeleteModal(props) {
  const dispatch = useDispatch();

  return (
    <DeleteConfirmModal
      title="Delete grocery list?"
      message="This list and all its items will be permanently removed. This can't be undone."
      confirmLabel="Delete list"
      onCancel={() => props.setDeleteModalID(false)}
      onConfirm={() => {
        dispatch(deleteGroceryListFromFirestore(props.deleteModalID));
        props.setDeleteModalID(false);
      }}
    />
  );
}

export default DeleteModal;
