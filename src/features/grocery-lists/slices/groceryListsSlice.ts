import { createSlice, nanoid } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { GroceryList } from './groceryListSlice.ts';

import store from 'store2';

interface GroceryListsState {
    groceryLists: GroceryList[];
};

const initialState: GroceryListsState = {
    groceryLists: []
};

export const getAllGroceryLists = () => {
  let all_grocery_lists = store('grocery-lists');

  return all_grocery_lists;
}

const getGroceryListsBySearch = (state, searchTerm) => {
  let all_grocery_lists = getAllGroceryLists();
  state.groceryLists = all_grocery_lists;
}

export const groceryListsSlice = createSlice({
  name: 'groceryLists',
  initialState,
  reducers: {
    setGroceryLists: (state, action) => {
      state.groceryLists = action.payload;
    },
    addGroceryList: (state, action) => {
      let all_grocery_lists = store('grocery-lists') || [];
      all_grocery_lists.unshift({ id: nanoid(), ...action.payload });
      
      store('grocery-lists', all_grocery_lists);
      getGroceryListsBySearch(state, '');
    },
    editGroceryList: (state, action) => {
      let all_grocery_lists = store('grocery-lists');
      let indexToChange;
      all_grocery_lists.some(function(groceryList, i) {
        if (groceryList.id === action.payload.groceryListId) {
          indexToChange = i;
          all_grocery_lists[i] = {
            id: groceryList.id,
            ingredients: action.payload.ingredients,
            recipes: action.payload.recipes,
            timestamp: groceryList.timestamp,
          };
        }
      });

      if (indexToChange !== undefined) {
        store('grocery-lists', all_grocery_lists);
        getAllGroceryLists();
      }
    },
    deleteGroceryList: (state, action) => {
      let all_grocery_lists = getAllGroceryLists();
      let indexToDelete;
      all_grocery_lists.some(function(gl, i) {
        if (gl.id === action.payload.groceryListId) {
          indexToDelete = i;
        }
      });

      all_grocery_lists.splice(indexToDelete, 1); 

      if (indexToDelete !== undefined) {
        store('grocery-lists', all_grocery_lists);
        getGroceryListsBySearch(state, '');
      }
    },
    // searchRecipes: (state, action) => {
    //   const searchTerm = action.payload.toLowerCase();
    //   getRecipesBySearch(state, searchTerm);
    // }
  },
});

export const { setGroceryLists, addGroceryList, editGroceryList, deleteGroceryList } = groceryListsSlice.actions

export const fetchGroceryLists = (storedGroceryLists: any) => (dispatch: any) => {
  dispatch(setGroceryLists(storedGroceryLists));
};

export const selectGroceryLists = (state: RootState) => state.groceryLists.groceryLists;

export default groceryListsSlice.reducer;