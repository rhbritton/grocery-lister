import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, NavLink, useSearchParams } from 'react-router-dom';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../auth/firebaseConfig';

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
  faSignOutAlt,
  faClock,
  faTag,
  faBookmark,
  faUtensils,
  faPlus,
  faTrash,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';

import { fetchGroceryListById } from '../slices/groceryListSlice.ts';
import { editGroceryListFromFirestore, upsertGroceryList } from '../slices/groceryListsSlice.ts';
import { normalizeUpdatedAt } from '../utils/groceryListMerge.ts';

import { formatDate, formatTime } from '../../../services/date.js';

import { typeOptions } from '../../recipes/slices/recipesSlice.ts';

import GroceryListViewItem from '../components/GroceryListViewItem2.js';
import AddIngredientModal from '../components/AddIngredientModal';
import PageLoader from '../../../components/PageLoader.js';
import EmptyState from '../../../components/EmptyState.js';
import Toast from '../../../components/Toast.js';
import { ActionFab } from '../../../components/FabButton.js';
import ModalShell from '../../../components/ModalShell.js';
import { copyTextToClipboard } from '../../../utils/clipboard.js';

const groceryListRecipeSeparator = ', ';

/** Grocery list recipe entries use wrapper `id` (often fbid) and nested `recipe.id`. */
function matchesGroceryListRecipeEntry(entry, recipeRef) {
  if (!entry?.recipe || !recipeRef) return false;
  return (
    entry.id === recipeRef.id ||
    entry.id === recipeRef.fbid ||
    entry.recipe.id === recipeRef.id ||
    entry.recipe.fbid === recipeRef.fbid ||
    entry.recipe.fbid === recipeRef.id
  );
}

function getAllIngredients(gl) {
  const all_ingredients = [];
  gl?.recipes?.forEach((r) => {
    r.recipe.ingredients.forEach((ing, i) => {
      all_ingredients.push({ ingredient: ing, recipe: r.recipe, index: i, crossed: ing.crossed });
    });
  });
  gl?.ingredients?.forEach((ing, i) => {
    all_ingredients.push({ ingredient: ing, index: i, crossed: ing.crossed });
  });
  return all_ingredients;
}

function getIngredientKey(item) {
  const name = item.ingredient?.name ?? '';
  const amount = item.ingredient?.amount ?? '';
  if (item.recipe) {
    return `r:${item.recipe.id}:${item.recipe.fbid || ''}:${item.index}:${name}:${amount}`;
  }
  return `m:${item.index}:${name}:${amount}`;
}

function getItemDomId(item) {
  return item.recipe
    ? `recipe-${item.recipe.id}-${item.index}`
    : `manual-${item.index}`;
}

function findChangedItemDomIds(prevList, nextList) {
  const prevIngredients = getAllIngredients(prevList);
  const nextIngredients = getAllIngredients(nextList);
  const prevByKey = new Map(prevIngredients.map((ing) => [getIngredientKey(ing), ing]));
  const changedIds = [];

  nextIngredients.forEach((ing) => {
    const key = getIngredientKey(ing);
    const domId = getItemDomId(ing);
    const prev = prevByKey.get(key);
    if (
      !prev ||
      !!prev.crossed !== !!ing.crossed ||
      prev.ingredient?.name !== ing.ingredient?.name ||
      prev.ingredient?.amount !== ing.ingredient?.amount
    ) {
      changedIds.push(domId);
    }
  });

  return changedIds;
}

function getListContentSignature(gl) {
  if (!gl) return '';
  return getAllIngredients(gl)
    .map((item) => `${getIngredientKey(item)}:${item.crossed ? 1 : 0}`)
    .sort()
    .join('|');
}

function mapSnapshotToGroceryList(docSnap, userId) {
  const data = docSnap.data();
  return {
    fbid: docSnap.id,
    ...data,
    userId: data.userId || userId,
    updatedAt: data?.updatedAt?.seconds ?? (typeof data?.updatedAt === 'number' ? data.updatedAt : 0),
  };
}

