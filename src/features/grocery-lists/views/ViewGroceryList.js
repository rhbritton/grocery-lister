import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, NavLink, useSearchParams } from 'react-router-dom';

import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../auth/firebaseConfig';

import pako from 'pako';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faShareAlt, faPen } from '@fortawesome/free-solid-svg-icons';

import { fetchGroceryListById } from '../slices/groceryListSlice.ts';
import { editGroceryList, editGroceryListFromFirestore } from '../slices/groceryListsSlice.ts';

import { formatDate, formatTime } from '../../../services/date.js';

import { typeOptions } from '../../recipes/slices/recipesSlice.ts';

import GroceryListViewItem from '../components/GroceryListViewItem.js';

const groceryListRecipeSeparator = ', ';

const ViewGroceryList = (props) => {
  const { groceryListId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isInitialLoad = useRef(true);
  
  const [groceryList, setGroceryList] = useState(undefined);
  const [originalAllIngredients, setOriginalAllIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);

  const [shareFeedback, setShareFeedback] = useState('');

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

  useEffect(() => {
    if (!groceryListId) return;

    const docRef = doc(db, 'grocery-lists', groceryListId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
          console.log("Initial list data fetched.");
          return;
        }
        
        const isLocalSave = docSnap.metadata.hasPendingWrites; 
        if (!isLocalSave) {
          // This code runs only when the update comes from the server (a remote device)
          console.log('Remote update detected on secondary device: updated');
          props.setGroceryListHasChanged(true);
          unsubscribe();
        } else {
          // This code runs when the change is from the current device (a local save)
          console.log('Local save detected. Ignoring for "updated" notification.');
        }

      } else {
        console.log("No such document (list may have been deleted)");
      }
    }, (error) => {
      console.error("Error listening to document changes:", error);
    });

    return () => unsubscribe();
  }, [groceryListId]);

  const isSaveDisabled = (!originalAllIngredients.length || !allIngredients.length) || originalAllIngredients.every((ing, i) => !!originalAllIngredients[i].crossed === !!allIngredients[i].crossed);
  const handleSave = (e) => {
    if (!isSaveDisabled) {
        dispatch(editGroceryListFromFirestore({ fbid: groceryList.fbid, recipes: groceryList.recipes, ingredients: groceryList.ingredients }));
        
        setOriginalAllIngredients(getAllIngredients(groceryList));
    }
  }

    const shareURL = async () => {
        const fullUrl = `${window.location.origin}${props.basename}?grocerylist=${groceryListId}`;

        const shareData = {
            title: `Grocery List: ${groceryList ? formatDate(new Date(groceryList.timestamp)) : ''}`,
            text: 'Check out this grocery list!',
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
                {groceryList && (formatDate(new Date(groceryList.timestamp)) + ' - ' + formatTime(new Date(groceryList.timestamp), { hour: 'numeric', minute: 'numeric'}))}
            </h2>
            <div className="text-right w-1/2">
                <NavLink 
                    onClick={shareURL}
                    className="text-right mb-4 mr-2 px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 active:bg-yellow-800"
                >
                    <FontAwesomeIcon icon={faShareAlt} />
                    <span> Share</span>
                </NavLink>
                {groceryList && groceryList.userId && props.userId === groceryList.userId && <NavLink 
                    to={`/grocery-lists/edit/${groceryListId}`}
                    className="text-right mb-4 px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-800"
                >
                    <FontAwesomeIcon icon={faPen} />
                    <span> Edit</span>
                </NavLink>}
            </div>
        </div>

        <div className="flex">
            <div className="overflow-y-auto">
                <div className="mb-4">
                    <label className="block text-left font-medium text-gray-700">Recipes:</label>
                    {groceryList && groceryList.recipes && groceryList.recipes.map((r, i) => (
                        <span key={r.id}>
                            {r.recipe.name} (x{r.recipe.duplicateCount}){i+1 < groceryList.recipes.length && groceryListRecipeSeparator}
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
                                <GroceryListViewItem 
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
                                <GroceryListViewItem 
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
                                <GroceryListViewItem 
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
                                <GroceryListViewItem 
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

        {
            !isSaveDisabled && 
            <div className="flex justify-end space-x-4 sticky bottom-0 bg-white p-6 rounded-b-lg shadow-md">
                <button
                    onClick={handleSave}
                    disabled={isSaveDisabled || props.groceryListHasChanged}
                    className={`px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 ${isSaveDisabled || props.groceryListHasChanged ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={props.groceryListHasChanged && `List was changed by another user. Please refresh before saving.`}
                >
                    Save
                </button>
            </div>
        }
    </div>
  );
};

export default ViewGroceryList;