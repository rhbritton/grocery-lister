import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, NavLink, useSearchParams } from 'react-router-dom';

import pako from 'pako';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { fetchGroceryListById } from '../slices/groceryListSlice.ts';
import { editGroceryList } from '../slices/groceryListsSlice.ts';

import { formatDate, formatTime } from '../../../services/date.js';

import { typeOptions } from '../../recipes/slices/recipesSlice.ts';

import GroceryListViewItem from '../components/GroceryListViewItem.js';

const groceryListRecipeSeparator = ', ';

const ViewSharedGroceryList = () => {
  const [searchParams] = useSearchParams();
  
  const [originalAllIngredients, setOriginalAllIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);

    useEffect(() => {
        if (!allIngredients.length) {
            loadData();
        }
    }, []);

    function shareURL() {
        
    }

    function loadData() {
        console.log('l')
        
            console.log(originalAllIngredients)
            console.log(allIngredients)
        const data = searchParams.get('data');
        if (data) {
            const originalString = atob(data);

            let all_ing_strings = originalString.split('|');
            let all_ings = [];
            let all_recipes = [];
            all_ing_strings.forEach(function(ing) {
                let ing_parts = ing.split(':');
                let ingredient = {};
                ingredient.amount = ing_parts[0];
                ingredient.name = ing_parts[1];
                ingredient.type = ing_parts[2];
                let recipe = ing_parts[3];

                all_ings.push({
                    ingredient
                });
                if (!all_recipes.includes(recipe))
                    all_recipes.push(recipe);
            });

            setOriginalAllIngredients(all_ings);
            setAllIngredients(all_ings);
            setAllRecipes(all_recipes);
        }
    }

  function getAllIngredientsByType(all_ingredients) {
    let all_ingredients_by_type = {};
    all_ingredients.forEach(function(ing) {
        let type = ing && ing.ingredient && ing.ingredient.type;
        if (!type)
            type = '';

        if (!all_ingredients_by_type[type])
            all_ingredients_by_type[type] = [];

        console.log(ing)
        all_ingredients_by_type[type].push(ing);
    });

    Object.keys(all_ingredients_by_type).forEach(function(key) {
        all_ingredients_by_type[key].sort((a, b) => {
            if (a.ingredient.name.toLowerCase() > b.ingredient.name.toLowerCase()) {
                return 1;
            } else if (a.ingredient.name.toLowerCase() < b.ingredient.name.toLowerCase()) {
                return -1;
            } else {
                if (a.ingredient.amount.toLowerCase() > b.ingredient.amount.toLowerCase())
                    return -1;
                else
                    return 1;
            }
        });
    });

    return all_ingredients_by_type;
  }

  const isSaveDisabled = (!originalAllIngredients.length || !allIngredients.length) || originalAllIngredients.every((ing, i) => !!originalAllIngredients[i].crossed === !!allIngredients[i].crossed);
  const handleSave = (e) => {
    if (!isSaveDisabled) {
        
    }
  }

  let all_ingredients_by_type = getAllIngredientsByType(allIngredients);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex">
            <h2 className="text-left w-1/2 text-xl font-semibold text-gray-700 mb-4">
                <NavLink 
                    to={`/grocery-lists`}
                    className="p-2 hover:text-blue-500"
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                </NavLink>
            </h2>
            <div className="text-right w-1/2">
                <button
                    onClick={shareURL}
                    className="text-right mb-4 px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 active:bg-yellow-800"
                >
                    Share
                </button>
                {/* <NavLink 
                    to={`/grocery-lists/edit/${groceryListId}`}
                    className="text-right mb-4 px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-800"
                >Edit</NavLink> */}
            </div>
        </div>

        <div className="flex">
            <div className="overflow-y-auto">
                <div className="mb-4">
                    <label className="block text-left font-medium text-gray-700">Recipes:</label>
                    {allRecipes.map((r, i) => (
                        <span key={r+i}>
                            {r}{i+2 < allRecipes.length && groceryListRecipeSeparator}
                        </span>
                    ))}
                </div>
            </div>
        </div>

        <div>
            <label className="block text-left font-medium text-gray-700">Ingredients:</label>
        </div>

            {all_ingredients_by_type["produce"] && 
                <div className="mt-4">
                    <label className="text-left block font-bold">Produce</label>
                    <div className="flex">
                        <ul className="text-left w-full rounded-md mt-2"> 
                            {all_ingredients_by_type["produce"].map((ing, i) => (
                                <GroceryListViewItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe}
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            }

            {all_ingredients_by_type["meat"] && 
                <div className="mt-4">
                    <label className="text-left block font-bold">Meat</label>
                    <div className="flex">
                        <ul className="text-left w-full rounded-md mt-2"> 
                            {all_ingredients_by_type["meat"].map((ing, i) => (
                                <GroceryListViewItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe}
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            }
            
            {all_ingredients_by_type["dairy"] && 
                <div className="mt-4">
                    <label className="text-left block font-bold">Dairy</label>
                    <div className="flex">
                        <ul className="text-left w-full rounded-md mt-2"> 
                            {all_ingredients_by_type["dairy"].map((ing, i) => (
                                <GroceryListViewItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe}
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            }

            {all_ingredients_by_type["freezer"] && 
                <div className="mt-4">
                    <label className="text-left block font-bold">Freezer</label>
                    <div className="flex">
                        <ul className="text-left w-full rounded-md mt-2"> 
                            {all_ingredients_by_type["freezer"].map((ing, i) => (
                                <GroceryListViewItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe}
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            }

            {all_ingredients_by_type[""] && 
                <div className="mt-4">
                    <label className="text-left block font-bold">Other</label>
                    <div className="flex">
                        <ul className="text-left w-full rounded-md mt-2"> 
                            {all_ingredients_by_type[""].map((ing, i) => (
                                <GroceryListViewItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe} 
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            }
    </div>
  );
};

export default ViewSharedGroceryList;