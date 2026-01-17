import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { GroceryList } from './groceryListSlice.ts';

import { db, auth } from '../../../auth/firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, limit, startAfter, orderBy, QueryDocumentSnapshot, DocumentData, serverTimestamp, Timestamp } from 'firebase/firestore';

import store from 'store2';

interface GroceryListsState {
  groceryLists: GroceryList[];
  status: string;
  lastVisibleSearch: QueryDocumentSnapshot<DocumentData> | null;
  allGroceryListsGrabbed: boolean | null;
};

const initialState: GroceryListsState = {
  groceryLists: [],
  status: 'idle',
  lastVisibleSearch: null,
  allGroceryListsGrabbed: false,
};

export const getAllGroceryLists = () => {
  let all_grocery_lists = store('grocery-lists');

  return all_grocery_lists;
}

const sortGroceryLists = (groceryLists) => {
  groceryLists.sort((a, b) => {
    if (a.timestamp < b.timestamp) {
      return 1;
    } else {
      return -1;
    }
  });
}

const getGroceryListsBySearch = (state, searchTerm) => {
  let all_grocery_lists = getAllGroceryLists();
  state.groceryLists = all_grocery_lists;
}

export const selectMaxGroceryListTimestamp = (state: RootState) => {
  const groceryLists = state.groceryLists.allGroceryLists;
  if (!groceryLists || groceryLists.length === 0) return 0;
  
  // Find the highest number in your updatedAt fields
  return Math.max(...groceryLists.map(r => r.updatedAt || 0));
};