const ViewGroceryList = (props) => {
    const [showRecipes, setShowRecipes] = useState(false);
    const aisles = ["produce", "meat", "dairy", "freezer", "other"];

    const { groceryListId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { groceryLists } = useSelector((state) => state.groceryLists);
    const rehydrated = useSelector((state) => state._persist?.rehydrated);

    const isInitialLoad = useRef(true);
    const groceryListRef = useRef(undefined);
    const remoteHighlightIdsRef = useRef(null);
    const onRemoteListUpdateRef = useRef(props.onRemoteListUpdate);
    
    const [groceryList, setGroceryList] = useState(undefined);
    const [originalAllIngredients, setOriginalAllIngredients] = useState([]);
    const [allIngredients, setAllIngredients] = useState([]);

    const [editingItem, setEditingItem] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        props.setSpaceForFloatingButton && props.setSpaceForFloatingButton('');
        return () => {
            props.setSpaceForFloatingButton && props.setSpaceForFloatingButton('');
        };
    }, []);

    useEffect(() => {
        props.setTotalItems(allIngredients.length);
        props.setCheckedCount((allIngredients.filter((ing) => ing.crossed)).length);

        return () => {
            props.setTotalItems(0);
            props.setCheckedCount(0);
        };
    }, [allIngredients, props.setTotalItems, props.setCheckedCount]);

  useEffect(() => {
    props.setLastRemoteUpdateAt?.(null);
  }, [groceryListId, props.setLastRemoteUpdateAt]);

  useEffect(() => {
    return () => {
      props.setLastRemoteUpdateAt?.(null);
    };
  }, [props.setLastRemoteUpdateAt]);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    onRemoteListUpdateRef.current = props.onRemoteListUpdate;
  }, [props.onRemoteListUpdate]);

  useEffect(() => {
    groceryListRef.current = groceryList;
  }, [groceryList]);

  const highlightRow = (itemId, delay = 0) => {
    setTimeout(() => {
      const target = document.getElementById(itemId);
      if (target) {
        target.classList.add('!bg-blue-200', 'ring-2', 'ring-blue-400', 'z-50');
        setTimeout(() => {
          target.classList.remove('!bg-blue-200', 'ring-2', 'ring-blue-400', 'z-50');
        }, 1300);
      }
    }, delay);
  };

  const highlightChangedRows = (itemIds) => {
    itemIds.forEach((itemId, i) => {
      highlightRow(itemId, 50 + i * 80);
    });
  };

  useEffect(() => {
    const ids = remoteHighlightIdsRef.current;
    if (!ids?.length) return;
    remoteHighlightIdsRef.current = null;
    highlightChangedRows(ids);
  }, [groceryList]);

  const isOwner = props.userId && groceryList && (
    groceryList.userId === props.userId ||
    (!groceryList.userId && groceryLists.some((gl) => gl.fbid === groceryList.fbid || gl.id === groceryListId))
  );

  const persistGroceryList = async (list) => {
    if (!list?.fbid || !isOwner) return;

    const listToSave = {
      fbid: list.fbid,
      id: list.id,
      userId: list.userId || props.userId,
      timestamp: list.timestamp,
      recipes: list.recipes,
      ingredients: list.ingredients,
      baseUpdatedAt: normalizeUpdatedAt(list.updatedAt),
    };

    dispatch(upsertGroceryList({ ...list, ...listToSave }));

    try {
      const result = await dispatch(editGroceryListFromFirestore(listToSave)).unwrap();
      const nextList = { ...list, ...result };
      setGroceryList(nextList);
      setOriginalAllIngredients(getAllIngredients(nextList));
    } catch (_) {
      // Offline saves are queued by the thunk; no UI feedback needed.
    }
  };

  const deleteGlobalItem = (globalIndex) => {
      const itemToDelete = allIngredients[globalIndex];
      if (groceryList) {
          let newGroceryList = { ...groceryList };
          
          if (itemToDelete.recipe) {
              // Remove from a specific recipe
              newGroceryList.recipes = groceryList.recipes.map((r) => {
                  if (matchesGroceryListRecipeEntry(r, itemToDelete.recipe)) {
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
          persistGroceryList(newGroceryList);
      }
  };

  const handleAddItem = (newItem, recipe) => {
    if (groceryList) {
        if (recipe) {
            let matchFound = false;

            // 1. Try to update the recipe if it exists
            const updatedRecipes = groceryList.recipes.map((r) => {
                if (matchesGroceryListRecipeEntry(r, recipe.recipe || recipe)) {
                    matchFound = true;
                    return recipe; 
                }

                return r;
            });

            // 2. If no match was found, append the new recipe to the list
            const finalRecipes = matchFound 
                ? updatedRecipes 
                : [...groceryList.recipes, recipe];

            const newList = { ...groceryList, recipes: finalRecipes };
            setGroceryList(newList);
            setIsAddModalOpen(false);
            persistGroceryList(newList);
            
        } else {
            // Logic for manual custom items
            const newIndex = groceryList.ingredients.length;
            const itemId = `manual-${newIndex}`;

            const updatedIngredients = [...groceryList.ingredients, newItem];
            const newList = { ...groceryList, ingredients: updatedIngredients };
            setGroceryList(newList);
            setIsAddModalOpen(false);

            highlightRow(itemId, 200);
            persistGroceryList(newList);
        }
    }
};

  const updateGlobalItem = (globalIndex, newData) => {
      const itemToUpdate = allIngredients[globalIndex];
      const itemId = itemToUpdate.recipe 
        ? `recipe-${itemToUpdate.recipe.id}-${itemToUpdate.index}` 
        : `manual-${itemToUpdate.index}`;
      
      const updatedAll = allIngredients.map((ing, index) => 
          index === globalIndex ? { ...ing, ...newData, ingredient: { ...ing.ingredient, ...newData } } : ing
      );
      setAllIngredients(updatedAll);

      // 2. Update Deep Structure for Firestore
      if (groceryList) {
          let newGroceryList = { ...groceryList };
          if (itemToUpdate.recipe) {
              newGroceryList.recipes = groceryList.recipes.map((r) => {
                  if (matchesGroceryListRecipeEntry(r, itemToUpdate.recipe)) {
                      const updatedIngs = r.recipe.ingredients.map((ing, idx) => {
                        return idx === itemToUpdate.index ? { ...ing, ...newData } : ing;
                      });
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
          persistGroceryList(newGroceryList);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoadError(false);
      try {
        let gl = (await dispatch(fetchGroceryListById(groceryListId))).payload;

        if (gl) {
            const listWithOwner = {
              ...gl,
              userId: gl.userId || props.userId,
            };
            setGroceryList(listWithOwner);

            let all_ingredients = getAllIngredients(listWithOwner);
            setOriginalAllIngredients(all_ingredients);
        } else if (!groceryListRef.current) {
            setLoadError(true);
        }
      } catch (error) {
        console.error("Error fetching grocery list:", error);
        if (!groceryListRef.current) {
          setLoadError(true);
        }
      }
    }

    fetchData();
  }, [dispatch, groceryListId, props.userId]);

  // Re-load once persisted Redux data arrives (offline cold start)
  useEffect(() => {
    if (!rehydrated || groceryList) return;
    if (!groceryLists?.length) return;

    const fetchData = async () => {
      const gl = (await dispatch(fetchGroceryListById(groceryListId))).payload;
      if (gl) {
        const listWithOwner = { ...gl, userId: gl.userId || props.userId };
        setGroceryList(listWithOwner);
        setOriginalAllIngredients(getAllIngredients(listWithOwner));
      }
    };

    fetchData();
  }, [rehydrated, groceryLists?.length, dispatch, groceryListId, props.userId, groceryList]);

  useEffect(() => {
    let all_ingredients = getAllIngredients(groceryList);
    setAllIngredients(all_ingredients);
  }, [groceryList]);

  useEffect(() => {
    const listFbid = groceryList?.fbid || groceryListId;
    if (!listFbid) return;

    isInitialLoad.current = true;
    const docRef = doc(db, 'grocery-lists', listFbid);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) return;

        if (isInitialLoad.current) {
          const remoteList = mapSnapshotToGroceryList(docSnap, props.userId);
          if (remoteList.isDeleted) return;

          // When online, wait for the server snapshot — the first cache event can be stale.
          const waitingForServer = docSnap.metadata.fromCache && navigator.onLine;
          if (waitingForServer) {
            if (!groceryListRef.current) {
              dispatch(upsertGroceryList(remoteList));
              setGroceryList(remoteList);
              setOriginalAllIngredients(getAllIngredients(remoteList));
            }
            return;
          }

          isInitialLoad.current = false;

          const currentList = groceryListRef.current;
          const serverUpdatedAt = normalizeUpdatedAt(remoteList.updatedAt);
          const localUpdatedAt = normalizeUpdatedAt(currentList?.updatedAt);
          const serverNewer = serverUpdatedAt > localUpdatedAt;
          const contentDiff =
            currentList &&
            getListContentSignature(currentList) !== getListContentSignature(remoteList);

          if (!currentList || serverNewer || contentDiff) {
            dispatch(upsertGroceryList(remoteList));
            setGroceryList(remoteList);
            setOriginalAllIngredients(getAllIngredients(remoteList));
          }
          return;
        }

        if (docSnap.metadata.hasPendingWrites) return;

        const remoteList = mapSnapshotToGroceryList(docSnap, props.userId);
        if (remoteList.isDeleted) return;

        const currentList = groceryListRef.current;
        if (!currentList) return;

        if (getListContentSignature(currentList) === getListContentSignature(remoteList)) return;

        const changedItemIds = findChangedItemDomIds(currentList, remoteList);
        remoteHighlightIdsRef.current = changedItemIds;

        dispatch(upsertGroceryList(remoteList));
        setGroceryList(remoteList);
        setOriginalAllIngredients(getAllIngredients(remoteList));
        setEditingItem(null);
        setIsAddModalOpen(false);
        onRemoteListUpdateRef.current?.();
      },
      (error) => {
        console.error('Error listening to grocery list changes:', error);
      }
    );

    return () => unsubscribe();
  }, [groceryList?.fbid, groceryListId, props.userId, dispatch]);

    const [isShared, setIsShared] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVisible, setToastVisible] = useState(false);

const showToast = (message) => {
  setToastMessage(message);
  setToastVisible(true);
};

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
            setIsShared(true);
            setTimeout(() => setIsShared(false), 2000);
            return;
        }

        const copied = await copyTextToClipboard(fullUrl);
        if (copied) {
            setIsShared(true);
            showToast('Link copied to clipboard');
            setTimeout(() => setIsShared(false), 2000);
        } else {
            showToast('Unable to copy link — use your browser share menu');
        }
    } catch (err) {
        if (err.name !== 'AbortError') console.error('Error sharing:', err);
    }
};

  let all_ingredients_by_type = getAllIngredientsByType(allIngredients);

  if (!groceryList) {
    if (loadError) {
      return (
        <main className="page-main pb-fab-clear">
          <EmptyState
            icon={faClipboardList}
            title="Couldn't load this list"
            description="It may have been deleted or you may not have access."
            actionLabel="Back to lists"
            actionTo="/grocery-lists"
          />
        </main>
      );
    }
    return <PageLoader message="Loading list…" fullScreen={false} />;
  }

  return (
    <main className="page-main pb-fab-clear">
    
    {/* Header Section: Title/Actions on Top, Recipes Below */}
    <div className="flex flex-col gap-4 mb-6">
      
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
                aria-label={isShared ? 'Link copied' : 'Share grocery list'}
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
          <FontAwesomeIcon icon={faUtensils} className="text-base" />
          <span className="text-base font-black uppercase tracking-widest text-slate-800 transition-colors">
            Recipes
          </span>
          
          {/* Recipe Count Badge - Now Blue and more visible */}
          <span className="text-[16px] bg-blue-50 px-2 py-0.5 rounded-full font-black text-brand border border-blue-100 animate-in zoom-in duration-200">
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
              className="text-[16px] font-bold text-brand bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50 uppercase tracking-tight shadow-sm"
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
    <ModalShell
        titleId="edit-item-modal-title"
        onClose={() => {
          setEditingItem(null);
          setIsConfirmingDelete(false);
        }}
    >
            <div className={`p-6 text-white text-center transition-colors duration-300 ${isConfirmingDelete ? 'bg-red-500' : 'bg-brand'}`}>
                <FontAwesomeIcon icon={isConfirmingDelete ? faTrash : faEdit} className="text-2xl mb-2" aria-hidden="true" />
                <h3 id="edit-item-modal-title" className="text-lg font-bold uppercase tracking-widest">
                    {isConfirmingDelete ? 'Delete Item?' : 'Edit Item'}
                </h3>
            </div>

            <div className="p-6 space-y-4">
                {!isConfirmingDelete ? (
                    <>
                        <div>
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Amount</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
                                value={editingItem.ingredient.amount}
                                onChange={(e) => setEditingItem({...editingItem, ingredient: {...editingItem.ingredient, amount: e.target.value}})}
                            />
                        </div>
                        <div>
                            <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Item Name</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
                                value={editingItem.ingredient.name}
                                onChange={(e) => setEditingItem({...editingItem, ingredient: {...editingItem.ingredient, name: e.target.value}})}
                            />
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-2">
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-3 font-bold text-slate-400 uppercase text-xs">Cancel</button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        updateGlobalItem(editingItem.globalIndex, { name: editingItem.ingredient.name, amount: editingItem.ingredient.amount });
                                        setEditingItem(null);
                                    }}
                                    className="flex-1 py-3 bg-brand text-white rounded-xl font-bold shadow-lg uppercase text-xs"
                                >
                                    Update
                                </button>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsConfirmingDelete(true)}
                                className="w-full py-2 mt-4 text-red-400 font-bold uppercase text-[14px] tracking-widest hover:text-red-600 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTrash} className="mr-2" aria-hidden="true" />
                                Remove from list
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-2">
                        <p className="text-slate-600 mb-6 font-medium">
                            Are you sure you want to remove <span className="font-bold text-slate-900">"{editingItem.ingredient.name}"</span>?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsConfirmingDelete(false)} 
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase text-xs"
                            >
                                No, Keep it
                            </button>
                            <button 
                                type="button"
                                onClick={() => deleteGlobalItem(editingItem.globalIndex)}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-100 uppercase text-xs"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
    </ModalShell>
)}
            
            {isOwner && (
              <ActionFab
                onClick={() => setIsAddModalOpen(true)}
                icon={faPlus}
                label="Add item to list"
              />
            )}

            <Toast
              message={toastMessage}
              visible={toastVisible}
              onDismiss={() => setToastVisible(false)}
            />

            <AddIngredientModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={handleAddItem}
                groceryList={groceryList}
            />

          </main>
  );
};

export default ViewGroceryList;