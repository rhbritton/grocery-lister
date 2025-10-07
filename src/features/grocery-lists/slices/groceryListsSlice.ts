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
  async (userId, { rejectWithValue }) => {
    try {
      const groceryListsCollectionRef = collection(db, 'grocery-lists');
      let q = query(
        groceryListsCollectionRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      let groceryLists = querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data()
      }));

      return groceryLists;
      // return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addGroceryListToFirestore = createAsyncThunk(
  'groceryLists/addGroceryList',
  async (groceryListData, { rejectWithValue }) => {
    try {
      const newGroceryList = { id: nanoid(), ...groceryListData };
      const docRef = await addDoc(collection(db, 'grocery-lists'), newGroceryList);
      return { fbid: docRef.id, ...newGroceryList };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const editGroceryListFromFirestore = createAsyncThunk(
  'groceryLists/editGroceryList',
  async (groceryListData, { rejectWithValue }) => {
    try {
      const docRef = doc(db, 'grocery-lists', groceryListData.fbid);
      const updatedData = { ...groceryListData };
      delete updatedData.fbid;
      await updateDoc(docRef, updatedData);
      const updatedSnapshot = await getDoc(docRef);

      return updatedSnapshot.exists() ? updatedSnapshot.data() : undefined;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteGroceryListFromFirestore = createAsyncThunk(
  'recipes/deleteGroceryList',
  async (fbid, { rejectWithValue }) => {
    try {
      const docRef = doc(db, 'grocery-lists', fbid);
      await deleteDoc(docRef);

      return fbid;
    } catch (error) {
      return rejectWithValue(error.message);
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
        
      })
      .addCase(getGroceryListsFromFirestore.fulfilled, (state, action) => {
        state.groceryLists = action.payload;
      })
      .addCase(getGroceryListsFromFirestore.rejected, (state, action) => {
        
      })
      .addCase(addGroceryListToFirestore.pending, (state) => {
        
      })
      .addCase(addGroceryListToFirestore.fulfilled, (state, action) => {
        if (!state.groceryLists)
          state.groceryLists = [];

        state.groceryLists.push(action.payload);
      })
      .addCase(addGroceryListToFirestore.rejected, (state, action) => {
      
      })
      .addCase(editGroceryListFromFirestore.pending, (state) => {
              
      })
      .addCase(editGroceryListFromFirestore.fulfilled, (state, action) => {
        const updatedGroceryList = action.payload || [];
        if (!state.groceryLists)
          state.groceryLists = [];

        state.groceryLists = state.groceryLists.map(groceryList =>
          groceryList.fbid === updatedGroceryList.fbid ? updatedGroceryList : groceryList
        );
      })
      .addCase(editGroceryListFromFirestore.rejected, (state, action) => {
        
      })
      .addCase(deleteGroceryListFromFirestore.pending, (state) => {
        
      })
      .addCase(deleteGroceryListFromFirestore.fulfilled, (state, action) => {
        state.groceryLists = state.groceryLists.filter(groceryList => groceryList.fbid !== action.payload);
      })
      .addCase(deleteGroceryListFromFirestore.rejected, (state, action) => {
        
      });
  },
});

export const { setGroceryLists, addGroceryList, editGroceryList, deleteGroceryList } = groceryListsSlice.actions

export const fetchGroceryLists = (storedGroceryLists: any) => (dispatch: any) => {
  dispatch(setGroceryLists(storedGroceryLists));
};

export const selectGroceryLists = (state: RootState) => state.groceryLists.groceryLists;

export default groceryListsSlice.reducer;