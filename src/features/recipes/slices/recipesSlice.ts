import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { Recipe, Ingredient } from './recipeSlice.ts';

import recipesConfig from '../config.json';

import { generateSearchIndex, generateWordIndexFromRecipe } from '../../../services/search.js';

import store from 'store2';
import { db, auth, appId } from '../../../auth/firebaseConfig';
import { collection, query, where, getDoc, getDocs, addDoc, doc, documentId, updateDoc, setDoc, deleteDoc, limit, 
          startAfter, orderBy, QueryDocumentSnapshot, DocumentData, arrayUnion, arrayRemove } from 'firebase/firestore';

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

export const getAllRecipes = async () => {
  let all_recipes = store('recipes');

  return all_recipes;
}

const sortRecipes = (recipes) => {
  recipes.sort((a, b) => {
    const nameA = (a.name_lowercase || a.name.toLowerCase());
    const nameB = (b.name_lowercase || b.name.toLowerCase());
    return nameA.localeCompare(nameB);
  });
}

const getRecipesBySearch = (state, searchTerm, searchType = 'name') => {
  let all_recipes = getAllRecipes();

  state.recipes = all_recipes.filter((recipe) => {
    if (searchType == 'name') {
      return recipe.name.toLowerCase().includes(searchTerm);
    } else if (searchType == 'ingredient') {
      return recipe.ingredients.some(function(ing) {
        return ing.name.toLowerCase().includes(searchTerm);
      });
    }
  });
}

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
          ...doc.data()
        }))
      );

      // --- SELF-HEALING LOGIC ---
      // 3. Identify which IDs were NOT found (they were deleted from the 'recipes' collection)
      const foundIds = new Set(foundRecipes.map(r => r.fbid));
      const missingSnippets = favoriteSnippets.filter(fav => !foundIds.has(fav.id));

      if (missingSnippets.length > 0) {
        // Remove the dead references from Firestore so we don't fetch them next time
        await updateDoc(userFavRef, {
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
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      let recipes = querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data()
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

      // 1. Combine both lists and ensure uniqueness by ID
      // We prioritize favoriteRecipes because they already have the 'favorited: true' flag
      const combined = [...favoriteRecipes, ...allRecipes];
      const uniqueMap = new Map();
      
      combined.forEach(recipe => {
        const id = recipe.fbid || recipe.id;
        if (!uniqueMap.has(id)) {
          uniqueMap.set(id, recipe);
        }
      });

      const sourceList = Array.from(uniqueMap.values());

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
          return recipe.search_keywords?.some(keyword => 
            keyword.toLowerCase().includes(searchTerm)
          );
        }
      });

      // 3. Final Sort: Alphabetical by name_lowercase
      filteredResults.sort((a, b) => {
        const nameA = a.name_lowercase || a.name?.toLowerCase() || '';
        const nameB = b.name_lowercase || b.name?.toLowerCase() || '';
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
        ...doc.data()
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
            snap.docs.map(doc => ({ fbid: doc.id, favorited: true, ...doc.data() }))
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
      for (const recipeData of recipesData) {
        let name_lowercase = recipeData.name ? recipeData.name.trim().toLowerCase() : '';
        const newRecipe = { 
          id: nanoid(), 
          ...recipeData, 
          name_lowercase: name_lowercase,
          search_keywords: generateSearchIndex(name_lowercase),
          ingredient_keywords: generateWordIndexFromRecipe(recipeData),
        };
        const docRef = await addDoc(collection(db, 'recipes'), newRecipe);
        addedRecipes.push({ fbid: docRef.id, ...newRecipe });
      }

      return addedRecipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addRecipeToFirestore = createAsyncThunk(
  'recipes/addRecipe',
  async (recipeData, { rejectWithValue }) => {
    try {
      let name_lowercase = recipeData.name ? recipeData.name.trim().toLowerCase() : '';
      const newRecipe = {
        id: nanoid(), 
        ...recipeData,
        name_lowercase: name_lowercase,
        search_keywords: generateSearchIndex(name_lowercase),
        ingredient_keywords: generateWordIndexFromRecipe(recipeData),
      };
      const docRef = await addDoc(collection(db, 'recipes'), newRecipe);
      return { fbid: docRef.id, ...newRecipe };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const editRecipeFromFirestore = createAsyncThunk(
  'recipes/editRecipe',
  async (recipeData, { rejectWithValue }) => {
    try {
      const docRef = doc(db, 'recipes', recipeData.fbid);
      let name_lowercase = recipeData.name ? recipeData.name.trim().toLowerCase() : '';
      const updatedData = { 
        ...recipeData,
        name_lowercase: name_lowercase,
        search_keywords: generateSearchIndex(name_lowercase),
        ingredient_keywords: generateWordIndexFromRecipe(recipeData),
      };
      delete updatedData.fbid;
      await updateDoc(docRef, updatedData);

      return recipeData;
    } catch (error) {
      console.log('error', error)
      return rejectWithValue(error.message);
    }
  }
);

export const deleteRecipeFromFirestore = createAsyncThunk(
  'recipes/deleteRecipe',
  async (fbid, { rejectWithValue }) => {
    try {
      const docRef = doc(db, 'recipes', fbid);
      await deleteDoc(docRef);

      return fbid;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleFavoriteRecipeInFirestore = createAsyncThunk(
  'user/toggleFavorite',
  async ({ userId, recipeId, recipeName, isAdding }, { rejectWithValue }) => {
    try {
      const userRef = doc(db, "recipe-favorites", userId);
      const favoriteItem = { id: recipeId, name: recipeName };

      await setDoc(userRef, {
        userId: userId,
        favorites: isAdding 
          ? arrayUnion(favoriteItem) 
          : arrayRemove(favoriteItem)
      }, { merge: true });

      // 2. Fetch the full recipe document to return to the reducer
      const recipeRef = doc(db, "recipes", recipeId);
      const recipeSnap = await getDoc(recipeRef);

      if (!recipeSnap.exists()) {
        throw new Error("Recipe not found");
      }

      const fullRecipe = {
        id: recipeSnap.id,
        fbid: recipeSnap.id, // Ensuring fbid is set for your search logic
        ...recipeSnap.data()
      };

      return { recipe: fullRecipe, isAdding };
    } catch (error) {
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
      let all_recipes = store('recipes');
      all_recipes.push({ id: nanoid(), ...action.payload });
      
      store('recipes', all_recipes);
      getRecipesBySearch(state, '');
    },
    editRecipe: (state, action) => {
      let all_recipes = store('recipes');
      let indexToChange;
      all_recipes.some(function(recipe, i) {
        if (recipe.id === action.payload.recipeId) {
          indexToChange = i;
          all_recipes[i] = {
            id: action.payload.recipeId,
            name: action.payload.name,
            ingredients: action.payload.ingredients,
            instructions: action.payload.instructions
          };
        }
      });

      if (indexToChange !== undefined) {
        store('recipes', all_recipes);
        getRecipesBySearch(state, '');
      }
    },
    deleteRecipe: (state, action) => {
      let all_recipes = store('recipes');
      let indexToDelete;
      all_recipes.some(function(recipe, i) {
        if (recipe.id === action.payload.recipeId) {
          indexToDelete = i;
        }
      });

      all_recipes.splice(indexToDelete, 1); 

      if (indexToDelete !== undefined) {
        store('recipes', all_recipes);
        getRecipesBySearch(state, '');
      }
    },
    searchRecipes: (state, action) => {
      const searchTerm = action.payload.searchString.toLowerCase();
      const searchType = action.payload.searchType.toLowerCase();
      getRecipesBySearch(state, searchTerm, searchType);
    }
  },
  extraReducers: (builder) => {
    builder
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
        if (!state.recipes)
          state.recipes = [];

        // const isLazyLoad = !state.searchTerm;
        // if (isLazyLoad) {
        //   const lastSearchRecipe = state.recipes[state.recipes.length-1];
        //   if (lastSearchRecipe.name_lowercase > action.payload.name_lowercase) {
        //     state.recipes.push(action.payload);
        //   }
        // } else {
          state.recipes.push(action.payload);
          state.allRecipes.push(action.payload);
        // }
      })
      .addCase(addRecipeToFirestore.rejected, (state, action) => {
      
      })
      .addCase(editRecipeFromFirestore.pending, (state) => {
        
      })
      .addCase(editRecipeFromFirestore.fulfilled, (state, action) => {
        const updatedRecipe = action.payload || [];
        if (!state.recipes)
          state.recipes = [];

        state.recipes = state.recipes.map(recipe =>
          recipe.fbid === updatedRecipe.fbid ? updatedRecipe : recipe
        );

        if (!state.allRecipes)
          state.allRecipes = [];

        state.allRecipes = state.allRecipes.map(recipe =>
          recipe.fbid === updatedRecipe.fbid ? updatedRecipe : recipe
        );
        state.allRecipesSorted = state.allRecipesSorted.map(recipe =>
          recipe.fbid === updatedRecipe.fbid ? updatedRecipe : recipe
        );
      })
      .addCase(editRecipeFromFirestore.rejected, (state, action) => {
      
      })
      .addCase(deleteRecipeFromFirestore.pending, (state) => {
        
      })
      .addCase(deleteRecipeFromFirestore.fulfilled, (state, action) => {
        state.allRecipes = state.allRecipes.filter(recipe => recipe.fbid !== action.payload);
        state.allRecipesSorted = state.allRecipesSorted.filter(recipe => recipe.fbid !== action.payload);
        state.recipes = state.recipes.filter(recipe => recipe.fbid !== action.payload);
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
                console.log('existsInSearch')
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
        state.favoriteRecipes = action.payload || [];
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

export const { setRecipeSearchParams, setRecipes, addRecipe, editRecipe, deleteRecipe, searchRecipes } = recipesSlice.actions

export const fetchRecipes = (storedRecipes: any) => (dispatch: any) => {
  dispatch(setRecipes(storedRecipes));
};

export const selectRecipes = (state: RootState) => state.recipes.recipes;

export default recipesSlice.reducer;