export const syncGroceryListsFromFirestore = createAsyncThunk(
  'groceryLists/sync',
  async ({ userId, lastSyncTimestamp }, { rejectWithValue }) => {
    try {
      // 1. Convert local numeric timestamp to Firestore Timestamp object
      const lastSyncDate = Timestamp.fromMillis((lastSyncTimestamp + 1) * 1000); 

      const glRef = collection(db, 'grocery-lists');
      let q;
      if (lastSyncTimestamp) {
        q = query(
          glRef,
          where('userId', '==', userId),
          where('updatedAt', '>', lastSyncDate)
        );
      } else {
        q = query(
          glRef,
          where('userId', '==', userId),
          where('updatedAt', '>=', lastSyncDate)
        );
      }

      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length) console.log('grocery-list reads [syncGroceryListsFromFirestore]: ', querySnapshot.docs.length);
      
      return querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data(),
        // 2. Convert back to seconds for Redux/Phase 2 persistence
        updatedAt: doc.data()?.updatedAt?.seconds || 0
      }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getAllGroceryListsFromFirestore = createAsyncThunk(
  'groceryLists/fetchAllGroceryLists',
  async (userId, { rejectWithValue }) => {
    try {
      let q;
      const groceryListsCollectionRef = collection(db, 'grocery-lists');
      q = query(
        groceryListsCollectionRef,
        where('userId', '==', userId),
        where('isDeleted', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      let groceryLists = querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data(),
        updatedAt: doc.data()?.updatedAt?.seconds || 0
      }));

      return groceryLists;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getGroceryListsFromFirestore = createAsyncThunk(
  'groceryLists/fetchGroceryLists',
  async ({ resetPagination, userId, existingGroceryLists=[] }, { getState, rejectWithValue }) => {
    const pageCount = 5;

    const state = getState() as RootState;
    const lastVisible = resetPagination ? null : state.groceryLists.lastVisibleSearch;

    try {
      const groceryListsCollectionRef = collection(db, 'grocery-lists');
      let queryConstraints: any[] = [
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      ];

      queryConstraints.push(limit(pageCount));
      if (lastVisible) {
        queryConstraints.push(startAfter(lastVisible));
      }

      const q = query(groceryListsCollectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length) console.log('grocery-list reads [getGroceryListsFromFirestore]: ', querySnapshot.docs.length);
      
      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      let newAllGroceryListsGrabbed = false;
      if (querySnapshot.docs.length < pageCount) {
        newAllGroceryListsGrabbed = true;
      }

      let groceryLists = querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data(),
        updatedAt: doc.data()?.updatedAt?.seconds || 0
      }));

      const combinedGroceryLists = [...existingGroceryLists, ...groceryLists];

      return { groceryLists: combinedGroceryLists, lastVisibleSearch: newLastVisible, allGroceryListsGrabbed: newAllGroceryListsGrabbed };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addGroceryListToFirestore = createAsyncThunk(
  'groceryLists/addGroceryList',
  async (groceryListData, { rejectWithValue }) => {
    try {
      const newGroceryList = { id: nanoid(), isDeleted: false, ...groceryListData };
      const docRef = await addDoc(collection(db, 'grocery-lists'), newGroceryList);
      console.log('grocery-list writes [addGroceryListToFirestore]: ', 1);

      return { fbid: docRef.id, ...newGroceryList, updatedAt: serverTimestamp() };
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
      const updatedData = { ...groceryListData, updatedAt: serverTimestamp() };
      delete updatedData.fbid;
      await updateDoc(docRef, updatedData);
      const updatedSnapshot = await getDoc(docRef);
      
      console.log('grocery-list reads [editGroceryListFromFirestore]: ', 1);
      console.log('grocery-list writes [editGroceryListFromFirestore]: ', 1);

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
      await updateDoc(docRef, {
        isDeleted: true,
        updatedAt: serverTimestamp()
      });
      
      console.log('grocery-list writes [deleteGroceryListFromFirestore]: ', 1);

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
      .addCase(syncGroceryListsFromFirestore.fulfilled, (state, action) => {
        if (!state.allGroceryLists) state.allGroceryLists = [];
        if (!state.groceryLists) state.groceryLists = [];

        const incoming = action.payload;
        if (!incoming.length) {
          state.status = 'succeeded';
          return;
        }

        incoming.forEach((updatedList) => {
          // 1. Update allGroceryLists (The Master Bucket)
          const masterIndex = state.allGroceryLists.findIndex(gl => gl.fbid === updatedList.fbid);
          
          if (updatedList.isDeleted) {
            if (masterIndex !== -1) state.allGroceryLists.splice(masterIndex, 1);
          } else {
            if (masterIndex !== -1) {
              state.allGroceryLists[masterIndex] = updatedList;
            } else {
              state.allGroceryLists.push(updatedList);
            }
          }

          // 2. Update the UI view (state.groceryLists)
          // Only update if it's already there to maintain pagination/view state
          const uiIndex = state.groceryLists.findIndex(gl => gl.fbid === updatedList.fbid);
          if (uiIndex !== -1) {
            if (updatedList.isDeleted) {
              state.groceryLists.splice(uiIndex, 1);
            } else {
              state.groceryLists[uiIndex] = updatedList;
            }
          }
        });

        // 3. Rebuild allGroceryListsSorted
        // We recreate the sorted cache from the updated master bucket
        const sortedCopy = [...state.allGroceryLists];
        sortGroceryLists(sortedCopy); 
        state.allGroceryListsSorted = sortedCopy;

        state.status = 'succeeded';
      })
      .addCase(getAllGroceryListsFromFirestore.pending, (state) => {
      
      })
      .addCase(getAllGroceryListsFromFirestore.fulfilled, (state, action) => {
        state.allGroceryLists = action.payload || [];

        let allGroceryListsSorted = action.payload;
        sortGroceryLists(allGroceryListsSorted);
        state.allGroceryListsSorted = allGroceryListsSorted;
      })
      .addCase(getAllGroceryListsFromFirestore.rejected, (state, action) => {

      })
      .addCase(getGroceryListsFromFirestore.pending, (state, action) => {
        state.status = 'loading';
      })
      .addCase(getGroceryListsFromFirestore.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.groceryLists = action.payload && action.payload.groceryLists ? action.payload.groceryLists : [];
        state.lastVisibleSearch = action.payload && action.payload.lastVisibleSearch ? action.payload.lastVisibleSearch : null;
        state.allGroceryListsGrabbed = action.payload && action.payload.allGroceryListsGrabbed ? action.payload.allGroceryListsGrabbed : null;
      })
      .addCase(getGroceryListsFromFirestore.rejected, (state, action) => {
        state.status = 'failed';
      })
      .addCase(addGroceryListToFirestore.pending, (state) => {
        
      })
      .addCase(addGroceryListToFirestore.fulfilled, (state, action) => {
        if (!state.groceryLists)
          state.groceryLists = [];

        state.groceryLists.unshift(action.payload);
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