import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';

import { RecipeService } from '../data/recipeService.ts';

import store from 'store2';

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
  id: string;
  name: string;
  ingredients: Ingredient[];
};

interface RecipeState {
  recipe: Recipe | undefined;
};


const initialState: RecipeState = {
  recipe: undefined,
};

export const fetchRecipeById = createAsyncThunk<
  Recipe | undefined,
  string 
>('recipes/fetchRecipeById', async (id) => {
  try {
    const recipe = await RecipeService.getRecipeById(id);
    return recipe;
  } catch (error) {
    // Handle errors appropriately (e.g., log, display error messages)
    console.error('Error fetching recipe:', error);
    return undefined; // Return undefined on error
  }
});

export const recipeSlice = createSlice({
  name: 'recipe',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchRecipeById.fulfilled, (state, action) => {
        console.log('payload', action.payload)
        state.recipe = action.payload;
      });
  },
});

// export const {} = recipeSlice.actions

export default recipeSlice.reducer;