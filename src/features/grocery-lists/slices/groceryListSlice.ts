import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { Recipe, Ingredient } from '../../recipes/slices/recipeSlice.ts';

import { GroceryListService } from '../data/groceryListService.ts';

export interface GroceryList {
    fbid: string | undefined;
    id: string;
    userId: string | undefined;
    recipes: Recipe[] | [];
    ingredients: Ingredient[] | [];
    timestamp: number;
    sharedAt?: number;
    shareExpiresAt?: number;
    updatedAt: number | undefined;
};

interface GroceryListState {
  groceryList: GroceryList | undefined;
};


const initialState: GroceryListState = {
    groceryList: undefined,
};

export const fetchGroceryListById = createAsyncThunk<
  GroceryList | undefined,
  string,
  { state: RootState }
>('groceryLists/fetchGroceryListById', async (id, { getState }) => {
  try {
    const { groceryLists } = getState().groceryLists;
    return await GroceryListService.getGroceryList(id, groceryLists);
  } catch (error) {
    console.error('Error fetching grocery list:', error);
    return undefined;
  }
});

export const groceryListSlice = createSlice({
  name: 'groceryList',
  initialState,
  reducers: {},
});

export default groceryListSlice.reducer;