import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Recipe, Ingredient } from './recipeSlice.ts';

import recipesConfig from '../config.json';

import store from 'store2';
import { db, auth } from '../../../auth/firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, limit, startAfter, orderBy } from 'firebase/firestore';

interface RecipesState {
  recipes: Recipe[];
  status: string;
  searchTerm: string;
  searchType: string;
  lastVisibleSearch: QueryDocumentSnapshot<DocumentData> | null;
  allRecipesGrabbed: boolean | null;
  error: string | null;
  allRecipes: Recipe[];
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
};

export const getAllRecipes = async () => {
  let all_recipes = store('recipes');

  return all_recipes;
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

export const getRecipesFromFirestore = createAsyncThunk(
  'recipes/fetchRecipes',
  async ({ resetPagination, userId, searchTerm='', searchType, existingRecipes=[] }, { getState, rejectWithValue }) => {
    const pageCount = 5;
    if (searchType)
      searchType = searchType.toLowerCase().trim();

    if (searchTerm)
      searchTerm = searchTerm.toLowerCase().trim();
    
    const isLazyLoading = !searchType || searchType === 'name';

    const state = getState() as RootState;
    const lastVisible = resetPagination ? null : state.recipes.lastVisibleSearch;

    try {
      let q;
      const recipesCollectionRef = collection(db, 'recipes');
      let queryConstraints: any[] = [
        where('userId', '==', userId),
        orderBy('name_lowercase'),
      ];

      if (isLazyLoading) {
        queryConstraints.push(limit(pageCount));
        
        if (lastVisible) {
          queryConstraints.push(startAfter(lastVisible));
        }
      }

      // TODO: use name_keywords [] 
      if (searchTerm && searchType === 'name') {
        const endSearchTerm = searchTerm + '\uf8ff';
        queryConstraints.push(
            where('name_lowercase', '>=', searchTerm),
            where('name_lowercase', '<', endSearchTerm)
        );
      }

      q = query(recipesCollectionRef, ...queryConstraints);
      
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

      if (searchType === 'ingredient' || searchType === 'name_legacy') {
        // TODO: ElasticSearch should probably be used instead
        recipes = recipes.filter((recipe) => {
          if (searchType == 'name_legacy') {
            return recipe.name.toLowerCase().includes(searchTerm);
          } else if (searchType == 'ingredient') {
            return recipe.ingredients.some(function(ing) {
              return ing.name.toLowerCase().includes(searchTerm);
            });
          }
        });
      }
      
      const combinedRecipes = searchType === 'ingredient' ? recipes : [...existingRecipes, ...recipes];

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
        const newRecipe = { 
          id: nanoid(), 
          ...recipeData, 
          name_lowercase: recipeData.name ? recipeData.name.trim().toLowerCase() : ''
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
      const newRecipe = {
        id: nanoid(), 
        ...recipeData,
        name_lowercase: recipeData.name ? recipeData.name.trim().toLowerCase() : ''
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
      const updatedData = { 
        ...recipeData,
        name_lowercase: recipeData.name ? recipeData.name.trim().toLowerCase() : ''
      };
      delete updatedData.fbid;
      await updateDoc(docRef, updatedData);

      return recipeData;
    } catch (error) {
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
      })
      .addCase(addRecipesToFirestore.rejected, (state, action) => {
      
      })
      .addCase(addRecipeToFirestore.pending, (state) => {
        
      })
      .addCase(addRecipeToFirestore.fulfilled, (state, action) => {
        if (!state.recipes)
          state.recipes = [];

        const isLazyLoad = !state.searchType || state.searchType === 'Name';
        if (isLazyLoad) {
          state.recipes = [];
          state.lastVisibleSearch = null;
          state.allRecipesGrabbed = false;
        } else {
          state.recipes.push(action.payload);
        }
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
      })
      .addCase(editRecipeFromFirestore.rejected, (state, action) => {
      
      })
      .addCase(deleteRecipeFromFirestore.pending, (state) => {
        
      })
      .addCase(deleteRecipeFromFirestore.fulfilled, (state, action) => {
        state.recipes = state.recipes.filter(recipe => recipe.fbid !== action.payload);
      })
      .addCase(deleteRecipeFromFirestore.rejected, (state, action) => {
        
      });
      
  },
});

export const { setRecipeSearchParams, setRecipes, addRecipe, editRecipe, deleteRecipe, searchRecipes } = recipesSlice.actions

export const fetchRecipes = (storedRecipes: any) => (dispatch: any) => {
  dispatch(setRecipes(storedRecipes));
};

export const selectRecipes = (state: RootState) => state.recipes.recipes;

export default recipesSlice.reducer;