import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate, NavLink } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { fetchRecipeById } from '../slices/recipeSlice.ts';

const ViewRecipe = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [focusedColumn, setFocusedColumn] = useState('instructions');

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
    };

    fetchData();
  }, [dispatch, recipeId]);

  const handleColumnClick = (columnName) => {
    setFocusedColumn(columnName);
  };

  const ingredientColumnClasses = `
    transition-all duration-500 ease-in-out cursor-pointer
    ${focusedColumn === 'ingredients' ? 'w-4/5' : 'w-1/5'}
  `;

  const instructionColumnClasses = `
    transition-all duration-500 ease-in-out cursor-pointer
    ${focusedColumn === 'instructions' ? 'w-4/5' : 'w-1/5'}
  `;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          <NavLink 
            to="/recipes"
            className="p-2 hover:text-blue-500"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </NavLink>
          {name}
        </h2>
        <NavLink 
          to={`/recipes/edit/${recipeId}`}
          className="px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-800"
        >
          Edit
        </NavLink>
      </div>

      <div className="flex space-x-4 h-[calc(100vh-200px)]">
        {/* Ingredients Column */}
        <div 
          onClick={() => handleColumnClick('ingredients')}
          className={ingredientColumnClasses}
          style={{ overflowY: focusedColumn === 'ingredients' ? 'auto' : 'hidden' }}
        >
          <div className="mb-4">
            <label className="block text-left font-medium text-gray-700">
              Ingredients:
            </label>
            <ul 
              className="text-left w-full rounded-md px-3 py-2 mt-1" 
              style={{ 
                backgroundColor: '#f7f7f7', 
                padding: '10px', 
                borderRadius: '4px' 
              }}
            > 
              {ingredients.map((ingredient, index) => (
                <li key={index} className="flex space-x-2 mb-2">
                  - {ingredient.amount} {ingredient.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Instructions Column */}
        <div 
          onClick={() => handleColumnClick('instructions')}
          className={instructionColumnClasses}
          style={{ overflowY: focusedColumn === 'instructions' ? 'auto' : 'hidden' }}
        >
          <div className="mb-4">
            <label htmlFor="instructions" className="block text-left font-medium text-gray-700">
              Instructions:
            </label>
            <div 
              className="text-left w-full rounded-md px-3 py-2 mt-1" 
              style={{ 
                backgroundColor: '#f7f7f7', 
                padding: '10px', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap'
              }}
            >
              {instructions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewRecipe;