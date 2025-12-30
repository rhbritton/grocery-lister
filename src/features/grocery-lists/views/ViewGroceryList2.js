import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, NavLink, useSearchParams } from 'react-router-dom';

import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../auth/firebaseConfig';

import pako from 'pako';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronDown, 
  faEdit, 
  faShareAlt, 
  faCheck, 
  faShoppingCart,
  faCalendarAlt,
  faUserCircle,
  faReceipt,
  faSave,
  faSignOutAlt,
  faClock,
  faTag,
  faBookmark,
  faUtensils
} from '@fortawesome/free-solid-svg-icons';

import { fetchGroceryListById } from '../slices/groceryListSlice.ts';
import { editGroceryList, editGroceryListFromFirestore } from '../slices/groceryListsSlice.ts';

import { formatDate, formatTime } from '../../../services/date.js';

import { typeOptions } from '../../recipes/slices/recipesSlice.ts';

import GroceryListViewItem from '../components/GroceryListViewItem2.js';

const groceryListRecipeSeparator = ', ';

const ViewGroceryList = (props) => {
    const [showRecipes, setShowRecipes] = useState(false);
    const aisles = ["produce", "meat", "dairy", "freezer", "other"];

    const { groceryListId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const isInitialLoad = useRef(true);
    
    const [groceryList, setGroceryList] = useState(undefined);
    const [originalAllIngredients, setOriginalAllIngredients] = useState([]);
    const [allIngredients, setAllIngredients] = useState([]);

    useEffect(() => {
        props.setSpaceForFloatingButton && props.setSpaceForFloatingButton('mb-20');
    }, []);

    useEffect(() => {
        props.setTotalItems(allIngredients.length);
        props.setCheckedCount((allIngredients.filter((ing) => ing.crossed)).length);

        return () => {
            props.setTotalItems(0);
            props.setCheckedCount(0);
        };
    }, [allIngredients, props]);

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
    <main className="max-w-xl mx-auto min-w-[380px] p-6">
    
    {/* Header Section: Title/Actions on Top, Recipes Below */}
    <div className="flex flex-col gap-4 mb-6 px-1">
      
      {/* Row 1: Title & Metadata on Left, Actions on Right */}
      <div className="flex justify-between items-start">
        
        {/* Top Left: List Identity */}
        <div className="flex-1 pr-4">
          
          {/* Date & Time Metadata */}
          <h1 className="text-left text-2xl font-bold text-slate-800 leading-tight">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-lg mb-0.5 text-slate-600" />
            <span> {groceryList && formatDate(new Date(groceryList.timestamp))}</span>          
          </h1>
          <div className="flex items-center gap-2 text-slate-400 mt-1">
            <span className="text-[16px] font-black uppercase tracking-[0.2em]">
                {groceryList && formatTime(new Date(groceryList.timestamp))}
            </span>
          </div>
        </div>
    
        {/* Top Right: Action Buttons */}
        <div className="flex gap-2 shrink-0">
            <NavLink 
                to={`/grocery-lists/edit/${groceryListId}`}
                className="w-14 h-14 flex items-center justify-center bg-white border text-[#1976D2] border-blue-200 rounded-xl shadow-sm transition-all active:scale-90"
            >
                <FontAwesomeIcon icon={faEdit} />
            </NavLink>

            <NavLink 
                onClick={shareURL}
                className="w-14 h-14 flex items-center justify-center bg-white border text-green-600 border-green-200 rounded-xl shadow-sm transition-all active:scale-90"
            >
                <FontAwesomeIcon icon={faShareAlt} />
            </NavLink>
        </div>
      </div>
    
      <div className="flex flex-col">
      {/* Toggle Button Container */}
      <button 
        onClick={() => setShowRecipes(!showRecipes)}
        className="flex items-center justify-between w-full group hover:bg-blue-50/30 p-2 pt-0 -ml-2 rounded-xl transition-all"
      >
        <div className="flex items-center gap-2 text-slate-600">
          <FontAwesomeIcon icon={faUtensils} className="text-md" />
          <span className="text-md font-black uppercase tracking-widest text-slate-800 transition-colors">
            Recipes
          </span>
          
          {/* Recipe Count Badge - Now Blue and more visible */}
          <span className="text-[14px] bg-blue-50 px-2 py-0.5 rounded-full font-black text-[#1976D2] border border-blue-100 animate-in zoom-in duration-200">
            {groceryList && groceryList.recipes && groceryList.recipes.length ? groceryList.recipes.length : 0}
          </span>
        </div>
    
        {/* The Chevron - Bold, Black, and High Visibility */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white transition-colors">
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`text-slate-900 text-sm ${showRecipes ? 'rotate-180' : 'rotate-0'}`} 
          />
        </div>
      </button>
    
      {/* Recipe Tags */}
      {showRecipes && (
        <div className="flex flex-wrap gap-x-2 gap-y-2 pl-1 pt-0 animate-in slide-in-from-top-2 duration-300 fade-in">
          {groceryList && groceryList.recipes && groceryList.recipes.map((recipe, i) => (
            <span 
              key={recipe.id} 
              className="text-[14px] font-bold text-[#1976D2] bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50 uppercase tracking-tight shadow-sm"
            >
              {recipe.recipe.name}
            </span>
          ))}
        </div>
      )}
    </div>
    </div>
    
    
    
    
            {/* 3. THE "PAPER" LIST */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden">
              
              {/* Notebook Margin Line (Red Line) - Always Visible Overlay */}
              <div className="absolute left-14 top-0 bottom-0 w-px bg-red-300/40 z-30 pointer-events-none" />
    
              {aisles.map(aisle => {
                let aisleType = aisle;
                if (aisle == 'other')
                    aisleType = '';

                const itemsInAisle = all_ingredients_by_type[aisleType] || [];
                if (itemsInAisle.length === 0) return null;
    
                return (
                  <section key={aisleType} className="relative z-10">
                    {/* Aisle Header */}
                    <div className="bg-slate-200/90 px-16 py-2.5 border-b border-slate-300/50">
                      <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-600">
                        {aisle}
                      </h2>
                    </div>
    
                    <div className="divide-y divide-slate-200/40">
                      {itemsInAisle.map((item, i) => {
                        return <GroceryListViewItem 
                            key={item.recipe ? item.recipe.id+i : i} 
                            allIngredients={allIngredients} 
                            allIngredientsIndex={i} 
                            setAllIngredients={setAllIngredients} 
                            ingredient={item} 
                            recipe={item.recipe} 
                            setGroceryList={setGroceryList}
                            groceryList={groceryList} 
                            isEven={!(i % 2)}
                            handleSave={handleSave}
                        />
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            
            {/* Primary Floating Action Button */}
            <button 
                onClick={handleSave}
                disabled={isSaveDisabled || props.groceryListHasChanged}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-2xl flex items-center justify-center transition-all z-50
                    ${(isSaveDisabled || props.groceryListHasChanged) 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                    : 'bg-[#1976D2] text-white shadow-2xl hover:bg-blue-700 transform active:scale-95'
                    }`}
                >
                <FontAwesomeIcon icon={faSave} className="text-2xl" />
            </button>
    
          </main>
  );
};

export default ViewGroceryList;