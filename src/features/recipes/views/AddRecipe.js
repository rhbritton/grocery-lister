import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

import { addRecipe } from '../slices/recipesSlice.ts';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import recipesConfig from '../config.json';

const AddRecipe = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([{ amount: '', name: '', type: '' }]);
  const [instructions, setInstructions] = useState('');

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { amount: '', name: '', type: '' }]);
  };

  const handleRemoveIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const handleSave = () => {
    if (name.trim() !== '' && ingredients.length > 0 && ingredients.every(ingredient => ingredient.amount !== "" && ingredient.name.trim() !== "")) {
      dispatch(addRecipe({ name, ingredients, instructions }));
      setName('');
      setIngredients([{ amount: '', name: '', type: '' }]);
      setInstructions('');
      
      navigate('/recipes');
    }
  };

  const handleCancel = () => {
    setName('');
    setIngredients([{ amount: '', name: '', type: '' }]);
    setInstructions('');

    navigate('/recipes');
  };

  const isSaveDisabled = name.trim() === '' || ingredients.length === 0 || ingredients.some(ingredient => ingredient.amount === "" || ingredient.name.trim() === "");

  const options = recipesConfig.recipes.map((recipe, index) => ({
    value: index,
    label: recipe.name,
  }));

  const typeOptions = [
    { value: '', label: 'Other'  },
    { value: 'dairy', label: 'Dairy' },
    { value: 'freezer', label: 'Freezer' },
    { value: 'meat', label: 'Meat' },
    { value: 'produce', label: 'Produce' },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Recipe</h2>
      
      <div className="mb-4">
        <label htmlFor="recipeName" className="block font-medium text-gray-700">
          Prefill With Pre-Built Recipe:
        </label>
        <Select
          options={options}
          onChange={(selectedOption) => {
            if (selectedOption) {
              const recipeIndex = selectedOption.value;
              const recipe = recipesConfig.recipes[recipeIndex];
              setName(recipe.name);
              setIngredients(recipe.ingredients);
              setInstructions(recipe.instructions);
            } else {
              // Clear the form if no option is selected
              setName('');
              setIngredients([]);
              setInstructions('');
            }
          }}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="recipeName" className="block font-medium text-gray-700">
          Recipe Name:
        </label>
        <input
          type="text"
          id="recipeName"
          className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium text-gray-700">Ingredients:</label>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <input
              type="text"
              placeholder="Amount"
              className="w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={ingredient.amount}
              onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
            />
            <input
              type="text"
              placeholder="Ingredient"
              className="flex-grow border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={ingredient.name}
              onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
            />
            <Select
              className="w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
              options={typeOptions}
              onChange={(selectedOption) => {
                handleIngredientChange(index, 'type', selectedOption.value);
              }}
            />

            <button
              type="button"
              onClick={() => handleRemoveIngredient(index)}
              className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddIngredient}
          className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
        >
          Add Ingredient
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="instructions" className="block font-medium text-gray-700">
          Instructions:
        </label>
        <textarea 
          id="instructions" 
          className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)} 
          rows={4} 
        />
      </div>

      <div className="flex justify-end space-x-4 sticky bottom-0 bg-white p-6 rounded-b-lg shadow-md">
        <button onClick={handleCancel} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className={`px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default AddRecipe;