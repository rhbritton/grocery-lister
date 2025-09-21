import React from 'react';
import { NavLink, useLinkClickHandler, useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';

import { formatDate, formatTime } from '../../../services/date.js';

import '../styles/GroceryListItem.css';

const groceryListRecipeSeparator = ', ';

// function formatDate(date) {
//     const options = { year: 'numeric', month: 'long', day: 'numeric' };
//     return date.toLocaleDateString(undefined, options);
// }

// function formatTime(date) {
//     const options = { hour: 'numeric', minute: 'numeric', second: 'numeric'};
//     return date.toLocaleTimeString(undefined, options);
// }

function GroceryListItem(props) {
    const navigate = useNavigate();
    const handleClick = useLinkClickHandler(`/grocery-lists/view/${props.gl.fbid}`);

    return (
        <div onClick={handleClick} className="GroceryListItem w-full bg-white p-6 rounded-lg shadow-md hover:bg-gray-50 active:bg-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">{formatDate(new Date(props.gl.timestamp)) + ' - ' + formatTime(new Date(props.gl.timestamp))}</h2>
                <div className="Actions flex">
                    {/* <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }} className="py-2 px-4 rounded-md hover:bg-gray-200 active:bg-gray-400">
                        <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                    <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }} className="py-2 px-4 rounded-md hover:bg-gray-200 active:bg-gray-400">
                        <FontAwesomeIcon icon={faTrash} />
                    </button> */}
                    <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        props.setDeleteModalID(props.gl.fbid);
                    }} className="py-2 px-4 rounded-md hover:text-white hover:bg-red-500 active:bg-red-600">
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            </div>

            <div className="GroceryListRecipes text-left">
                {props.gl.recipes.map((r, i) => {
                    return <span key={r.recipe.fbid} className="GroceryListRecipe">
                        {r.recipe.name}
                        {i+1 < props.gl.recipes.length && groceryListRecipeSeparator}
                    </span>;
                })}
            </div>
        </div>
    );
}

export default GroceryListItem;