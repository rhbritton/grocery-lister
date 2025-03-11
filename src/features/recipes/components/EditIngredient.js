import React, { useState } from 'react';

import Select from 'react-select';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

function EditIngredient(props) {
  return (
    <div key={props.index} className="flex space-x-2 mb-2">
        <input
            type="text"
            placeholder="Amount"
            className="w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={props.ingredient.amount}
            onChange={(e) => props.handleIngredientChange(props.index, 'amount', e.target.value)}
        />
        <input
            type="text"
            placeholder="Ingredient"
            className="flex-grow border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={props.ingredient.name}
            onChange={(e) => props.handleIngredientChange(props.index, 'name', e.target.value)}
        />
        <Select
            className="w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
            value={props.findSelectedOption(props.ingredient.type)}
            options={props.typeOptions}
            onChange={(selectedOption) => {
                props.handleIngredientChange(props.index, 'type', selectedOption.value);
            }}
        />
        <button
            type="button"
            onClick={() => props.handleRemoveIngredient(props.index)}
            className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
        >
            <FontAwesomeIcon icon={faTrash} />
        </button>
    </div>
  );
}

export default EditIngredient;