import React from 'react';
import { useDispatch } from 'react-redux';

import { useNavigate } from 'react-router-dom';

import { deleteRecipe, deleteRecipeFromFirestore } from '../slices/recipesSlice.ts';

function DeleteModal(props) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

  return (
    <div 
      className="DeleteModal fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
      onClick={(e) => {
            e.stopPropagation();
            props.setDeleteModalID(false)
        }}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg"
        onClick={(e) => {
            e.stopPropagation();
        }}
      >
        <h2 className="text-lg font-bold mb-4">Delete Recipe</h2>
        <p className="mb-6">Are you sure you want to delete this recipe?</p>
        <div className="flex justify-end">
          <button 
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            onClick={(e) => {
                e.stopPropagation();
                props.setDeleteModalID(false);
            }}
          >
            Cancel
          </button>
          <button 
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={(e) => {
                e.stopPropagation();
                
                // dispatch(deleteRecipe({ recipeId: props.deleteModalID }));
                dispatch(deleteRecipeFromFirestore(props.deleteModalID));
                props.setDeleteModalID(false);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;