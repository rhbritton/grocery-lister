import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

import { addGroceryList } from '../slices/groceryListsSlice.ts';

import store from 'store2';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import { fetchRecipes, selectRecipes, searchRecipes, getAllRecipes, getAllRecipesFromFirestore } from '../../recipes/slices/recipesSlice.ts';

import recipesConfig from '../../recipes/config.json';

import GroceryRecipeListItem from '../components/GroceryRecipeListItem.js';

const AddGroceryList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // const allRecipes = getAllRecipes();
  const { allRecipes } = useSelector(state => state.recipes);
  const recipeOptions = allRecipes && allRecipes.map((recipe) => ({
    value: recipe.id,
    label: recipe.name,
  }));

  useEffect(() => {
    if (!allRecipes || allRecipes.length === 0) {
        dispatch(getAllRecipesFromFirestore());
    }
  }, [dispatch, allRecipes]);

  let allRecipesById = {};
  allRecipes && allRecipes.forEach(function(r) {
    allRecipesById[r.id] = r;
  });


  const [recipes, setRecipes] = useState([]); // { id: nano(), recipe: {} }
  const [ingredients, setIngredients] = useState([]); // { amount: '', name: '', type: '', recipeId: '' }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { amount: '', name: '', type: '' }]);
  };

  const handleRemoveIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const handleRecipeChange = (index, field, value) => {
    const newRecipes = [...ingredients];
    newRecipes[index][field] = value;
    setIngredients(newRecipes);
  }

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const customIsZero = ingredients.length === 0;
  const customHasUnfilled = ingredients && ingredients.some(ingredient => ingredient.amount === "" || ingredient.name.trim() === "");
  
  const recipesAreZero = recipes.length === 0 || (recipes && recipes.every((r) => {
    return !r.recipe.ingredients.length;
  }));
  const recipesAreAllCrossed = recipes && recipes.every((r) => {
    return r.recipe.ingredients.every((ing) => {
      return ing.crossed;
    });
  });

  const isSaveDisabled = (customIsZero && recipesAreZero) || customHasUnfilled || (recipesAreAllCrossed && customIsZero);
  
  const handleSave = () => {
    if (!isSaveDisabled) {
      dispatch(addGroceryList({ id: nanoid(), recipes, ingredients, timestamp: (new Date()).getTime() }));
      setRecipes([]);
      setIngredients([]);
      
      navigate('/grocery-lists');
    }
  };

  const handleCancel = () => {
    setRecipes([]);
    setIngredients([]);

    navigate('/grocery-lists');
  };

  const typeOptions = [
    { value: '', label: 'Other' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'freezer', label: 'Freezer' },
    { value: 'meat', label: 'Meat' },
    { value: 'produce', label: 'Produce' },
  ]

  return (
    <div className="App-body p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Grocery List</h2>

      <div className="mb-4">
        <label className="block font-medium text-gray-700">Recipes:</label>
          <div className="space-x-2 mb-2">
            <Select
              isMulti
              options={recipeOptions}
              onChange={(selectedOptions) => {
                if (selectedOptions && selectedOptions.length) {
                  let updateSavedRecipes = [];
                  selectedOptions.forEach(function(option) {
                    let alreadySaved = recipes.some(function(savedRecipe) {
                      if (savedRecipe.id == option.value) {
                        updateSavedRecipes.push(savedRecipe)
                        return true;
                      }
                    });

                    if (!alreadySaved) {
                      updateSavedRecipes.push({ id: option.value, recipe: allRecipesById[option.value] })
                    }
                  });

                  setRecipes(updateSavedRecipes);
                } else {
                  setRecipes([]);
                }
              }}
            />
          </div>
      </div>

      <ul className="recipesList">
        {recipes.map((r, i) => (
          <GroceryRecipeListItem key={r.recipe.id+i} recipe={r} setRecipes={setRecipes} recipes={recipes} />
        ))}
      </ul>

      <div className="mb-4">
        <label className="block font-medium text-gray-700">Custom List Items:</label>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex items-center space-x-2 mb-8">
            {/* Left container takes up most of the space */}
            <div className="flex-grow flex flex-col space-y-2">
              {/* Top container with Amount and Select inputs */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Amount"
                  className="w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={ingredient.amount}
                  onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                />
                <Select
                  className="w-50 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                  options={typeOptions}
                  onChange={(selectedOption) => {
                    handleIngredientChange(index, 'type', selectedOption.value);
                  }}
                />
              </div>

              {/* Bottom container with Ingredient input */}
              <div className="flex">
                <input
                  type="text"
                  placeholder="Ingredient"
                  className="flex-grow border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                />
              </div>
            </div>

            {/* Right container with the delete button, vertically centered */}
            <div>
              <button
                type="button"
                onClick={() => handleRemoveIngredient(index)}
                className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
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

export default AddGroceryList;