import React, { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSquare, faSquareCheck, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

function GroceryRecipeListItem(props) {
    const recipe = props.recipe;
    const recipes = props.recipes;
    const setRecipes = props.setRecipes;

    // const [recipeDuplicateCount, setRecipeDuplicateCount] = useState(recipe.recipe.quantity || 1);

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

    const updateRecipeIngredients = (recipe_id, ingredients) => {
        let updateRecipes = [];
        recipes.forEach(function(r, i) {
            let newR = r;
            if (r.id === recipe_id)
                newR.recipe.ingredients = ingredients;

            updateRecipes.push(newR)
        });

        setRecipes(updateRecipes);
    }

    const updateRecipeDuplicateCount = (recipe_id, duplicateCount) => {
        let updateRecipes = [];
        recipes.forEach(function(r, i) {
            let newR = r;
            if (r.id === recipe_id)
                newR.recipe.duplicateCount = duplicateCount;

            updateRecipes.push(newR)
        });

        setRecipes(updateRecipes);
    }

    const getOrigIngredients = (duplicate) => {
        let originalIngredients = [];
        recipe.recipe.ingredients.forEach((ingredient) => {
            if (ingredient.duplicate === undefined)
                originalIngredients.push({ duplicate, ...ingredient})
        });

        return originalIngredients;
    }

    const handleDuplication = (recipe, diff) => {
        if (diff == 1) {
            let originalIngredients = getOrigIngredients((recipe.duplicateCount || 1)+1);
            // setRecipeDuplicateCount(recipeDuplicateCount+1);
            let newIngredients = [];
            recipe.ingredients.forEach(function(ingredient) {
                newIngredients.push(ingredient)
            });
            newIngredients = newIngredients.concat(originalIngredients);

            updateRecipeIngredients(recipe.id, newIngredients);
            updateRecipeDuplicateCount(recipe.id, (recipe.duplicateCount || 1)+1);
        }

        if (diff == -1 && recipe.duplicateCount > 1) {
            let newIngredients = [];
            recipe.ingredients.forEach(function(ingredient) {
                if (ingredient.duplicate != recipe.duplicateCount)
                    newIngredients.push(ingredient)
            });

            updateRecipeIngredients(recipe.id, newIngredients);
            updateRecipeDuplicateCount(recipe.id, (recipe.duplicateCount || 1)-1);
        }
    }

    const ingredientTextCrossedStyle = {
        textDecoration: 'line-through',
        opacity: 0.4
    };

    return (
        <div className="GroceryRecipeListItem mb-4">
            <div className="flex items-center mb-2">
                <label className="text-lg font-semibold mr-4">
                    {recipe.recipe.name}
                </label>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        disabled={!recipe.recipe.duplicateCount || recipe.recipe.duplicateCount <= 1 ? true : false}
                        onClick={() => handleDuplication(recipe.recipe, -1)}
                        className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        <FontAwesomeIcon icon={faMinus} />
                    </button> 
                    <span className="text-gray-700 font-medium">
                        (x{recipe.recipe.duplicateCount || 1})
                    </span>
                    <button
                        type="button"
                        onClick={() => handleDuplication(recipe.recipe, 1)}
                        className="px-2 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </div>
            </div>
            {recipe && recipe.recipe && recipe.recipe.ingredients && recipe.recipe.ingredients.map((ingredient, index) => (
                <div key={recipe.recipe.id + ingredient.name + index} className="flex flex-col">
                    {
                        ingredient.duplicate && 
                        ingredient.duplicate !== recipe.recipe.ingredients[index - 1]?.duplicate &&
                        <label className="text-lg text-left font-semibold mr-4">
                            x{ingredient.duplicate}
                        </label>
                    }
                    <div className="GroceryRecipeListItemIngredient flex space-x-2 mb-2">
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
                </div>
            ))}
        </div>
    );
}

export default GroceryRecipeListItem;