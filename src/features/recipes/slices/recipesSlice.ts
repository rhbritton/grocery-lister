import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { Recipe, Ingredient } from './recipeSlice.ts';

import recipesConfig from '../config.json';

import { generateSearchIndex, generateWordIndexFromRecipe } from '../../../services/search.js';

import { shouldQueueOffline, isLocalNewer, stripRecipePayloadForFirestore, toRecipeFirestoreFields, docHasPendingWrites, readLocalDocSnapshot, isBrowserOffline, withFirestoreWriteTimeout } from '../../../services/offlineSync.ts';
import { enqueuePendingSync, dequeuePendingSync } from '../../sync/pendingSyncSlice.ts';
import { getRecipeCatalogWithPending, overlayPendingRecipesOnCollections } from '../../sync/pendingRecipeOverlay.ts';
import { mergeRecipesByNewestUpdatedAt } from '../utils/recipeMerge.ts';
import { db, auth, appId } from '../../../auth/firebaseConfig';
import { collection, query, where, getDoc, getDocs, addDoc, doc, documentId, updateDoc, setDoc, limit, 
          startAfter, orderBy, QueryDocumentSnapshot, DocumentData, arrayUnion, arrayRemove, serverTimestamp, Timestamp } from 'firebase/firestore';

interface RecipesState {
  recipes: Recipe[];
  status: string;
  searchTerm: string;
  searchType: string;
  lastVisibleSearch: QueryDocumentSnapshot<DocumentData> | null;
  allRecipesGrabbed: boolean | null;
  error: string | null;
  allRecipes: Recipe[];
  allRecipesSorted: Recipe[];
  isFavoriteLoading: boolean | null;
  favoriteRecipes: Recipe[];
};

const initialState: RecipesState = {
  recipes: [],
  status: 'idle',
  searchTerm: '',
  searchType: 'Name',
  lastVisibleSearch: null,
  allRecipesGrabbed: false,
  error: null,
  allRecipes: [],
  allRecipesSorted: [],
  isFavoriteLoading: false,
  favoriteRecipes: [],
};

const filterRecipesInState = (state: RecipesState, searchTerm: string, searchType = 'name') => {
  state.recipes = state.allRecipes.filter((recipe) => {
    if (searchType == 'name') {
      return recipe.name.toLowerCase().includes(searchTerm);
    } else if (searchType == 'ingredient') {
      return recipe.ingredients.some(function(ing) {
        return ing.name.toLowerCase().includes(searchTerm);
      });
    }
    return true;
  });
};

export const selectMaxRecipeTimestamp = (state: RootState) => {
  const recipes = state.recipes.allRecipes;
  if (!recipes || recipes.length === 0) return 0;
  
  // Find the highest number in your updatedAt fields
  return Math.max(...recipes.map(r => r.updatedAt || 0));
};

