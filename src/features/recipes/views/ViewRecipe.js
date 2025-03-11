import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, NavLink } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { fetchRecipeById } from '../slices/recipeSlice.ts';
import { editRecipe } from '../slices/recipesSlice.ts';

const ViewRecipe = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([{ amount: '', name: '' }]);
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
    setIngredients([...ingredients, { amount: '1', name: '' }]);
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
      dispatch(editRecipe({ recipeId, name, ingredients }));
      setName('');
      setIngredients([{ amount: '', name: '' }]);
      setInstructions('');
      
      navigate('/recipes');
    }
  };

  const handleCancel = () => {
    setName('');
    setIngredients([{ amount: '', name: '' }]);
    setInstructions('');

    navigate('/recipes');
  };

  const isSaveDisabled = name.trim() === '' || ingredients.length === 0 || ingredients.some(ingredient => ingredient.amount === "" || ingredient.name.trim() === "");

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex">
            <h2 className="text-left w-1/2 text-xl font-semibold text-gray-700 mb-4">
                <NavLink 
                    to={`/recipes`}
                    className="p-2 hover:text-blue-500"
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                </NavLink>
                {name}
            </h2>
            <div className="text-right w-1/2">
                <NavLink 
                    to={`/recipes/edit/${recipeId}`}
                    className="text-right mb-4 px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-800"
                >Edit</NavLink>
            </div>
        </div>
        <div className="flex">

            <div className="w-2/5 mr-4 overflow-y-auto">
                <div className="mb-4">
                    <label className="block text-left font-medium text-gray-700">Ingredients:</label>
                    <ul className="text-left w-full rounded-md px-3 py-2 mt-1" 
                        style={{ 
                            backgroundColor: '#f7f7f7', 
                            padding: '10px', 
                            borderRadius: '4px' 
                        }}> 
                        {ingredients.map((ingredient, index) => (
                        <li key={index} className="flex space-x-2 mb-2">
                            - {ingredient.amount} {ingredient.name}
                        </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="w-3/5 overflow-y-auto"> 
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