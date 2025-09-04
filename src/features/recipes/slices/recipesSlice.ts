import { createSlice, nanoid } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { Recipe, Ingredient } from './recipeSlice.ts';

import recipesConfig from '../config.json';

import store from 'store2';

interface RecipesState {
  recipes: Recipe[];
};


const existingUser = store('existingUser');
if (!existingUser) {
  store('existingUser', true);

  let recipes = recipesConfig.recipes.map((recipeData) => ({
    ...recipeData, // Spread operator to include all properties from recipeData
    id: nanoid(), // Generate a unique ID for each recipe
  }));

  store('recipes', recipes);
} else {
  // recipes = store('recipes');
  // console.log('r2', recipes)

  // set state


}



const initialState: RecipesState = {
  recipes: []
};

export const getAllRecipes = () => {
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
      console.log('searchTerm', searchTerm);
      console.log('searchType', searchType);
      getRecipesBySearch(state, searchTerm, searchType);
    }
  },
});

export const { setRecipes, addRecipe, editRecipe, deleteRecipe, searchRecipes } = recipesSlice.actions

export const fetchRecipes = (storedRecipes: any) => (dispatch: any) => {
  dispatch(setRecipes(storedRecipes)); // Dispatch the setRecipes action
};

export const selectRecipes = (state: RootState) => state.recipes.recipes;

export default recipesSlice.reducer;