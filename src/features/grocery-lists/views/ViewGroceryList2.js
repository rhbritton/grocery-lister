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
  faUtensils,
  faPlus,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

import { fetchGroceryListById } from '../slices/groceryListSlice.ts';
import { editGroceryList, editGroceryListFromFirestore } from '../slices/groceryListsSlice.ts';

import { formatDate, formatTime } from '../../../services/date.js';

import { typeOptions } from '../../recipes/slices/recipesSlice.ts';

import GroceryListViewItem from '../components/GroceryListViewItem2.js';
import AddIngredientModal from '../components/AddIngredientModal';

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

    const [editingItem, setEditingItem] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        props.setSpaceForFloatingButton && props.setSpaceForFloatingButton('mb-36');
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [toast, setToast] = useState(null);

const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
};

const flashItem = (itemId, delay = 0) => {
    setTimeout(() => {
        const target = document.getElementById(itemId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('!bg-blue-200', 'ring-2', 'ring-blue-400', 'z-50');
            setTimeout(() => {
                target.classList.remove('!bg-blue-200', 'ring-2', 'ring-blue-400', 'z-50');
            }, 1300);
        }
    }, delay); // Use the passed delay
};

  const deleteGlobalItem = (globalIndex) => {
      const itemToDelete = allIngredients[globalIndex];
      if (groceryList) {
          let newGroceryList = { ...groceryList };
          
          if (itemToDelete.recipe) {
              // Remove from a specific recipe
              newGroceryList.recipes = groceryList.recipes.map((r) => {
                  if (r.id === itemToDelete.recipe.id) {
                      const updatedIngs = r.recipe.ingredients.filter((_, idx) => idx !== itemToDelete.index);
                      return { ...r, recipe: { ...r.recipe, ingredients: updatedIngs } };
                  }
                  return r;
              });
          } else {
              // Remove from standalone ingredients
              newGroceryList.ingredients = groceryList.ingredients.filter((_, idx) => idx !== itemToDelete.index);
          }

          setGroceryList(newGroceryList);
          setEditingItem(null);
          setIsConfirmingDelete(false);
      }
  };

  const handleAddItem = (newItem, recipe) => {
    if (groceryList) {
        if (recipe) {
            let matchFound = false;

            // 1. Try to update the recipe if it exists
            const updatedRecipes = groceryList.recipes.map((r) => {
                if (r?.recipe?.id === recipe.id) {
                    matchFound = true;
                    return recipe; 
                }

                return r;
            });

            // 2. If no match was found, append the new recipe to the list
            const finalRecipes = matchFound 
                ? updatedRecipes 
                : [...groceryList.recipes, recipe];

            // 3. Update state
            setGroceryList({ ...groceryList, recipes: finalRecipes });
            setIsAddModalOpen(false);
            showToast(`Added "${recipe?.recipe?.name}"!`);
            
        } else {
            // Logic for manual custom items
            const newIndex = groceryList.ingredients.length;
            const itemId = `manual-${newIndex}`;

            const updatedIngredients = [...groceryList.ingredients, newItem];
            setGroceryList({ ...groceryList, ingredients: updatedIngredients });
            setIsAddModalOpen(false);

            showToast(`Added "${newItem.amount} ${newItem.name}"!`);
            flashItem(itemId, 200); 
        }
    }
};

  const updateGlobalItem = (globalIndex, newData) => {
      const itemToUpdate = allIngredients[globalIndex];
      const itemId = itemToUpdate.recipe 
        ? `recipe-${itemToUpdate.recipe.id}-${itemToUpdate.index}` 
        : `manual-${itemToUpdate.index}`;
      
      // 1. Update UI (flat list)
      const updatedAll = allIngredients.map((ing, index) => 
          index === globalIndex ? { ...ing, ...newData, ingredient: { ...ing.ingredient, ...newData } } : ing
      );
      setAllIngredients(updatedAll);

      // 2. Update Deep Structure for Firestore
      if (groceryList) {
          let newGroceryList = { ...groceryList };
          if (itemToUpdate.recipe) {
              newGroceryList.recipes = groceryList.recipes.map((r) => {
                  if (r.id === itemToUpdate.recipe.id) {
                      const updatedIngs = r.recipe.ingredients.map((ing, idx) =>
                          idx === itemToUpdate.index ? { ...ing, ...newData } : ing
                      );
                      return { ...r, recipe: { ...r.recipe, ingredients: updatedIngs } };
                  }
                  return r;
              });
          } else {
              newGroceryList.ingredients = groceryList.ingredients.map((ing, idx) =>
                  idx === itemToUpdate.index ? { ...ing, ...newData } : ing
              );
          }
          setGroceryList(newGroceryList);
      }
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

//   useEffect(() => {
//     if (!groceryListId || !groceryList || props.userId == groceryList.userId) return;

//     const docRef = doc(db, 'grocery-lists', groceryListId);

//     const unsubscribe = onSnapshot(docRef, (docSnap) => {
//       if (docSnap.exists()) {
//         if (isInitialLoad.current) {
//           isInitialLoad.current = false;
//           console.log("Initial list data fetched.");
//           return;
//         }
        
//         const isLocalSave = docSnap.metadata.hasPendingWrites; 
//         if (!isLocalSave) {
//           // This code runs only when the update comes from the server (a remote device)
//           console.log('Remote update detected on secondary device: updated');
//           props.setGroceryListHasChanged(true);
//           unsubscribe();
//         } else {
//           // This code runs when the change is from the current device (a local save)
//           console.log('Local save detected. Ignoring for "updated" notification.');
//         }

//       } else {
//         console.log("No such document (list may have been deleted)");
//       }
//     }, (error) => {
//       console.error("Error listening to document changes:", error);
//     });

//     return () => unsubscribe();
//   }, [groceryListId, groceryList?.userId]);

  const isSaveDisabled = useMemo(() => {
    // 1. Check for empty lists
    if (!originalAllIngredients.length || !allIngredients.length) return true;

    // 2. Check if lengths differ (quick exit)
    if (originalAllIngredients.length !== allIngredients.length) return false;

    // 3. Deep compare the specific fields
    return originalAllIngredients.every((ing, i) => {
      const currentIng = allIngredients[i];
      
      return (
        !!ing.crossed === !!currentIng?.crossed &&
        ing.ingredient?.name === currentIng?.ingredient?.name &&
        ing.ingredient?.amount === currentIng?.ingredient?.amount
      );
    });
  }, [originalAllIngredients, allIngredients]);

  const handleSave = (e) => {
    if (!isSaveDisabled) {
        dispatch(editGroceryListFromFirestore({ fbid: groceryList.fbid, recipes: groceryList.recipes, ingredients: groceryList.ingredients }));
        
        setOriginalAllIngredients(getAllIngredients(groceryList));
    }
  }

    // Add this state near your other useState hooks
const [isShared, setIsShared] = useState(false);

const shareURL = async () => {
    const fullUrl = `${window.location.origin}${props.basename}?grocerylist=${groceryListId}`;
    const shareData = {
        title: `Grocery List: ${groceryList ? formatDate(new Date(groceryList.timestamp)) : ''}`,
        text: 'Check out this grocery list!',
        url: fullUrl,
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(fullUrl);
        } else {
            prompt('Copy this link to share:', fullUrl);
        }
        
        // Trigger visual success state
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
    } catch (err) {
        if (err.name !== 'AbortError') console.error('Error sharing:', err);
    }
};

  let all_ingredients_by_type = getAllIngredientsByType(allIngredients);

  const isOwner = props.userId == groceryList?.userId;

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
                {groceryList && formatTime(new Date(groceryList.timestamp), { hour: 'numeric', minute: 'numeric'})}
            </span>
          </div>
        </div>
    
        {/* Top Right: Action Buttons */}
        {isOwner && <div className="flex gap-2 shrink-0">
            <button 
                onClick={shareURL}
                className={`w-14 h-14 flex flex-col items-center justify-center transition-all duration-300 rounded-xl border
                    ${isShared 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105' 
                        : 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50 hover:bg-emerald-100 hover:border-emerald-200 active:scale-95'
                    }`}
            >
                <FontAwesomeIcon 
                    icon={isShared ? faCheck : faShareAlt} 
                    className={`transition-all duration-300 text-xl ${isShared ? 'scale-110' : 'scale-100'}`} 
                />
                <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 overflow-hidden
                    ${isShared ? 'opacity-100 max-h-4' : 'opacity-0 max-h-0'}`}>
                    Copied
                </span>
            </button>
        </div>}
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
          <span className="text-[16px] bg-blue-50 px-2 py-0.5 rounded-full font-black text-[#1976D2] border border-blue-100 animate-in zoom-in duration-200">
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
              className="text-[16px] font-bold text-[#1976D2] bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50 uppercase tracking-tight shadow-sm"
            >
              {recipe.recipe.name} {recipe?.recipe?.duplicateCount && `(x${recipe?.recipe?.duplicateCount})`}
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
                let aisleType = aisle === 'other' ? '' : aisle;
                    const itemsInAisle = all_ingredients_by_type[aisleType] || [];
                    if (itemsInAisle.length === 0) return null;

                    return (
                        <section key={aisleType} className="relative z-10">
                            <div className="bg-slate-200/90 px-16 py-2.5 border-b border-slate-300/50">
                                <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-600">{aisle}</h2>
                            </div>
                            <div className="divide-y divide-slate-200/40">
                                {itemsInAisle.map((item) => {
                                    const itemId = item.recipe 
                                      ? `recipe-${item.recipe.id}-${item.index}` 
                                      : `manual-${item.index}`;

                                    // Find the actual global index from the allIngredients array
                                    const globalIndex = allIngredients.findIndex(ing => ing === item);
                                    return (
                                        <GroceryListViewItem 
                                            key={item.recipe ? item.recipe.id + globalIndex : globalIndex} 
                                            itemId={itemId}
                                            ingredient={item} 
                                            isEven={!(globalIndex % 2)}
                                            onUpdate={(newData) => updateGlobalItem(globalIndex, newData)}
                                            onEdit={() => setEditingItem({ ...item, globalIndex })}
                                            disableEdit={!isOwner}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>

            {editingItem && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header switches to red if confirming delete */}
            <div className={`p-6 text-white text-center transition-colors duration-300 ${isConfirmingDelete ? 'bg-red-500' : 'bg-[#1976D2]'}`}>
                <FontAwesomeIcon icon={isConfirmingDelete ? faTrash : faEdit} className="text-2xl mb-2" />
                <h3 className="text-lg font-bold uppercase tracking-widest">
                    {isConfirmingDelete ? 'Delete Item?' : 'Edit Item'}
                </h3>
            </div>

            <div className="p-6 space-y-4">
                {!isConfirmingDelete ? (
                    <>
                        {/* Standard Edit Inputs */}
                        <div>
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Amount</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-[#1976D2]"
                                value={editingItem.ingredient.amount}
                                onChange={(e) => setEditingItem({...editingItem, ingredient: {...editingItem.ingredient, amount: e.target.value}})}
                            />
                        </div>
                        <div>
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Item Name</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-[#1976D2]"
                                value={editingItem.ingredient.name}
                                onChange={(e) => setEditingItem({...editingItem, ingredient: {...editingItem.ingredient, name: e.target.value}})}
                            />
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-2">
                            <div className="flex gap-3">
                                <button onClick={() => setEditingItem(null)} className="flex-1 py-3 font-bold text-slate-400 uppercase text-xs">Cancel</button>
                                <button 
                                    onClick={() => {
                                        updateGlobalItem(editingItem.globalIndex, { name: editingItem.ingredient.name, amount: editingItem.ingredient.amount });
                                        setEditingItem(null);
                                    }}
                                    className="flex-1 py-3 bg-[#1976D2] text-white rounded-xl font-bold shadow-lg uppercase text-xs"
                                >
                                    Update
                                </button>
                            </div>
                            {/* The Delete Trigger */}
                            <button 
                                onClick={() => setIsConfirmingDelete(true)}
                                className="w-full py-2 mt-4 text-red-400 font-bold uppercase text-[14px] tracking-widest hover:text-red-600 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                Remove from list
                            </button>
                        </div>
                    </>
                ) : (
                    /* Confirmation View */
                    <div className="text-center py-2">
                        <p className="text-slate-600 mb-6 font-medium">
                            Are you sure you want to remove <span className="font-bold text-slate-900">"{editingItem.ingredient.name}"</span>?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsConfirmingDelete(false)} 
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase text-xs"
                            >
                                No, Keep it
                            </button>
                            <button 
                                onClick={() => deleteGlobalItem(editingItem.globalIndex)}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-100 uppercase text-xs"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
)}
            
            {/* Primary Floating Action Button */}
            {isOwner && <button 
                onClick={() => setIsAddModalOpen(true)}
                className={`fixed bottom-24 right-6 w-16 h-16 rounded-2xl flex items-center justify-center transition-all z-50
                    bg-[#1976D2] text-white shadow-2xl hover:bg-blue-700 transform active:scale-95`}
                >
                <FontAwesomeIcon icon={faPlus} className="text-2xl" />
            </button>}

            {isOwner && <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-50">
                <div className="max-w-xl mx-auto">
                    <button 
                        onClick={handleSave}
                        disabled={isSaveDisabled || props.groceryListHasChanged}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all
                            ${(isSaveDisabled || props.groceryListHasChanged) 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-[0.98]'
                          }`}
                    >
                        <FontAwesomeIcon icon={faSave} />
                        <span className="font-black uppercase tracking-widest text-sm">
                            {props.groceryListHasChanged ? 'Syncing Changes...' : 'Save List Changes'}
                        </span>
                    </button>
                </div>
            </div>}

            <AddIngredientModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={handleAddItem}
                groceryList={groceryList}
            />

            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-[#1976D2] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400/30">
                        <span className="text-sm font-bold uppercase tracking-widest w-full">{toast}</span>
                    </div>
                </div>
            )}
    
          </main>
  );
};

export default ViewGroceryList;