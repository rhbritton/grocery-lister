import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate, NavLink } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faShareAlt, faPen } from '@fortawesome/free-solid-svg-icons';

import { fetchRecipeById } from '../slices/recipeSlice.ts';

import '../styles/ViewRecipe.css';

const ViewRecipe = (props) => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [owner, setOwner] = useState('');
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [focusedColumn, setFocusedColumn] = useState('instructions');
  const [shareFeedback, setShareFeedback] = useState('');

  const shareURL = async () => {
    const fullUrl = `${window.location.origin}${props.basename}?recipe=${recipeId}`;

    const shareData = {
        title: `Recipe: ${name}`,
        text: 'Check out this recipe!',
        url: fullUrl,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            setShareFeedback('URL shared successfully!');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
                setShareFeedback('Failed to share.');
            }
        }
    } else if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setShareFeedback('Link copied to clipboard! 📋');
        } catch (err) {
            console.error('Failed to copy link:', err);
            setShareFeedback('Could not copy link. Please copy manually.');
        }
    } else {
        prompt('Copy this link to share:', fullUrl);
        setShareFeedback('Please copy the URL from the prompt.');
    }

    setTimeout(() => setShareFeedback(''), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let recipe = (await dispatch(fetchRecipeById(recipeId))).payload;

        if (recipe) {
          setName(recipe.name || '');
          setIngredients(recipe.ingredients || []);
          setInstructions(recipe.instructions || '');
          setOwner(recipe.userId || '');
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
    <div>
      {!props.userId && props.Header}
    <div className="ViewRecipe p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-left w-1/2 text-xl font-semibold text-gray-700 mb-4">
            {props.userId && <NavLink 
                to={`/recipes`}
                className="p-2 hover:text-blue-500"
            >
                <FontAwesomeIcon icon={faArrowLeft} />
            </NavLink>}
            {name}
        </h2>
        <div className="text-right w-1/2">
            {props.userId && <NavLink 
                onClick={shareURL}
                className="text-right mb-4 mr-2 px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 active:bg-yellow-800"
            >
                <FontAwesomeIcon icon={faShareAlt} />
                <span> Share</span>
            </NavLink>}
            {owner && props.userId === owner && <NavLink 
                to={`/recipes/edit/${recipeId}`}
                className="text-right mb-4 px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-800"
            >
                <FontAwesomeIcon icon={faPen} />
                <span> Edit</span>
            </NavLink>}
        </div>
      </div>

      <div className="App-body flex space-x-4 h-[calc(100vh-200px)]">
        <div 
          onClick={() => handleColumnClick('ingredients')}
          className={ingredientColumnClasses}
          style={{ overflowY: 'auto' }}
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

        <div 
          onClick={() => handleColumnClick('instructions')}
          className={instructionColumnClasses}
          style={{ overflowY: 'auto' }}
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
    
    </div>
  );
};

export default ViewRecipe;