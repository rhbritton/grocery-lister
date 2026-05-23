import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';

import { RecipeService } from '../data/recipeService.ts';

export const typeOptions = [
  { value: 'produce', label: 'Produce' },
  { value: 'meat', label: 'Meat' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'freezer', label: 'Freezer' },
  { value: '', label: 'Other', default: true },
];

export const findSelectedOption = (value) => {
  let selectedOption;
  typeOptions.some((opt) => {
    if (opt.value == value) {
      selectedOption = opt;
      return true;
    }
  });

  return selectedOption;
};

export interface Ingredient {
  amount: string;
  name: string;
  type: string;
};

export interface Recipe {
  userid: string | undefined;
  fbid: string | undefined;
  id: string;
  name: string;
  name_lowercase: string | null;
  search_keywords: any[];
  ingredients: Ingredient[];
  updatedAt: number | undefined;
};

interface RecipeState {
  recipe: Recipe | undefined;
};


const initialState: RecipeState = {
  recipe: undefined,
};

export const fetchRecipeById = createAsyncThunk<
  Recipe | undefined,
  string,
  { state: RootState }
>('recipes/fetchRecipeById', async (id, { getState }) => {
  try {
    const { allRecipes, favoriteRecipes } = getState().recipes;
    const localRecipes = [...allRecipes, ...favoriteRecipes];
    return await RecipeService.getRecipe(id, localRecipes);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return undefined;
  }
});

export const recipeSlice = createSlice({
  name: 'recipe',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchRecipeById.fulfilled, (state, action) => {
        state.recipe = action.payload;
      });
  },
});

export default recipeSlice.reducer;