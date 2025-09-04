import React, { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSquare, faSquareCheck } from '@fortawesome/free-solid-svg-icons';

import { findSelectedOption } from '../../recipes/slices/recipeSlice.ts';

function GroceryListSharedViewItem(props) {
    const allIngredientsIndex = props.allIngredientsIndex;
    const allIngredients = props.allIngredients;

    const ingredientIndex = props.ingredient.index;
    const ingredient = props.ingredient.ingredient;
    const recipe = props.ingredient.recipe;

    const groceryList = props.groceryList;

    const toggleIngredient = (cross) => {
        const updatedIngredients = allIngredients.map((ing, index) => {
            if (index === allIngredientsIndex)
                return { ...ing, crossed: cross };

            return ing;
        });
        props.setAllIngredients(updatedIngredients);

        if (props.ingredient.recipe) {
            let updateRecipes = [];
            groceryList.recipes.forEach(function(r, i) {
                if (r.id == props.ingredient.recipe.id) {
                    let newRecipe = { ...r };
                    newRecipe.recipe.ingredients[ingredientIndex].crossed = cross;
                    updateRecipes.push(newRecipe);
                } else {
                    updateRecipes.push(r)
                }
            });

            let newGroceryList = {...props.groceryList};
            newGroceryList.recipes = updateRecipes;
            props.setGroceryList(newGroceryList);
        } else {
            let updateIngredients = [];
            groceryList.ingredients.forEach(function(ing, i) {
                if (i == ingredientIndex) {
                    updateIngredients.push({ ...ing, crossed: cross })
                } else {
                    updateIngredients.push(ing)
                }
            });
            
            let newGroceryList = {...props.groceryList};
            newGroceryList.ingredients = updateIngredients;
            props.setGroceryList(newGroceryList);
        }
    }

    const ingredientTextCrossedStyle = {
        textDecoration: 'line-through',
        opacity: 0.4
    };

    return (
        <div className="GroceryListSharedViewItem flex space-x-2 mb-2">
            <span style={props.ingredient.crossed ? ingredientTextCrossedStyle : {}}
                className="IngredientAmount text-left w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ingredient.amount}
            </span>

            <span style={props.ingredient.crossed ? ingredientTextCrossedStyle : {}}
                className="IngredientName text-left flex-grow border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ingredient.name}
            </span>

            {/* <span style={props.ingredient.crossed ? ingredientTextCrossedStyle : {}}
                className="IngredientType text-left w-24 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {   (
                        ingredient.type && 
                        findSelectedOption(ingredient.type) && 
                        findSelectedOption(ingredient.type).label
                    ) || "Other"
                }
            </span> */}

            <button
                type="button"
                onClick={() => toggleIngredient(!props.ingredient.crossed)}
                className="px-3 rounded-md bg-blue-500 text-white hover:bg-blue-600"
            >
                <FontAwesomeIcon icon={props.ingredient.crossed ? faSquareCheck : faSquare} />
            </button>
        </div>
    );
}

export default GroceryListSharedViewItem;