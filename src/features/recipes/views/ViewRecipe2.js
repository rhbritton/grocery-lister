import React, { useState, useEffect, useRef } from 'react';
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
  faCheck,
  faListUl,
  faMortarPestle,
  faBook,
  faChevronDown,
  faChevronUp,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';

import { fetchRecipeById } from '../slices/recipeSlice.ts';
import { toggleFavoriteRecipeInFirestore } from '../slices/recipesSlice.ts';

import UnfavoriteModal from '../components/UnfavoriteModal.js';
import SignInToFavoriteModal from '../components/SignInToFavoriteModal.js';
import PageLoader from '../../../components/PageLoader.js';
import EmptyState from '../../../components/EmptyState.js';
import Toast from '../../../components/Toast.js';
import { copyTextToClipboard } from '../../../utils/clipboard.js';
import { buildRecipeShareUrl } from '../../../utils/appPaths.js';
import {
  setPendingAuthIntent,
  consumePendingAuthIntent,
  clearPendingAuthIntent,
  peekPendingAuthIntent,
} from '../../../utils/pendingAuthIntent.js';
import { getSignInErrorMessage } from '../../../auth/signIn.js';

import '../styles/ViewRecipe.css';

const ViewRecipe = (props) => {
  const { recipeId } = useParams();
  const dispatch = useDispatch();

  const [owner, setOwner] = useState('');
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [isCooking, setIsCooking] = useState(false);
  const [ingredientsPanelOpen, setIngredientsPanelOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const [checkedIngredients, setCheckedIngredients] = useState({});
  const scrollRef = useRef(null);
  const stepRefs = useRef({});
  const [cookProgressReady, setCookProgressReady] = useState(false);

  const cookProgressKey = (id) => `gl.recipeCook.${id}`;

  const toggleIngredient = (idx) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const scrollStepIntoView = (idx) => {
    requestAnimationFrame(() => {
      stepRefs.current[idx]?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'center',
      });
    });
  };

  const selectStep = (idx) => {
    setActiveStep(idx);
    scrollStepIntoView(idx);
  };

  

  const [isFavorite, setIsFavorite] = useState(false);
  const [showUnfavoriteModal, setShowUnfavoriteModal] = useState(false);
  const [showSignInToFavoriteModal, setShowSignInToFavoriteModal] = useState(false);
  const [favoriteStatusReady, setFavoriteStatusReady] = useState(false);
  const isFavoriteLoading = useSelector((state) => state.recipes.isFavoriteLoading);
  const { allRecipes, favoriteRecipes } = useSelector((state) => state.recipes);

  // 1. Add this state near your other useState hooks
const [isShared, setIsShared] = useState(false);

const showToast = (message) => {
  setToastMessage(message);
  setToastVisible(true);
};

