import store from 'store2';

import { GroceryList } from '../slices/groceryListSlice.ts';

export const GroceryListService = {
  getGroceryListById: async (id: string): Promise<GroceryList | undefined> => {
    let groceryList;
    let all_grocery_lists = store('grocery-lists');
    all_grocery_lists.some(function(gl) {
        if (gl.id == id) {
            groceryList = gl;
            return true;
        }
    });

    return groceryList;
  },
};