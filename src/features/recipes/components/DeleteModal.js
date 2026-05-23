import React from 'react';
import { useDispatch } from 'react-redux';

import { deleteRecipeFromFirestore } from '../slices/recipesSlice.ts';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal.js';

function DeleteModal(props) {
  const dispatch = useDispatch();

  return (
    <DeleteConfirmModal
      title="Delete recipe?"
      message="This recipe will be permanently removed from your collection."
      confirmLabel="Delete recipe"
      onCancel={() => props.setDeleteModalID(false)}
      onConfirm={() => {
        dispatch(deleteRecipeFromFirestore(props.deleteModalID));
        props.setDeleteModalID(false);
      }}
    />
  );
}

export default DeleteModal;
