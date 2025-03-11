import React, { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSquare, faSquareCheck } from '@fortawesome/free-solid-svg-icons';

function GroceryRecipeListItem(props) {
    const recipe = props.recipe;
    const recipes = props.recipes;
    const setRecipes = props.setRecipes;

    const toggleIngredient = (ingredientIndex, cross) => {
        let updateRecipes = [];
        recipes.forEach(function(r, i) {
            let newR = r;
            if (r.id === recipe.id)
                newR.recipe.ingredients[ingredientIndex].crossed = cross;

            updateRecipes.push(newR)
        });

        setRecipes(updateRecipes);
    }

    const ingredientTextCrossedStyle = {
        textDecoration: 'line-through',
        opacity: 0.4
    };

    return (
        <div className="GroceryRecipeListItem mb-4">
            <label>
                {recipe.recipe.name}
            </label>
            {recipe && recipe.recipe && recipe.recipe.ingredients && recipe.recipe.ingredients.map((ingredient, index) => (
                <div key={recipe.recipe.id+ingredient.name+index} className="GroceryRecipeListItemIngredient flex space-x-2 mb-2">
                    <span style={ingredient.crossed ? ingredientTextCrossedStyle : {}}
                        className="IngredientAmount text-left w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {ingredient.amount}
                    </span>

                    <span style={ingredient.crossed ? ingredientTextCrossedStyle : {}}
                        className="IngredientName text-left flex-grow border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {ingredient.name}
                    </span>

                    <span style={ingredient.crossed ? ingredientTextCrossedStyle : {}}
                        className="IngredientType text-left w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {ingredient.type}
                    </span>

                    <button
                        type="button"
                        onClick={() => toggleIngredient(index, !ingredient.crossed)}
                        className="px-3 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                    >
                        <FontAwesomeIcon icon={ingredient.crossed ? faSquareCheck : faSquare} />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default GroceryRecipeListItem;