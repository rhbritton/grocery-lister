import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, NavLink } from 'react-router-dom';

import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../../auth/firebaseConfig';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faBookmark,
  faShareAlt, 
  faCheckCircle, 
  faCircle,
  faListUl,
  faMortarPestle,
  faBook,
} from '@fortawesome/free-solid-svg-icons';

import { fetchRecipeById } from '../slices/recipeSlice.ts';
import { toggleFavoriteRecipeInFirestore } from '../slices/recipesSlice.ts';

import UnfavoriteModal from '../components/UnfavoriteModal.js';
import PageLoader from '../../../components/PageLoader.js';
import EmptyState from '../../../components/EmptyState.js';
import Toast from '../../../components/Toast.js';
import { copyTextToClipboard } from '../../../utils/clipboard.js';

import '../styles/ViewRecipe.css';

const ViewRecipe = (props) => {
  const { recipeId } = useParams();
  const dispatch = useDispatch();

  const [owner, setOwner] = useState('');
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [focusedColumn, setFocusedColumn] = useState('instructions');

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const [checkedIngredients, setCheckedIngredients] = useState({});
  
    const toggleIngredient = (idx) => {
      setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

  

  const [isFavorite, setIsFavorite] = useState(false);
  const [showUnfavoriteModal, setShowUnfavoriteModal] = useState(false);
  const isFavoriteLoading = useSelector((state) => state.recipes.isFavoriteLoading);
  const { allRecipes, favoriteRecipes } = useSelector((state) => state.recipes);

  // 1. Add this state near your other useState hooks
const [isShared, setIsShared] = useState(false);

const showToast = (message) => {
  setToastMessage(message);
  setToastVisible(true);
};

const shareURL = async () => {
  const fullUrl = `${window.location.origin}${props.basename}?recipe=${recipeId}`;

  const shareData = {
    title: `Recipe: ${name}`,
    text: `Check out this recipe for ${name}!`,
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        let recipe = (await dispatch(fetchRecipeById(recipeId))).payload;

        if (recipe) {
          setName(recipe.name || '');
          setIngredients(recipe.ingredients || []);
          setInstructions(recipe.instructions || '');
          setOwner(recipe.userId || '');
        } else {
          setLoadError(true);
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch, recipeId, allRecipes, favoriteRecipes]);

  

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!props.userId || !recipeId) {
        setIsFavorite(false);
        return;
      }

      try {
        const favRef = doc(db, "recipe-favorites", props.userId);
        const docSnap = await getDoc(favRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Check if the favorites array exists and contains this recipeId
          const favorites = data.favorites || [];
          const isFav = favorites.some(fav => fav.id === recipeId);
          setIsFavorite(isFav);
        } else {
          // Document doesn't exist yet (user has no favorites)
          setIsFavorite(false);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
        setIsFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [props.userId, recipeId]);

  const confirmFavoriteToggle = async () => {
    if (!props.userId) return;

    const newStatus = !isFavorite;
    setIsFavorite(newStatus);

    const isAdding = !isFavorite;
    dispatch(toggleFavoriteRecipeInFirestore({ userId: props.userId, recipeId, recipeName: name, isAdding }));
  };

  const handleFavoriteToggle = () => {
    if (isFavorite)
      setShowUnfavoriteModal(true);
    else
      confirmFavoriteToggle();
  };


  const steps = instructions.split(/\r?\n/).filter(line => line.trim() !== "");

  // Pin the view below the app header so the page itself never scrolls.
  const shellClass = 'fixed inset-x-0 bottom-0 top-[var(--app-header-height)] z-0 overflow-hidden';

  useEffect(() => {
    props.setTotalItems?.(0);
    props.setCheckedCount?.(0);
    props.setSpaceForFloatingButton?.('');
    props.setLastRemoteUpdateAt?.(null);
  }, [props.setTotalItems, props.setCheckedCount, props.setSpaceForFloatingButton, props.setLastRemoteUpdateAt]);

  if (isLoading && !name) {
    return <PageLoader message="Loading recipe…" fullScreen={false} />;
  }

  if (loadError && !name) {
    return (
      <main className="page-main pb-8">
        <EmptyState
          icon={faBook}
          title="Couldn't load this recipe"
          description="It may have been deleted or you may not have access."
          actionLabel="Back to recipes"
          actionTo="/recipes"
        />
      </main>
    );
  }

  return (
        <main className={`${shellClass} px-3 sm:px-4 py-3 pb-4`}>
            <div className="max-w-xl mx-auto w-full h-full flex flex-col min-h-0">

            {/* Paper sheet: title + steps/ingredients */}
            <div className="flex flex-col flex-1 min-h-0 bg-white rounded-3xl shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 overflow-hidden">

            {/* Header Row: Title on Left, Actions on Right */}
            <div className="flex justify-between items-start shrink-0 px-5 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">

                {/* Top Left: Recipe Name & Metadata */}
                <div className="flex-1 pr-4">
                    {/* Smaller Title: Changed from text-3xl font-black to text-2xl font-bold */}
                    <h1 className="text-left text-2xl font-bold text-slate-800 leading-tight">
                        {name}
                    </h1>

                    {/* Owner Section */}
                    {/* <div className="flex items-center gap-1.5">
                        <span className="text-base font-medium text-slate-400">By</span>
                        <span className="text-base font-bold text-slate-700 hover:text-brand transition-colors cursor-pointer">
                            Kaitlin Britton
                        </span>
                    </div> */}

                    {/* Metadata Row: Time, Category, and Owner */}
                    {/* <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-slate-500">

                        <div className="flex items-center gap-1.5 text-brand">
                            <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                            <span className="text-base font-bold uppercase tracking-wider">45 Mins</span>
                        </div>

                        <span className="text-slate-300 text-xs">•</span>

                        <div className="flex items-center gap-1.5 text-brand">
                            <FontAwesomeIcon icon={faTag} className="text-[10px]" />
                            <span className="text-base font-bold uppercase tracking-wider">
                                Dinner
                            </span>
                        </div>
                    </div> */}
                </div>

                {/* Top Right: Action Buttons */}
                <div className="flex gap-2 shrink-0">
                
                {/* EDIT BUTTON (Blue Theme) */}
                {owner && props.userId === owner && (
                    <NavLink 
                    to={`/recipes/edit/${recipeId}`}
                    aria-label="Edit recipe"
                    className="w-14 h-14 flex items-center justify-center bg-blue-50/50 text-brand border border-blue-100/50 hover:bg-blue-100 hover:border-blue-200 rounded-xl transition-all active:scale-95"
                    >
                    <FontAwesomeIcon icon={faEdit} className="text-xl" aria-hidden="true" />
                    </NavLink>
                )}

                {/* FAVORITE BUTTON (logged-in viewers, not the owner) */}
                {props.userId && owner && props.userId !== owner && (
                    <button 
                        type="button"
                        onClick={handleFavoriteToggle}
                        disabled={isFavoriteLoading}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                        aria-pressed={isFavorite}
                        className={`w-14 h-14 flex items-center justify-center transition-all duration-300 rounded-xl border
                            ${isFavorite 
                            ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200 scale-105' 
                            : 'bg-amber-50/50 text-amber-500 border-amber-100/50 hover:bg-amber-100 hover:border-amber-200 active:scale-95'
                            }`}
                    >
                        <FontAwesomeIcon 
                            icon={faBookmark} 
                            className={`transition-all duration-300 text-xl ${isFavorite ? 'scale-110' : 'scale-100'}`} 
                        />
                    </button>
                )}

                {/* SHARE BUTTON */}
                <button 
                    type="button"
                    onClick={shareURL}
                    aria-label={isShared ? 'Link copied' : 'Share recipe'}
                    className={`w-14 h-14 flex flex-col items-center justify-center transition-all duration-300 rounded-xl border
                        ${isShared 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105' 
                        : 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50 hover:bg-emerald-100 hover:border-emerald-200 active:scale-95'
                        }`}
                >
                    <FontAwesomeIcon 
                        icon={isShared ? faCheckCircle : faShareAlt} 
                        className={`transition-all duration-300 text-xl ${isShared ? 'scale-110' : 'scale-100'}`} 
                    />
                    <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 overflow-hidden
                        ${isShared ? 'opacity-100 max-h-4' : 'opacity-0 max-h-0'}`}>
                        Copied
                    </span>
                </button>
                </div>
            </div>

            {/* Steps + ingredients fill the rest of the sheet */}
            <div className="flex flex-1 min-h-0 relative">

                {/* INSTRUCTIONS PANEL (Left) */}
                <section 
                    onClick={() => setFocusedColumn('instructions')}
                    className={`relative transition-all duration-500 ease-in-out border-r border-slate-100 overflow-y-auto scrollbar-hide
                        ${focusedColumn === 'instructions' 
                        ? 'w-[70%] bg-white z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)]' 
                        : 'w-[30%] bg-slate-50 cursor-pointer'}`
                    }
                >
                    {/* FIXED HEADER: Solid background prevents text overlap */}
                    <div className={`sticky top-0 z-30 transition-all duration-500 border-b border-transparent
                            ${focusedColumn === 'instructions' ? 'bg-white border-slate-100' : 'bg-slate-50'}`}
                    >

                        <div className={`h-1 transition-colors duration-500 ${focusedColumn === 'instructions' ? 'bg-brand' : 'bg-transparent'}`} />
                        
                        <div className="px-5 py-4">
                            <div className={`flex items-center gap-2 transition-all duration-500 ${focusedColumn === 'instructions' ? 'scale-100' : 'scale-90 opacity-60'}`}>
                                <FontAwesomeIcon icon={faMortarPestle} className={focusedColumn === 'instructions' ? 'text-brand' : 'text-slate-400'} />
                                <h2 className={`text-base font-bold uppercase tracking-widest transition-colors ${focusedColumn === 'instructions' ? 'text-brand' : 'text-slate-400'}`}>
                                    Steps
                                </h2>
                            </div>
                        </div>

                        {/* GRADIENT FADE: Signals scrolling availability */}
                        <div className="absolute bottom-[-20px] left-0 right-0 h-5 bg-gradient-to-b from-inherit to-transparent pointer-events-none" />
                    </div>

                    {/* Content Area */}
                    <div className="px-5 pb-10">
                        <div className={`space-y-6 text-left transition-all duration-500 ${focusedColumn !== 'instructions' ? 'opacity-30 grayscale-[0.8]' : 'opacity-100'}`}>
                            {steps.length > 0 ? (
                                steps.map((step, i) => (
                                <div key={i} className="flex gap-3">
                                    <span className={`text-[14px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-[0.25em] transition-colors
                                        ${focusedColumn === 'instructions' ? 'bg-blue-50 text-brand' : 'bg-slate-200 text-slate-400'}`}>
                                    {i + 1}
                                    </span>
                                    <p className="text-base leading-relaxed text-slate-700 font-medium">{step}</p>
                                </div>
                                ))
                            ) : (
                                /* This is the empty state */
                                <div className="flex flex-col items-center justify-center py-4 text-center">
                                <p className="text-sm italic text-slate-400">Instructions haven't been added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* INGREDIENTS PANEL (Right) */}
                <section 
                    onClick={() => setFocusedColumn('ingredients')}
                    className={`relative transition-all duration-500 ease-in-out overflow-y-auto scrollbar-hide
                        ${focusedColumn === 'ingredients' 
                            ? 'w-[70%] bg-white z-10 shadow-[-4px_0_15px_rgba(0,0,0,0.05)]' 
                            : 'w-[30%] bg-slate-50 cursor-pointer'}`}
                >
                    {/* FIXED HEADER */}
                    <div className={`sticky top-0 z-30 transition-all duration-500 border-b border-transparent
                        ${focusedColumn === 'ingredients' ? 'bg-white border-slate-100' : 'bg-slate-50'}`}
                    >

                        <div className={`h-1 transition-colors duration-500 ${focusedColumn === 'ingredients' ? 'bg-brand' : 'bg-transparent'}`} />

                        <div className="px-5 py-4">
                            <div className={`flex items-center gap-2 transition-all duration-500 ${focusedColumn === 'ingredients' ? 'scale-100' : 'scale-90 opacity-60'}`}>
                                <FontAwesomeIcon icon={faListUl} className={focusedColumn === 'ingredients' ? 'text-brand' : 'text-slate-400'} />
                                <h2 className={`text-base font-bold uppercase tracking-widest transition-colors ${focusedColumn === 'ingredients' ? 'text-brand' : 'text-slate-400'}`}>
                                    Ingredients
                                </h2>
                            </div>
                        </div>

                        {/* GRADIENT FADE */}
                        <div className="absolute bottom-[-20px] left-0 right-0 h-5 bg-gradient-to-b from-inherit to-transparent pointer-events-none" />
                    </div>

                    {/* Content Area */}
                    <div className="px-5 pb-10">
                        <div className={`space-y-5 transition-all duration-500 ${focusedColumn !== 'ingredients' ? 'opacity-30 grayscale-[0.8]' : 'opacity-100'}`}>
                            {ingredients.map((item, i) => (
                                <div key={i} onClick={(e) => { if (focusedColumn !== 'ingredients') return; e.stopPropagation(); toggleIngredient(i); }}
                                    className={`flex items-start gap-3 transition-all ${focusedColumn === 'ingredients' ? 'cursor-pointer group' : 'cursor-default pointer-events-none'}`}
                                >
                                    <div className="mt-[0.25em] shrink-0">
                                        <FontAwesomeIcon icon={checkedIngredients[i] ? faCheckCircle : faCircle} 
                                            className={checkedIngredients[i] && focusedColumn === 'ingredients' ? 'text-brand' : 'text-slate-200'} />
                                    </div>
                                    <p className="text-base text-slate-700 font-medium text-left leading-tight">{item.amount} - {item.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            </div>

            {showUnfavoriteModal && (
              <UnfavoriteModal 
                setShowModal={setShowUnfavoriteModal} 
                onConfirm={confirmFavoriteToggle} 
              />
            )}

            <Toast
              message={toastMessage}
              visible={toastVisible}
              onDismiss={() => setToastVisible(false)}
            />

            </div>

        </main>
  );
};

export default ViewRecipe;