export const syncRecipesFromFirestore = createAsyncThunk(
  'recipes/sync',
  async ({ userId, lastSyncTimestamp }, { rejectWithValue }) => {
    try {
      const lastSyncDate = Timestamp.fromMillis((lastSyncTimestamp + 1) * 1000);
      
      const recipesRef = collection(db, 'recipes');
      let q;
      if (lastSyncTimestamp) {
        q = query(
          recipesRef,
          where('userId', '==', userId),
          where('updatedAt', '>', lastSyncDate)
        );
      } else {
        q = query(
          recipesRef,
          where('userId', '==', userId),
          where('updatedAt', '>=', lastSyncDate)
        );
      }

      const querySnapshot = await getDocs(q);

      let map = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          fbid: doc.id,
          ...data,
          updatedAt: data.updatedAt?.seconds || data.updatedAt || 0
        };
      })
      
      return map;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const sortRecipes = (recipes) => {
  recipes.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

const normalizeRecipe = (recipe) => {
  const { offlineQueued, ...rest } = recipe;
  return {
    ...rest,
    fbid: rest.fbid || rest.id,
    updatedAt: rest.updatedAt || Math.floor(Date.now() / 1000),
  };
};

export { mergeRecipesByNewestUpdatedAt } from '../utils/recipeMerge.ts';

export const upsertRecipeInState = (state, recipe) => {
  const normalized = normalizeRecipe(recipe);
  if (!normalized.fbid) return;

  if (!state.allRecipes) state.allRecipes = [];
  if (!state.allRecipesSorted) state.allRecipesSorted = [];
  if (!state.recipes) state.recipes = [];
  if (!state.favoriteRecipes) state.favoriteRecipes = [];

  const masterIndex = state.allRecipes.findIndex(
    (r) => r.fbid === normalized.fbid || r.id === normalized.fbid
  );
  if (masterIndex !== -1) {
    state.allRecipes[masterIndex] = { ...state.allRecipes[masterIndex], ...normalized };
  } else {
    state.allRecipes.push(normalized);
  }

  const favIndex = state.favoriteRecipes.findIndex(
    (r) => r.fbid === normalized.fbid || r.id === normalized.fbid
  );
  if (favIndex !== -1) {
    state.favoriteRecipes[favIndex] = {
      ...state.favoriteRecipes[favIndex],
      ...normalized,
      favorited: true,
    };
  }

  const sortedCopy = [...state.allRecipes];
  sortRecipes(sortedCopy);
  state.allRecipesSorted = sortedCopy;

  const uiIndex = state.recipes.findIndex(
    (r) => r.fbid === normalized.fbid || r.id === normalized.fbid
  );
  if (uiIndex !== -1) {
    state.recipes[uiIndex] = { ...state.recipes[uiIndex], ...normalized };
  }
};

export const removeRecipeFromState = (state, fbid: string) => {
  const matches = (recipe: Recipe) =>
    recipe.fbid === fbid || recipe.id === fbid;

  state.allRecipes = (state.allRecipes || []).filter((recipe) => !matches(recipe));
  state.allRecipesSorted = (state.allRecipesSorted || []).filter(
    (recipe) => !matches(recipe)
  );
  state.recipes = (state.recipes || []).filter((recipe) => !matches(recipe));
  state.favoriteRecipes = (state.favoriteRecipes || []).filter(
    (recipe) => !matches(recipe)
  );
};

export const getAllFavoriteRecipesFromFirestore = createAsyncThunk(
  'recipes/fetchAllFavoriteRecipes',
  async (userId, { rejectWithValue }) => {
    try {
      // 1. Get the list of favorite snippets
      const userFavRef = doc(db, 'recipe-favorites', userId);
      const favSnap = await getDoc(userFavRef);
      
      if (!favSnap.exists()) return [];
      
      const favoriteSnippets = favSnap.data().favorites || [];
      const favoriteIds = favoriteSnippets.map(fav => fav.id);

      if (favoriteIds.length === 0) return [];

      // 2. Fetch full documents in batches
      const recipesCollectionRef = collection(db, 'recipes');
      const batches = [];
      for (let i = 0; i < favoriteIds.length; i += 30) {
        const chunk = favoriteIds.slice(i, i + 30);
        const q = query(recipesCollectionRef, where(documentId(), 'in', chunk));
        batches.push(getDocs(q));
      }

      const snapshots = await Promise.all(batches);
      const foundRecipes = snapshots.flatMap(snapshot => 
        snapshot.docs.map(doc => ({
          fbid: doc.id,
          favorited: true,
          ...doc.data(),
          updatedAt: doc.data()?.updatedAt?.seconds || 0
        }))
      );

      // --- SELF-HEALING LOGIC ---
      // 3. Identify which IDs were NOT found (they were deleted from the 'recipes' collection)
      const foundIds = new Set(foundRecipes.map(r => r.fbid));
      const missingSnippets = favoriteSnippets.filter(fav => !foundIds.has(fav.id));

      if (missingSnippets.length > 0) {
        // Remove the dead references from Firestore so we don't fetch them next time
        await updateDoc(userFavRef, {
          updatedAt: serverTimestamp(),
          favorites: arrayRemove(...missingSnippets)
        });
      }
      // --- END SELF-HEALING ---

      return foundRecipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getAllRecipesFromFirestore = createAsyncThunk(
  'recipes/fetchAllRecipes',
  async (userId, { rejectWithValue }) => {
    try {
      let q;
      const recipesCollectionRef = collection(db, 'recipes');
      q = query(
        recipesCollectionRef,
        where('userId', '==', userId),
        where('isDeleted', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      let recipes = querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data(),
        updatedAt: doc.data()?.updatedAt?.seconds || 0
      }));

      return recipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchRecipesFromAll = createAsyncThunk(
  'recipes/searchRecipesFromAll',
  async ({ searchTerm = '', searchType }, { getState, rejectWithValue }) => {
    try {
      if (searchType) searchType = searchType.toLowerCase().trim();
      if (searchTerm) searchTerm = searchTerm.toLowerCase().trim();

      const state = getState() as RootState;
      const { allRecipes, favoriteRecipes } = state.recipes;
      const queue = state.pendingSync?.queue ?? [];

      const sourceList = getRecipeCatalogWithPending(allRecipes, favoriteRecipes, queue);

      // 2. Perform the filter based on the searchType
      let filteredResults = sourceList.filter((recipe) => {
        if (!searchTerm) return true; // Show all if search is empty

        if (searchType === 'ingredient') {
          // Check ingredient_keywords array
          return recipe.ingredient_keywords?.some(keyword => 
            keyword.toLowerCase().includes(searchTerm)
          );
        } else {
          // Default to name/keyword search
          // Check search_keywords array
          return recipe.name?.toLowerCase().includes(searchTerm);
        }
      });

      // 3. Final Sort: Alphabetical by name_lowercase
      filteredResults.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });

      // 4. Return the results for the reducer to put into state.recipes
      return filteredResults;
    } catch (error) {
      console.error("Local search error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const getRecipesFromFirestore = createAsyncThunk(
  'recipes/fetchRecipes',
  async ({ resetPagination, userId, searchTerm='', searchType, existingRecipes=[], includeFavorites=false }, { getState, rejectWithValue }) => {
    const pageCount = 5;
    if (searchType)
      searchType = searchType.toLowerCase().trim();

    if (searchTerm)
      searchTerm = searchTerm.toLowerCase().trim();
    
    const isLazyLoading = !searchTerm;
    if (!isLazyLoading)
      resetPagination = true;

    const state = getState() as RootState;
    const lastVisible = resetPagination ? null : state.recipes.lastVisibleSearch;

    try {
      const recipesCollectionRef = collection(db, 'recipes');
      let queryConstraints: any[] = [
        where('userId', '==', userId),
        where('isDeleted', '==', false)
      ];

      if (isLazyLoading) {
        queryConstraints.push(orderBy('name_lowercase'));
        queryConstraints.push(limit(pageCount));
        
        if (lastVisible) {
          queryConstraints.push(startAfter(lastVisible));
        }
      } else {
        if (searchType === 'name') {
          queryConstraints.push(
            where('search_keywords', 'array-contains', searchTerm)
          );
        } else if (searchType === 'ingredient') {
          queryConstraints.push(
            where('ingredient_keywords', 'array-contains', searchTerm)
          );
        }
      }

      const q = query(recipesCollectionRef, ...queryConstraints);
      
      const querySnapshot = await getDocs(q);
      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      let newAllRecipesGrabbed = false;
      if (isLazyLoading) {
          if (querySnapshot.docs.length < pageCount) {
              newAllRecipesGrabbed = true;
          }
      }

      let recipes = querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data(),
        updatedAt: doc.data()?.updatedAt?.seconds || 0
      }));

      // GEMINI TODO: get state.recipes.favoriteRecipes { id: id, name: name } and sort by name, and select names that are greater than first in recipes { name: name }, and less than or equal to last in recipes, use lowercase version of names to compare
      // --- START FAVORITES INTEGRATION ---
      const favoriteRecipes = state.recipes.favoriteRecipes || [];
      
      if (isLazyLoading && favoriteRecipes.length > 0 && recipes.length > 0) {
        // 1. Determine the alphabetical range of the current Firestore batch
        const firstBatchName = recipes[0].name_lowercase;
        const lastBatchName = recipes[recipes.length - 1].name_lowercase;

        // 2. Filter favorites that fall within this range
        const matchingFavorites = favoriteRecipes.filter(fav => {
          const favName = fav.name.toLowerCase();
          // We include favorites >= first and <= last of current batch
          // If it's the very first page (resetPagination), we include everything up to lastBatchName
          const isAfterStart = resetPagination ? true : favName >= firstBatchName;
          const isBeforeEnd = favName <= lastBatchName;
          
          return isAfterStart && isBeforeEnd;
        });
        
        // GEMINI TODO: lets fetch the real recipes for all matchingFavorites in the recipes collection based on fav.id
        // 3. Fetch full documents for these favorites
        let fullFavoriteRecipes = [];
        if (matchingFavorites.length > 0) {
          const favIdsToFetch = matchingFavorites.map(f => f.id);
          const favBatches = [];

          // Firestore 'in' limit is 30
          for (let i = 0; i < favIdsToFetch.length; i += 30) {
            const chunk = favIdsToFetch.slice(i, i + 30);
            const qFavs = query(recipesCollectionRef, where(documentId(), 'in', chunk));
            favBatches.push(getDocs(qFavs));
          }

          const favSnapshots = await Promise.all(favBatches);
          fullFavoriteRecipes = favSnapshots.flatMap(snap => 
            snap.docs.map(doc => ({ 
              fbid: doc.id, 
              favorited: true, 
              ...doc.data(), 
              updatedAt: doc.data()?.updatedAt?.seconds || 0
            }))
          );
        }


        // 4. Merge and Deduplicate
        const recipeIdsInBatch = new Set(recipes.map(r => r.fbid));
        const uniqueFavorites = fullFavoriteRecipes.filter(fav => !recipeIdsInBatch.has(fav.fbid));

        // 5. Combine and Sort
        recipes = [...recipes, ...uniqueFavorites].sort((a, b) => {
          const nameA = (a.name_lowercase || a.name.toLowerCase());
          const nameB = (b.name_lowercase || b.name.toLowerCase());
          return nameA.localeCompare(nameB);
        });
      }
      // --- END FAVORITES INTEGRATION ---







      if (!isLazyLoading && searchType == 'ingredient') {
        // TODO: ElasticSearch should probably be used instead
        recipes = recipes.filter((recipe) => {
          if (searchType == 'ingredient') {
            return recipe.ingredients.some(function(ing) {
              return ing.name.toLowerCase().includes(searchTerm);
            });
          }
        });
      }
      
      if (!isLazyLoading) {
        recipes = recipes.sort((a, b) => {
          if (a.name_lowercase < b.name_lowercase) {
            return -1;
          } else {
            return 1;
          }
        })
      }
      
      const combinedRecipes = !isLazyLoading ? recipes : [...existingRecipes, ...recipes];

      return { recipes: combinedRecipes, lastVisibleSearch: newLastVisible, allRecipesGrabbed: newAllRecipesGrabbed };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addRecipesToFirestore = createAsyncThunk(
  'recipes/addRecipes',
  async (recipesData, { rejectWithValue }) => {
    try {
      if (!Array.isArray(recipesData)) {
        return rejectWithValue('Input must be an array of recipes.');
      }

      const addedRecipes = [];
      const now = Math.floor(Date.now() / 1000);
      for (const recipeData of recipesData) {
        const payload = stripRecipePayloadForFirestore({
          id: nanoid(),
          isDeleted: false,
          ...recipeData,
        });
        const name_lowercase = payload.name ? String(payload.name).trim().toLowerCase() : '';

        const docRef = await addDoc(collection(db, 'recipes'), {
          ...toRecipeFirestoreFields(payload, {
            search_keywords: generateSearchIndex(name_lowercase),
            ingredient_keywords: generateWordIndexFromRecipe(payload),
          }),
          updatedAt: serverTimestamp(),
        });

        addedRecipes.push({
          fbid: docRef.id,
          ...payload,
          isDeleted: false,
          name_lowercase,
          updatedAt: now,
        });
      }

      return addedRecipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addRecipeToFirestore = createAsyncThunk(
  'recipes/addRecipe',
  async (recipeData, { dispatch, rejectWithValue }) => {
    const now = Math.floor(Date.now() / 1000);
    const localId = recipeData.id || nanoid();
    const payload = stripRecipePayloadForFirestore({ ...recipeData, id: localId });

    const queueAndReturn = () => {
      dispatch(enqueuePendingSync({
        type: 'addRecipe',
        id: `addRecipe:${localId}`,
        payload,
      }));
      const name_lowercase = payload.name ? payload.name.trim().toLowerCase() : '';
      return {
        fbid: `pending-${localId}`,
        ...payload,
        isDeleted: false,
        name_lowercase,
        updatedAt: now,
        offlineQueued: true,
      };
    };

    if (isBrowserOffline()) {
      return queueAndReturn();
    }

    try {
      const name_lowercase = payload.name ? String(payload.name).trim().toLowerCase() : '';
      const docRef = await withFirestoreWriteTimeout(
        addDoc(collection(db, 'recipes'), {
          ...toRecipeFirestoreFields(payload, { name_lowercase }),
          updatedAt: serverTimestamp(),
        })
      );
      dispatch(dequeuePendingSync(`addRecipe:${localId}`));
      const offlineQueued = await docHasPendingWrites(docRef);
      return {
        fbid: docRef.id,
        ...payload,
        isDeleted: false,
        name_lowercase,
        updatedAt: now,
        offlineQueued,
      };
    } catch (error) {
      if (shouldQueueOffline(error)) {
        return queueAndReturn();
      }
      return rejectWithValue(error.message);
    }
  }
);

export const editRecipeFromFirestore = createAsyncThunk(
  'recipes/editRecipe',
  async (recipeData, { dispatch, getState, rejectWithValue }) => {
    const now = Math.floor(Date.now() / 1000);
    const state = getState() as RootState;
    const cached = [...state.recipes.allRecipes, ...state.recipes.favoriteRecipes].find(
      (r) =>
        r.fbid === recipeData.fbid ||
        r.id === recipeData.fbid ||
        r.fbid === recipeData.id
    );

    const merged = {
      ...cached,
      ...recipeData,
      fbid: recipeData.fbid || cached?.fbid,
      userId: recipeData.userId ?? cached?.userId,
      id: recipeData.id ?? cached?.id,
    };

    const fbid = merged.fbid;
    const pendingId = `editRecipe:${fbid}`;
    const payload = stripRecipePayloadForFirestore(merged);

    const queueAndReturn = () => {
      dispatch(enqueuePendingSync({
        type: 'editRecipe',
        id: pendingId,
        payload: { ...payload, fbid },
      }));
      return { ...payload, fbid, updatedAt: now, offlineQueued: true };
    };

    if (isBrowserOffline()) {
      return queueAndReturn();
    }

    try {
      const docRef = doc(db, 'recipes', fbid);
      const name_lowercase = payload.name ? String(payload.name).trim().toLowerCase() : '';
      await withFirestoreWriteTimeout(
        updateDoc(docRef, {
          ...toRecipeFirestoreFields(payload, {
            name_lowercase,
            search_keywords: generateSearchIndex(name_lowercase),
            ingredient_keywords: generateWordIndexFromRecipe(payload),
          }),
          updatedAt: serverTimestamp(),
        })
      );

      dispatch(dequeuePendingSync(pendingId));

      const updatedSnapshot = await readLocalDocSnapshot(docRef);
      if (updatedSnapshot?.exists()) {
        const data = updatedSnapshot.data();
        const pending = updatedSnapshot.metadata.hasPendingWrites;
        return {
          ...payload,
          fbid,
          updatedAt: data?.updatedAt?.seconds || now,
          offlineQueued: pending,
        };
      }

      const offlineQueued = await docHasPendingWrites(docRef);
      return { ...payload, fbid, updatedAt: now, offlineQueued };
    } catch (error) {
      if (shouldQueueOffline(error)) {
        return queueAndReturn();
      }
      console.error('error', error);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteRecipeFromFirestore = createAsyncThunk(
  'recipes/deleteRecipe',
  async (fbid, { dispatch, rejectWithValue }) => {
    const pendingId = `deleteRecipe:${fbid}`;

    const queueAndReturn = () => {
      dispatch(enqueuePendingSync({
        type: 'deleteRecipe',
        id: pendingId,
        payload: fbid,
      }));
      return fbid;
    };

    if (isBrowserOffline()) {
      return queueAndReturn();
    }

    try {
      const docRef = doc(db, 'recipes', fbid);
      await withFirestoreWriteTimeout(
        updateDoc(docRef, {
          isDeleted: true,
          updatedAt: serverTimestamp(),
        })
      );

      dispatch(dequeuePendingSync(pendingId));
      return fbid;
    } catch (error) {
      if (shouldQueueOffline(error)) {
        return queueAndReturn();
      }
      return rejectWithValue(error.message);
    }
  }
);

export const toggleFavoriteRecipeInFirestore = createAsyncThunk(
  'user/toggleFavorite',
  async ({ userId, recipeId, recipeName, isAdding }, { dispatch, getState, rejectWithValue }) => {
    const pendingId = `toggleFavorite:${userId}:${recipeId}`;

    const findRecipeInState = () => {
      const state = getState() as RootState;
      return [...state.recipes.favoriteRecipes, ...state.recipes.allRecipes]
        .find((r) => r.fbid === recipeId || r.id === recipeId);
    };

    try {
      const userRef = doc(db, "recipe-favorites", userId);
      const favoriteItem = { id: recipeId, name: recipeName };

      await setDoc(userRef, {
        userId: userId,
        updatedAt: serverTimestamp(),
        favorites: isAdding 
          ? arrayUnion(favoriteItem) 
          : arrayRemove(favoriteItem)
      }, { merge: true });

      dispatch(dequeuePendingSync(pendingId));

      try {
        const recipeRef = doc(db, "recipes", recipeId);
        const recipeSnap = await getDoc(recipeRef);
        if (recipeSnap.exists()) {
          return {
            recipe: {
              id: recipeSnap.id,
              fbid: recipeSnap.id,
              ...recipeSnap.data()
            },
            isAdding,
          };
        }
      } catch (_) {
        // Fall back to local recipe data when offline.
      }

      const cachedRecipe = findRecipeInState();
      if (cachedRecipe) {
        return { recipe: cachedRecipe, isAdding };
      }

      throw new Error("Recipe not found");
    } catch (error) {
      if (shouldQueueOffline(error)) {
        dispatch(enqueuePendingSync({
          type: 'toggleFavorite',
          id: pendingId,
          payload: { userId, recipeId, recipeName, isAdding },
        }));
        const cachedRecipe = findRecipeInState();
        if (cachedRecipe) {
          return { recipe: cachedRecipe, isAdding, offlineQueued: true };
        }
      }
      return rejectWithValue(error.message);
    }
  }
);

export const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    setRecipeSearchParams: (state, action) => {
      state.searchTerm = action.payload.searchTerm;
      state.searchType = action.payload.searchType;
    },
    setRecipes: (state, action) => {
      state.recipes = action.payload;
    },
    addRecipe: (state, action) => {
      const newRecipe = { id: nanoid(), ...action.payload };
      state.allRecipes.push(newRecipe);
      filterRecipesInState(state, '');
    },
    editRecipe: (state, action) => {
      const indexToChange = state.allRecipes.findIndex(
        (recipe) => recipe.id === action.payload.recipeId
      );

      if (indexToChange !== -1) {
        state.allRecipes[indexToChange] = {
          id: action.payload.recipeId,
          name: action.payload.name,
          ingredients: action.payload.ingredients,
          instructions: action.payload.instructions
        };
        filterRecipesInState(state, '');
      }
    },
    deleteRecipe: (state, action) => {
      const indexToDelete = state.allRecipes.findIndex(
        (recipe) => recipe.id === action.payload.recipeId
      );

      if (indexToDelete !== -1) {
        state.allRecipes.splice(indexToDelete, 1);
        filterRecipesInState(state, '');
      }
    },
    searchRecipes: (state, action) => {
      const searchTerm = action.payload.searchString.toLowerCase();
      const searchType = action.payload.searchType.toLowerCase();
      filterRecipesInState(state, searchTerm, searchType);
    },
    upsertRecipe: (state, action) => {
      upsertRecipeInState(state, action.payload);
    },
    setRecipeCollections: (state, action) => {
      state.allRecipes = action.payload.allRecipes || [];
      state.favoriteRecipes = action.payload.favoriteRecipes || [];
      const sortedCopy = [...state.allRecipes];
      sortRecipes(sortedCopy);
      state.allRecipesSorted = sortedCopy;
    },
    removeRecipeByFbid: (state, action) => {
      removeRecipeFromState(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncRecipesFromFirestore.fulfilled, (state, action) => {
        const incoming = action.payload;

        if (!incoming.length) {
          state.status = 'succeeded';
          return;
        }

        incoming.forEach((updatedRecipe) => {
          const masterIndex = state.allRecipes.findIndex(r => r.fbid === updatedRecipe.fbid);

          if (masterIndex !== -1 && isLocalNewer(state.allRecipes[masterIndex].updatedAt, updatedRecipe.updatedAt)) {
            return;
          }

          if (updatedRecipe.isDeleted) {
            if (masterIndex !== -1) state.allRecipes.splice(masterIndex, 1);
          } else {
            if (masterIndex !== -1) state.allRecipes[masterIndex] = updatedRecipe;
            else state.allRecipes.push(updatedRecipe);
          }

          const uiIndex = state.recipes.findIndex(r => r.fbid === updatedRecipe.fbid);
          if (uiIndex !== -1) {
            if (masterIndex !== -1 && isLocalNewer(state.recipes[uiIndex].updatedAt, updatedRecipe.updatedAt)) {
              return;
            }
            if (updatedRecipe.isDeleted) state.recipes.splice(uiIndex, 1);
            else state.recipes[uiIndex] = updatedRecipe;
          }
        });

        // 3. Sync the Sorted Cache (allRecipesSorted)
        const sortedCopy = [...state.allRecipes];
        sortRecipes(sortedCopy); 
        state.allRecipesSorted = sortedCopy;

        state.status = 'succeeded';
      })
      .addCase(getAllRecipesFromFirestore.pending, (state) => {

      })
      .addCase(getAllRecipesFromFirestore.fulfilled, (state, action) => {
        state.allRecipes = action.payload || [];

        let allRecipesSorted = action.payload;
        sortRecipes(allRecipesSorted);
        state.allRecipesSorted = allRecipesSorted;
      })
      .addCase(getAllRecipesFromFirestore.rejected, (state, action) => {

      })
      .addCase(getRecipesFromFirestore.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getRecipesFromFirestore.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.recipes = action.payload && action.payload.recipes ? action.payload.recipes : [];
        state.lastVisibleSearch = action.payload && action.payload.lastVisibleSearch ? action.payload.lastVisibleSearch : null;
        state.allRecipesGrabbed = action.payload && action.payload.allRecipesGrabbed ? action.payload.allRecipesGrabbed : null;
      })
      .addCase(getRecipesFromFirestore.rejected, (state, action) => {
        state.status = 'failed';
      })
      .addCase(addRecipesToFirestore.pending, (state) => {
        
      })
      .addCase(addRecipesToFirestore.fulfilled, (state, action) => {
        if (!state.recipes)
          state.recipes = [];

        state.recipes.push(...action.payload);
        
        if (!state.allRecipes)
          state.allRecipes = [];

        state.allRecipes.push(...action.payload);
        state.allRecipesSorted.push(...action.payload);
        sortRecipes(state.allRecipesSorted);
      })
      .addCase(addRecipesToFirestore.rejected, (state, action) => {
      
      })
      .addCase(addRecipeToFirestore.pending, (state) => {
        
      })
      .addCase(addRecipeToFirestore.fulfilled, (state, action) => {
        if (!action.payload) return;

        if (action.payload.id) {
          state.allRecipes = (state.allRecipes || []).filter(
            (recipe) => recipe.fbid !== `pending-${action.payload.id}`
          );
          state.recipes = (state.recipes || []).filter(
            (recipe) => recipe.fbid !== `pending-${action.payload.id}`
          );
          state.allRecipesSorted = (state.allRecipesSorted || []).filter(
            (recipe) => recipe.fbid !== `pending-${action.payload.id}`
          );
        }

        upsertRecipeInState(state, action.payload);
      })
      .addCase(addRecipeToFirestore.rejected, (state, action) => {
      
      })
      .addCase(editRecipeFromFirestore.pending, (state, action) => {
        upsertRecipeInState(state, action.meta.arg);
      })
      .addCase(editRecipeFromFirestore.fulfilled, (state, action) => {
        if (!action.payload) return;
        upsertRecipeInState(state, action.payload);
      })
      .addCase(editRecipeFromFirestore.rejected, (state, action) => {
      
      })
      .addCase(deleteRecipeFromFirestore.pending, (state, action) => {
        removeRecipeFromState(state, action.meta.arg);
      })
      .addCase(deleteRecipeFromFirestore.fulfilled, (state, action) => {
        removeRecipeFromState(state, action.payload);
      })
      .addCase(deleteRecipeFromFirestore.rejected, (state, action) => {
        
      })
      .addCase(toggleFavoriteRecipeInFirestore.pending, (state) => {
        state.isFavoriteLoading = true;
      })
      .addCase(toggleFavoriteRecipeInFirestore.fulfilled, (state, action) => {
        state.isFavoriteLoading = false;
        
        // Assuming action.payload contains { recipe, isAdded }
        const { recipe, isAdding } = action.payload;

        if (isAdding) {
          // Add to the list if not already there
          const exists = state.favoriteRecipes.find(f => f.fbid === recipe.fbid);
          if (!exists) {
            state.favoriteRecipes.push({ ...recipe, favorited: true });
          }

          // 2. Check if it should be injected into the current search results
          if (state.recipes.length > 0) {
            const first = state.recipes[0].name_lowercase;
            const last = state.recipes[state.recipes.length - 1].name_lowercase;
            const targetName = recipe.name.toLowerCase();

            const targetIsBeforeFirst = targetName <= state.recipes[0].name_lowercase;
            const targetIsAfterLastWithNoMoreRecipes = state.allRecipesGrabbed && targetName >= state.recipes[0].name_lowercase

            // If it fits alphabetically in the current "window"
            if (targetIsBeforeFirst || targetIsAfterLastWithNoMoreRecipes || (targetName >= first && targetName <= last)) {
              const existsInSearch = state.recipes.find(r => r.fbid === recipe.fbid);
              
              if (!existsInSearch) {
                // Prepare the recipe for the list
                const recipeWithFlag = { ...recipe, favorited: true };
                
                // Push and re-sort so it doesn't just appear at the bottom
                state.recipes.push(recipeWithFlag);
                state.recipes.sort((a, b) => 
                  a.name_lowercase.localeCompare(b.name_lowercase)
                );
              } else {
                // If it was already there (user's own recipe), just turn on the heart
                existsInSearch.favorited = true;
              }
            }
          }
        } else {
          // Remove from the list
          state.favoriteRecipes = state.favoriteRecipes.filter(
            f => f.fbid !== recipe.fbid
          );

          state.recipes = state.recipes.filter(r => r.fbid !== recipe.fbid);
        }
      })
      .addCase(toggleFavoriteRecipeInFirestore.rejected, (state) => {
        state.isFavoriteLoading = false;
      })
      .addCase(getAllFavoriteRecipesFromFirestore.pending, (state) => {
        
      })
      .addCase(getAllFavoriteRecipesFromFirestore.fulfilled, (state, action) => {
        const incoming = action.payload || [];
        state.favoriteRecipes = incoming.map((incomingRecipe) => {
          const id = incomingRecipe.fbid || incomingRecipe.id;
          const localAll = state.allRecipes.find(
            (recipe) => recipe.fbid === id || recipe.id === id
          );
          const localFav = state.favoriteRecipes.find(
            (recipe) => recipe.fbid === id || recipe.id === id
          );
          const merged = mergeRecipesByNewestUpdatedAt(
            [localAll, localFav, incomingRecipe].filter(Boolean)
          )[0];

          return merged
            ? { ...merged, favorited: true }
            : { ...incomingRecipe, favorited: true };
        });
      })
      .addCase(getAllFavoriteRecipesFromFirestore.rejected, (state) => {
        
      })
      .addCase(searchRecipesFromAll.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchRecipesFromAll.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.recipes = action.payload || [];
      })
      .addCase(searchRecipesFromAll.rejected, (state, action) => {
        state.status = 'failed';
      });
  },
});

export const {
  setRecipeSearchParams,
  setRecipes,
  addRecipe,
  editRecipe,
  deleteRecipe,
  searchRecipes,
  upsertRecipe,
  setRecipeCollections,
  removeRecipeByFbid,
} = recipesSlice.actions

/** Re-apply queued recipe writes after redux-persist rehydrate (offline cold start). */
export const applyPendingRecipesFromSyncQueue = createAsyncThunk(
  'recipes/applyPendingFromSyncQueue',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const queue = state.pendingSync?.queue ?? [];
    if (!queue.length) return;

    const { allRecipes, favoriteRecipes } = state.recipes;
    const next = overlayPendingRecipesOnCollections(allRecipes, favoriteRecipes, queue);
    dispatch(setRecipeCollections(next));
  }
);

export const fetchRecipes = (storedRecipes: any) => (dispatch: any) => {
  dispatch(setRecipes(storedRecipes));
};

export const selectRecipes = (state: RootState) => state.recipes.recipes;

export default recipesSlice.reducer;