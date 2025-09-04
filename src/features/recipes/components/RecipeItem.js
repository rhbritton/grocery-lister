import React from 'react';
import { NavLink, useLinkClickHandler, useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';

import RecipeItemIngredients from './RecipeItemIngredients';

import '../styles/RecipeItem.css';

function RecipeItem(props) {
    const navigate = useNavigate();
    const handleClick = useLinkClickHandler(`/recipes/view/${props.recipe.id}`);

  return (
    <div onClick={handleClick} className="RecipeItem w-full bg-white p-6 rounded-lg shadow-md hover:bg-gray-50 active:bg-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
                {props.recipe.name}
            </h2>
            <div className="Actions flex">
                <button onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    navigate('/recipes/edit/'+props.recipe.id);
                }} className="py-2 px-4 rounded-md hover:text-white hover:bg-yellow-500 active:bg-yellow-600">
                    <FontAwesomeIcon icon={faPenToSquare} />
                </button>
                
                <button onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    props.setDeleteModalID(props.recipe.id);
                }} className="py-2 px-4 rounded-md hover:text-white hover:bg-red-500 active:bg-red-600">
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </div>
        </div>

        <RecipeItemIngredients ingredients={props.recipe.ingredients} />
    </div>
  );
}

export default RecipeItem;