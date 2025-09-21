import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, NavLink, useSearchParams } from 'react-router-dom';
import Select from 'react-select';

import pako from 'pako';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTrash } from '@fortawesome/free-solid-svg-icons';

import { fetchGroceryListById } from '../slices/groceryListSlice.ts';
import { editGroceryList, editGroceryListFromFirestore } from '../slices/groceryListsSlice.ts';

import { formatDate, formatTime } from '../../../services/date.js';

import GroceryListEditItem from '../components/GroceryListEditItem.js';

const groceryListRecipeSeparator = ', ';

const ViewGroceryList = () => {
  const { groceryListId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [groceryList, setGroceryList] = useState(undefined);
  const [originalAllIngredients, setOriginalAllIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);

  const [ingredients, setIngredients] = useState([]); // { amount: '', name: '', type: '', recipeId: '' }
  
    const typeOptions = [
        { value: '', label: 'Other' },
        { value: 'dairy', label: 'Dairy' },
        { value: 'freezer', label: 'Freezer' },
        { value: 'meat', label: 'Meat' },
        { value: 'produce', label: 'Produce' },
    ]

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

  function getAllIngredientsByType(all_ingredients) {
    let all_ingredients_by_type = {};
    all_ingredients.forEach(function(ing) {
        let type = ing && ing.ingredient && ing.ingredient.type;
        if (!type)
            type = '';

        if (!all_ingredients_by_type[type])
            all_ingredients_by_type[type] = [];

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

  function getAllIngredients(gl) {
    let all_ingredients = [];
    gl && gl.recipes && gl.recipes.forEach(function(r, i) {
        r.recipe.ingredients.forEach(function(ing, i) {
            all_ingredients.push({ ingredient: ing, recipe: r.recipe, index: i, crossed: ing.crossed });
        });
    });

    gl && gl.ingredients.forEach(function(ing, i) {
        all_ingredients.push({ ingredient: ing, index: i, crossed: ing.crossed });
    });

    return all_ingredients
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        let gl = (await dispatch(fetchGroceryListById(groceryListId))).payload;

        if (gl) {
            setGroceryList(gl);

            let all_ingredients = getAllIngredients(gl);
            setOriginalAllIngredients(all_ingredients);
        }
      } catch (error) {
        console.error("Error fetching grocery list:", error);
      }
    }

    fetchData();
  }, [dispatch, groceryListId]);

  useEffect(() => {
    let all_ingredients = getAllIngredients(groceryList);
    setAllIngredients(all_ingredients);
  }, [groceryList]);

  const isSaveDisabled = (!originalAllIngredients.length || !allIngredients.length) || (originalAllIngredients.every((ing, i) => !!originalAllIngredients[i].crossed === !!allIngredients[i].crossed)) && (!ingredients.length || ingredients.every((ing, i) => !ing.amount || !ing.name));
  const handleSave = (e) => {
    if (!isSaveDisabled) {
        let newIngredients = [];
        groceryList.ingredients.forEach(function(ing) {
            newIngredients.push(ing);
        });
        ingredients.forEach(function(ing) {
            newIngredients.push(ing);
        });

        // dispatch(editGroceryList({ groceryListId: groceryList.id, recipes: groceryList.recipes, ingredients: newIngredients }));
        dispatch(editGroceryListFromFirestore({ fbid: groceryList.fbid, recipes: groceryList.recipes, ingredients: newIngredients }));
        
        navigate('/grocery-lists');
    }
  }

  let all_ingredients_by_type = getAllIngredientsByType(allIngredients);

  return (
    <div className="App-body p-6 bg-white rounded-lg shadow-md">
        <div className="flex">
            <h2 className="text-left w-1/2 text-xl font-semibold text-gray-700 mb-4">
                <NavLink 
                    to={`/grocery-lists`}
                    className="p-2 hover:text-blue-500"
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                </NavLink>
                {groceryList && (formatDate(new Date(groceryList.timestamp)) + ' - ' + formatTime(new Date(groceryList.timestamp)))}
            </h2>
            <div className="text-right w-1/2">
                {/* <button
                    onClick={shareURL}
                    className="text-right mb-4 px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 active:bg-yellow-800"
                >
                    Share
                </button> */}
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
                    {groceryList && groceryList.recipes && groceryList.recipes.map((r, i) => (
                        <span key={r.id}>
                            {r.recipe.name}{i+1 < groceryList.recipes.length && groceryListRecipeSeparator}
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
                                <GroceryListEditItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe} 
                                    setGroceryList={setGroceryList}
                                    groceryList={groceryList} 
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
                                <GroceryListEditItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe} 
                                    setGroceryList={setGroceryList}
                                    groceryList={groceryList} 
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
                                <GroceryListEditItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe} 
                                    setGroceryList={setGroceryList}
                                    groceryList={groceryList} 
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
                                <GroceryListEditItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe} 
                                    setGroceryList={setGroceryList}
                                    groceryList={groceryList} 
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
                                <GroceryListEditItem 
                                    key={ing.recipe ? ing.recipe.id+i : i} 
                                    allIngredients={allIngredients} 
                                    allIngredientsIndex={i} 
                                    setAllIngredients={setAllIngredients} 
                                    ingredient={ing} 
                                    recipe={ing.recipe} 
                                    setGroceryList={setGroceryList}
                                    groceryList={groceryList} 
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            }

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
                        className="w-40 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {
            !isSaveDisabled && 
            <div className="flex justify-end space-x-4 sticky bottom-0 bg-white p-6 rounded-b-lg shadow-md">
                <button
                    onClick={handleSave}
                    disabled={isSaveDisabled}
                    className={`px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Save
                </button>
            </div>
        }
    </div>
  );
};

export default ViewGroceryList;