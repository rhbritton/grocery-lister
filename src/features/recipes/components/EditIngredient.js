import React, { useState } from 'react';

import Select from 'react-select';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

function EditIngredient(props) {
  return (
    <div key={props.index} className="flex items-center space-x-2 mb-8">
        {/* Left container takes up most of the space */}
        <div className="flex-grow flex flex-col space-y-2">
            {/* Top container with Amount and Select inputs */}
            <div className="flex space-x-2">
            <input
                type="text"
                placeholder="Amount"
                className="w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={props.ingredient.amount}
                onChange={(e) => props.handleIngredientChange(props.index, 'amount', e.target.value)}
            />
            <Select
                className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={props.findSelectedOption(props.ingredient.type)}
                options={props.typeOptions}
                onChange={(selectedOption) => {
                props.handleIngredientChange(props.index, 'type', selectedOption.value);
                }}
            />
            </div>

            {/* Bottom container with Ingredient input */}
            <div>
            <input
                type="text"
                placeholder="Ingredient"
                className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={props.ingredient.name}
                onChange={(e) => props.handleIngredientChange(props.index, 'name', e.target.value)}
            />
            </div>
        </div>

        {/* Right container with the delete button, vertically centered */}
        <div>
            <button
            type="button"
            onClick={() => props.handleRemoveIngredient(props.index)}
            className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
            >
            <FontAwesomeIcon icon={faTrash} />
            </button>
        </div>
        </div>
  );
}

export default EditIngredient;