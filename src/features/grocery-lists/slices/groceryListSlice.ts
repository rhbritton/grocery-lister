import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { Recipe, Ingredient } from '../../recipes/slices/recipeSlice.ts';

import { GroceryListService } from '../data/groceryListService.ts';

import store from 'store2';

export interface GroceryList {
    fbid: string | undefined;
    id: string;
    recipes: Recipe[] | [];
    ingredients: Ingredient[] | [];
    timestamp: number;
};

interface GroceryListState {
  groceryList: GroceryList | undefined;
};


const initialState: GroceryListState = {
    groceryList: undefined,
};

export const fetchGroceryListById = createAsyncThunk<
  GroceryList | undefined,
  string 
>('groceryLists/fetchGroceryListById', async (id) => {
  try {
    // const groceryList = await GroceryListService.getGroceryListById(id);
    const groceryList = await GroceryListService.getGroceryListByFirebaseId(id);
    return groceryList;
  } catch (error) {
    // Handle errors appropriately (e.g., log, display error messages)
    console.error('Error fetching grocery list:', error);
    return undefined; // Return undefined on error
  }
});

export const groceryListSlice = createSlice({
  name: 'groceryList',
  initialState,
  reducers: {},
});

export default groceryListSlice.reducer;