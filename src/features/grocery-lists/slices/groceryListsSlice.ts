import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { GroceryList } from './groceryListSlice.ts';

import { db, auth } from '../../../auth/firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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

export const getGroceryListsFromFirestore = createAsyncThunk(
  'groceryLists/fetchGroceryLists',
  async (_, { rejectWithValue }) => {
    try {
      const groceryListsCollectionRef = collection(db, 'grocery-lists');
      let q = groceryListsCollectionRef;
      
      const querySnapshot = await getDocs(q);
      console.log('querySnapshot.docs', querySnapshot.docs)
      let groceryLists = querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data()
      }));


      // TODO: ElasticSearch should probably be used instead
      // groceryLists = groceryLists.filter((recipe) => {
      //   if (!searchType || searchType == 'name') {
      //     return recipe.name.toLowerCase().includes(searchTerm);
      //   } else if (searchType == 'ingredient') {
      //     return recipe.ingredients.some(function(ing) {
      //       return ing.name.toLowerCase().includes(searchTerm);
      //     });
      //   }
      // });

      return groceryLists;
      // return [];
    } catch (error) {
      return null; // rejectWithValue(error.message);
    }
  }
);

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
            ingredients: action.payload.ingredients || groceryList.ingredients,
            recipes: action.payload.recipes || groceryList.recipes,
            timestamp: groceryList.timestamp,
          };

          return true;
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
  extraReducers: (builder) => {
    builder
      .addCase(getGroceryListsFromFirestore.pending, (state, action) => {
        // console.log('test1', action.payload)
      })
      .addCase(getGroceryListsFromFirestore.fulfilled, (state, action) => {
        console.log('test', action)
        // state.groceryLists = action.payload;
      })
      .addCase(getGroceryListsFromFirestore.rejected, (state, action) => {
        console.log(action.error)
        console.log('test2', action.payload)
      })
  },
});

export const { setGroceryLists, addGroceryList, editGroceryList, deleteGroceryList } = groceryListsSlice.actions

export const fetchGroceryLists = (storedGroceryLists: any) => (dispatch: any) => {
  dispatch(setGroceryLists(storedGroceryLists));
};

export const selectGroceryLists = (state: RootState) => state.groceryLists.groceryLists;

export default groceryListsSlice.reducer;