import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, NavLink } from 'react-router-dom';

import EditIngredient from '../components/EditIngredient';

import { fetchRecipeById } from '../slices/recipeSlice.ts';
import { editRecipe, editRecipeFromFirestore } from '../slices/recipesSlice.ts';

const EditRecipe = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([{ amount: '', name: '', type: '' }]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        let recipe = (await dispatch(fetchRecipeById(recipeId))).payload;

        if (recipe) {
          setName(recipe.name || '');
          setIngredients(recipe.ingredients || []);
          setInstructions(recipe.instructions || '');
        }

      } catch (error) {
        console.error("Error fetching recipe:", error);
      }
    }

    fetchData();
  }, [dispatch, recipeId]);



  const handleAddIngredient = () => {
    setIngredients([...ingredients, { amount: '1', name: '', type: '' }]);
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
      dispatch(editRecipeFromFirestore({ fbid: recipeId, name, ingredients, instructions }));
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

  const typeOptions = [
    { value: '', label: 'Other'  },
    { value: 'dairy', label: 'Dairy' },
    { value: 'freezer', label: 'Freezer' },
    { value: 'meat', label: 'Meat' },
    { value: 'produce', label: 'Produce' },
  ];

  const findSelectedOption = (value) => {
    let selectedOption;
    typeOptions.some((opt) => {
      if (opt.value == value) {
        selectedOption = opt;
        return true;
      }
    });

    return selectedOption;
  };

  return (
    <div className="App-body p-6 bg-white rounded-lg shadow-md">
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
          <EditIngredient 
            key={index}
            ingredient={ingredient} 
            index={index} 
            typeOptions={typeOptions}
            handleIngredientChange={handleIngredientChange}
            handleRemoveIngredient={handleRemoveIngredient}
            findSelectedOption={findSelectedOption}
          />
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

export default EditRecipe;