const shareURL = async () => {
  const fullUrl = buildRecipeShareUrl(recipeId);

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
        setFavoriteStatusReady(false);
        return;
      }

      setFavoriteStatusReady(false);
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
      } finally {
        setFavoriteStatusReady(true);
      }
    };

    checkFavoriteStatus();
  }, [props.userId, recipeId]);

  // After sign-in, apply a remembered "favorite this recipe" intent.
  useEffect(() => {
    if (!props.userId || !recipeId || !name || !favoriteStatusReady) {
      return;
    }

    if (owner && props.userId === owner) {
      clearPendingAuthIntent();
      return;
    }

    const intent = peekPendingAuthIntent();
    if (!intent || intent.type !== 'favoriteRecipe' || intent.recipeId !== recipeId) {
      return;
    }

    consumePendingAuthIntent('favoriteRecipe', recipeId);

    if (isFavorite) {
      return;
    }

    setIsFavorite(true);
    dispatch(
      toggleFavoriteRecipeInFirestore({
        userId: props.userId,
        recipeId,
        recipeName: name,
        isAdding: true,
      })
    );
  }, [
    props.userId,
    recipeId,
    name,
    owner,
    favoriteStatusReady,
    isFavorite,
    dispatch,
  ]);

  const confirmFavoriteToggle = async () => {
    if (!props.userId) return;

    const newStatus = !isFavorite;
    setIsFavorite(newStatus);

    const isAdding = !isFavorite;
    dispatch(toggleFavoriteRecipeInFirestore({ userId: props.userId, recipeId, recipeName: name, isAdding }));
  };

  const handleFavoriteToggle = () => {
    if (!props.userId) {
      setShowSignInToFavoriteModal(true);
      return;
    }

    if (isFavorite) {
      setShowUnfavoriteModal(true);
    } else {
      confirmFavoriteToggle();
    }
  };

  const handleSignInToFavorite = async () => {
    setPendingAuthIntent({ type: 'favoriteRecipe', recipeId });
    try {
      await props.handleGoogleLogin?.();
    } catch (error) {
      clearPendingAuthIntent();
      throw new Error(getSignInErrorMessage(error));
    }
  };


  const steps = instructions.split(/\r?\n/).filter((line) => line.trim() !== '');
  const checkedIngredientCount = Object.values(checkedIngredients).filter(Boolean).length;

  const enterCookingMode = () => {
    setIsCooking(true);
    setIngredientsPanelOpen(false);
    setActiveStep((current) => {
      const next = current == null && steps.length > 0 ? 0 : current;
      if (next != null) {
        scrollStepIntoView(next);
      }
      return next;
    });
  };

  const exitCookingMode = () => {
    setIsCooking(false);
    setIngredientsPanelOpen(false);
  };

  // Restore cook progress (URL step wins, then localStorage) when opening a recipe.
  useEffect(() => {
    setCookProgressReady(false);
    if (!recipeId) {
      return;
    }

    let saved = null;
    try {
      const raw = localStorage.getItem(cookProgressKey(recipeId));
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      saved = null;
    }

    const stepParam = new URLSearchParams(window.location.search).get('step');
    const fromUrl = stepParam != null ? Number.parseInt(stepParam, 10) - 1 : NaN;

    if (Number.isFinite(fromUrl) && fromUrl >= 0) {
      setActiveStep(fromUrl);
    } else if (typeof saved?.activeStep === 'number' && saved.activeStep >= 0) {
      setActiveStep(saved.activeStep);
    } else {
      setActiveStep(null);
    }

    if (saved?.checkedIngredients && typeof saved.checkedIngredients === 'object') {
      setCheckedIngredients(saved.checkedIngredients);
    } else {
      setCheckedIngredients({});
    }

    setCookProgressReady(true);
  }, [recipeId]);

  // Clamp active step if instructions change length.
  useEffect(() => {
    if (activeStep == null) {
      return;
    }
    if (steps.length === 0) {
      setActiveStep(null);
      return;
    }
    if (activeStep >= steps.length) {
      setActiveStep(steps.length - 1);
    }
  }, [activeStep, steps.length]);

  // Persist progress + keep ?step= in the URL for handoff/resume.
  useEffect(() => {
    if (!recipeId || !cookProgressReady) {
      return;
    }

    try {
      localStorage.setItem(
        cookProgressKey(recipeId),
        JSON.stringify({
          activeStep,
          checkedIngredients,
        })
      );
    } catch {
      // ignore quota / private mode
    }

    const url = new URL(window.location.href);
    if (activeStep != null && activeStep >= 0) {
      url.searchParams.set('step', String(activeStep + 1));
    } else {
      url.searchParams.delete('step');
    }
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) {
      window.history.replaceState(null, '', next);
    }
  }, [recipeId, activeStep, checkedIngredients, cookProgressReady]);

  const renderIngredientRow = (item, i, keyPrefix = '') => {
    const checked = Boolean(checkedIngredients[i]);
    return (
      <button
        key={`${keyPrefix}${i}`}
        type="button"
        onClick={() => toggleIngredient(i)}
        aria-pressed={checked}
        aria-label={checked ? `Uncheck ${item.name}` : `Check off ${item.name}`}
        className={`group w-full flex items-start gap-2.5 text-left rounded-xl px-1.5 py-1.5 -mx-1.5 transition-colors
          ${checked ? 'bg-slate-50' : 'hover:bg-blue-50/60'}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2`}
      >
        <span
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all shadow-sm
            ${checked
              ? 'bg-brand border-brand scale-105'
              : 'bg-white border-slate-300 group-hover:border-brand/50'
            }`}
          aria-hidden="true"
        >
          {checked ? (
            <FontAwesomeIcon icon={faCheck} className="text-white text-[9px]" />
          ) : (
            <span className="w-1 h-1 rounded-full bg-slate-200 group-hover:bg-blue-200 transition-colors" />
          )}
        </span>
        <span className="min-w-0 pt-px">
          <span
            className={`block text-[15px] font-medium leading-snug transition-colors
              ${checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}
          >
            {item.amount ? `${item.amount} — ${item.name}` : item.name}
          </span>
        </span>
      </button>
    );
  };

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
        <main className={`${shellClass} px-3 sm:px-4 py-2 pb-3`}>
            <div className="max-w-xl mx-auto w-full h-full flex flex-col min-h-0">

            {/* Paper sheet: title + steps/ingredients */}
            <div className="flex flex-col flex-1 min-h-0 bg-white rounded-3xl shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 overflow-hidden">

            {/* Compact title */}
            <div className="shrink-0 px-4 pt-3 pb-2 bg-gradient-to-b from-slate-50/80 to-white">
              <h1 className="text-left text-2xl font-bold text-slate-800 leading-snug">
                {name}
              </h1>
            </div>

            {/* Cook + action buttons */}
            <div className={`shrink-0 px-4 ${isCooking && steps.length > 0 && activeStep != null ? 'pb-2' : 'pb-3'} border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50`}>
              <div className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={isCooking ? exitCookingMode : enterCookingMode}
                  aria-label={isCooking ? 'Exit cooking mode' : 'Enter cook mode'}
                  aria-pressed={isCooking}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold uppercase tracking-widest text-xs transition-all active:scale-[0.99]
                    ${isCooking
                      ? 'bg-brand border-brand text-white shadow-md shadow-blue-200'
                      : 'bg-blue-50/80 text-brand border-blue-100 hover:bg-blue-100 hover:border-blue-200'
                    }`}
                >
                  <FontAwesomeIcon icon={faUtensils} className="text-sm" aria-hidden="true" />
                  {isCooking ? 'Done cooking' : 'Cook mode'}
                </button>

                {!isCooking && owner && props.userId === owner ? (
                  <NavLink
                    to={`/recipes/edit/${recipeId}`}
                    aria-label="Edit recipe"
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-blue-50/50 text-brand border border-blue-100/50 hover:bg-blue-100 hover:border-blue-200 rounded-xl transition-all active:scale-95"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-base" aria-hidden="true" />
                  </NavLink>
                ) : null}

                {owner && props.userId !== owner ? (
                  <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    disabled={Boolean(props.userId) && isFavoriteLoading}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                    aria-pressed={isFavorite}
                    className={`w-10 h-10 shrink-0 flex items-center justify-center transition-all duration-300 rounded-xl border
                      ${isFavorite
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200'
                        : 'bg-amber-50/50 text-amber-500 border-amber-100/50 hover:bg-amber-100 hover:border-amber-200 active:scale-95'
                      }`}
                  >
                    <FontAwesomeIcon
                      icon={faBookmark}
                      className={`text-base transition-all duration-300 ${isFavorite ? 'scale-110' : ''}`}
                    />
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={shareURL}
                  aria-label={isShared ? 'Link copied' : 'Share recipe'}
                  className={`w-10 h-10 shrink-0 flex items-center justify-center transition-all duration-300 rounded-xl border
                    ${isShared
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                      : 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50 hover:bg-emerald-100 hover:border-emerald-200 active:scale-95'
                    }`}
                >
                  <FontAwesomeIcon
                    icon={isShared ? faCheckCircle : faShareAlt}
                    className={`text-base transition-all duration-300 ${isShared ? 'scale-110' : ''}`}
                  />
                </button>
              </div>
            </div>

            {isCooking && steps.length > 0 && activeStep != null ? (
              <div className="shrink-0 px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between gap-2">
                <p className="text-sm font-bold uppercase tracking-widest text-brand tabular-nums">
                  Step {activeStep + 1} of {steps.length}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={activeStep <= 0}
                    onClick={() => selectStep(activeStep - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={activeStep >= steps.length - 1}
                    onClick={() => selectStep(activeStep + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-brand/30 bg-blue-50 text-brand disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}

            {/* Body: view = full vertical; cook = sticky ingredients + steps */}
            <div className="relative flex flex-1 min-h-0 flex-col">

              {isCooking ? (
                <div className="absolute top-0 left-0 right-0 z-40 flex flex-col max-h-[70%]">
                  <button
                    type="button"
                    onClick={() => setIngredientsPanelOpen((open) => !open)}
                    aria-expanded={ingredientsPanelOpen}
                    aria-controls="sticky-ingredients-panel"
                    className="shrink-0 bg-white border-b border-slate-100 shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-left"
                  >
                    <div className="h-1 bg-brand" />
                    <div className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FontAwesomeIcon icon={faListUl} className="text-brand shrink-0" />
                        <span className="text-base font-bold uppercase tracking-widest text-brand truncate">
                          Ingredients
                        </span>
                        {ingredients.length > 0 ? (
                          <span className="text-sm font-semibold text-slate-400 tabular-nums">
                            {checkedIngredientCount}/{ingredients.length}
                          </span>
                        ) : null}
                      </div>
                      <FontAwesomeIcon
                        icon={ingredientsPanelOpen ? faChevronUp : faChevronDown}
                        className="text-brand shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  {ingredientsPanelOpen ? (
                    <div
                      id="sticky-ingredients-panel"
                      className="overflow-y-auto scrollbar-hide bg-white border-b border-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                    >
                      <div className="px-5 py-4 space-y-1">
                        {ingredients.length > 0 ? (
                          ingredients.map((item, i) => renderIngredientRow(item, i, 'cook-'))
                        ) : (
                          <p className="text-sm italic text-slate-400 text-center py-2">
                            No ingredients listed yet.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div
                ref={scrollRef}
                className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide ${isCooking ? 'pt-14' : ''}`}
              >
                {!isCooking ? (
                  <section className="bg-white">
                    <div className="border-b border-slate-100">
                      <div className="h-1 bg-brand" />
                      <div className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faListUl} className="text-brand" />
                          <h2 className="text-base font-bold uppercase tracking-widest text-brand">
                            Ingredients
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pt-2 pb-8">
                      <div className="space-y-1">
                        {ingredients.length > 0 ? (
                          ingredients.map((item, i) => renderIngredientRow(item, i))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4 text-center">
                            <p className="text-sm italic text-slate-400">No ingredients listed yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                ) : null}

                <section className={`bg-white ${!isCooking ? 'border-t border-slate-100' : ''}`}>
                  {!isCooking ? (
                    <div className="border-b border-slate-100">
                      <div className="h-1 bg-brand" />
                      <div className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faMortarPestle} className="text-brand" />
                          <h2 className="text-base font-bold uppercase tracking-widest text-brand">
                            Steps
                          </h2>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="px-5 pt-4 pb-10">
                    <div className="space-y-3 text-left">
                      {steps.length > 0 ? (
                        steps.map((step, i) => {
                          const isActive = activeStep === i;
                          return (
                            <button
                              key={i}
                              type="button"
                              ref={(el) => {
                                stepRefs.current[i] = el;
                              }}
                              onClick={() => selectStep(i)}
                              aria-current={isActive ? 'step' : undefined}
                              aria-label={`Step ${i + 1}${isActive ? ', current step' : ''}`}
                              className={`w-full flex gap-3 text-left rounded-2xl px-3 py-3 transition-all border
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
                                ${isActive
                                  ? 'bg-blue-50 border-brand/40 shadow-sm ring-1 ring-brand/20'
                                  : isCooking && activeStep != null
                                    ? 'bg-white border-transparent opacity-45 hover:opacity-80'
                                    : 'bg-white border-transparent hover:bg-slate-50'
                                }`}
                            >
                              <span
                                className={`text-[14px] font-black h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors
                                  ${isActive ? 'bg-brand text-white' : 'bg-blue-50 text-brand'}`}
                              >
                                {i + 1}
                              </span>
                              <span
                                className={`text-base leading-relaxed font-medium
                                  ${isActive ? 'text-slate-800' : 'text-slate-700'}`}
                              >
                                {step}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                          <p className="text-sm italic text-slate-400">
                            Instructions haven&apos;t been added yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            </div>

            {showUnfavoriteModal && (
              <UnfavoriteModal 
                setShowModal={setShowUnfavoriteModal} 
                onConfirm={confirmFavoriteToggle} 
              />
            )}

            {showSignInToFavoriteModal ? (
              <SignInToFavoriteModal
                onClose={() => setShowSignInToFavoriteModal(false)}
                onSignIn={handleSignInToFavorite}
              />
            ) : null}

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