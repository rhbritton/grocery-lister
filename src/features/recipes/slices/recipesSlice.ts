import { createSlice, nanoid } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { Recipe, Ingredient } from './recipeSlice.ts';

import { createAsyncThunk } from '@reduxjs/toolkit';

import recipesConfig from '../config.json';

import store from 'store2';
import { db, auth } from '../../../auth/firebaseConfig'; // Assuming you have a file with your Firebase initialization
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface RecipesState {
  recipes: Recipe[];
};

const initialState: RecipesState = {
  recipes: []
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

export const getRecipesFromFirestore = createAsyncThunk(
  'recipes/fetchRecipes',
  async ({ searchTerm, searchType }, { rejectWithValue }) => {
    if (searchType)
      searchType = searchType.toLowerCase();

    try {
      let q;
      const recipesCollectionRef = collection(db, 'recipes');
      q = recipesCollectionRef;
      
      const querySnapshot = await getDocs(q);
      let recipes = querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data()
      }));

      // TODO: ElasticSearch should probably be used instead
      recipes = recipes.filter((recipe) => {
        if (!searchType || searchType == 'name') {
          return recipe.name.toLowerCase().includes(searchTerm);
        } else if (searchType == 'ingredient') {
          return recipe.ingredients.some(function(ing) {
            return ing.name.toLowerCase().includes(searchTerm);
          });
        }
      });

      return recipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addRecipeToFirestore = createAsyncThunk(
  'recipes/addRecipe',
  async (recipeData, { rejectWithValue }) => {
    try {
      const newRecipe = { id: nanoid(), ...recipeData };
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
      // Create a reference to the specific document using its Firebase ID (fbid)
      const docRef = doc(db, 'recipes', recipeData.fbid);

      // Use updateDoc to update the fields in that document
      // Note: We're using a copy of the data without the fbid itself for the update
      const updatedData = { ...recipeData };
      delete updatedData.fbid;

      await updateDoc(docRef, updatedData);

      // Return the updated recipe to be used in the reducer
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
      // Create a reference to the specific document using its Firebase ID (fbid)
      const docRef = doc(db, 'recipes', fbid);

      // Use deleteDoc to remove the document from the database
      await deleteDoc(docRef);

      // Return the fbid so the reducer can remove the item from the state
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
      .addCase(getRecipesFromFirestore.pending, (state) => {
        
      })
      .addCase(getRecipesFromFirestore.fulfilled, (state, action) => {
        state.recipes = action.payload; // Set the recipes with the fetched data
      })
      .addCase(getRecipesFromFirestore.rejected, (state, action) => {
        
      })
      .addCase(addRecipeToFirestore.pending, (state) => {
        
      })
      .addCase(addRecipeToFirestore.fulfilled, (state, action) => {
        state.recipes.push(action.payload);
      })
      .addCase(addRecipeToFirestore.rejected, (state, action) => {
      
      })
      .addCase(editRecipeFromFirestore.pending, (state) => {
        
      })
      .addCase(editRecipeFromFirestore.fulfilled, (state, action) => {
        const updatedRecipe = action.payload;
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

export const { setRecipes, addRecipe, editRecipe, deleteRecipe, searchRecipes } = recipesSlice.actions

export const fetchRecipes = (storedRecipes: any) => (dispatch: any) => {
  dispatch(setRecipes(storedRecipes)); // Dispatch the setRecipes action
};

export const selectRecipes = (state: RootState) => state.recipes.recipes;

export default recipesSlice.reducer;