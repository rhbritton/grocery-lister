import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store.ts';
import { GroceryList } from './groceryListSlice.ts';

import { db, auth } from '../../../auth/firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, limit, startAfter, orderBy, QueryDocumentSnapshot, DocumentData, serverTimestamp, Timestamp } from 'firebase/firestore';

import {
  shouldQueueOffline,
  isLocalNewer,
  stripGroceryListPayloadForFirestore,
  omitUndefinedFields,
  docHasPendingWrites,
  readLocalDocSnapshot,
  handleFirestoreNetworkError,
  isBrowserOffline,
  withFirestoreWriteTimeout,
} from '../../../services/offlineSync.ts';
import { mergeGroceryListOnConflict, normalizeUpdatedAt } from '../utils/groceryListMerge.ts';
import { SHARE_WINDOW_SECONDS } from '../utils/groceryListShare.ts';
import { enqueuePendingSync, dequeuePendingSync } from '../../sync/pendingSyncSlice.ts';

interface GroceryListsState {
  groceryLists: GroceryList[];
  groceryListsSorted: GroceryList[];
  status: string;
  lastVisibleSearch: QueryDocumentSnapshot<DocumentData> | null;
  allGroceryListsGrabbed: boolean | null;
};

const initialState: GroceryListsState = {
  groceryLists: [],
  groceryListsSorted: [],
  status: 'idle',
  lastVisibleSearch: null,
  allGroceryListsGrabbed: false,
};

const sortGroceryLists = (groceryLists) => {
  groceryLists.sort((a, b) => {
    if (a.timestamp < b.timestamp) {
      return 1;
    } else {
      return -1;
    }
  });
}

const normalizeGroceryList = (list) => {
  const { offlineQueued, ...rest } = list;
  return {
    ...rest,
    updatedAt: rest.updatedAt || Math.floor(Date.now() / 1000),
  };
};

export const upsertGroceryListInState = (state, list) => {
  if (!state.groceryLists) state.groceryLists = [];

  const normalized = normalizeGroceryList(list);
  if (!normalized.fbid && !normalized.id) return;

  const index = state.groceryLists.findIndex(
    (gl) =>
      (normalized.fbid && gl.fbid === normalized.fbid) ||
      (normalized.id && gl.id === normalized.id)
  );

  if (index !== -1) {
    state.groceryLists[index] = { ...state.groceryLists[index], ...normalized };
  } else if (normalized.fbid) {
    state.groceryLists.unshift(normalized);
  }

  sortGroceryLists(state.groceryLists);
};

export const removeGroceryListFromState = (state, fbid: string) => {
  state.groceryLists = (state.groceryLists || []).filter(
    (list) => list.fbid !== fbid && list.id !== fbid
  );
  state.groceryListsSorted = (state.groceryListsSorted || []).filter(
    (list) => list.fbid !== fbid && list.id !== fbid
  );
};

export const selectMaxGroceryListTimestamp = (state: RootState) => {
  const groceryLists = state.groceryLists.groceryLists;
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
      return querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data(),
        userId: doc.data().userId || userId,
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
        userId: doc.data().userId || userId,
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
      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      let newAllGroceryListsGrabbed = false;
      if (querySnapshot.docs.length < pageCount) {
        newAllGroceryListsGrabbed = true;
      }

      let groceryLists = querySnapshot.docs.map(doc => ({
        fbid: doc.id,
        ...doc.data(),
        userId: doc.data().userId || userId,
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
  async (groceryListData, { dispatch, rejectWithValue }) => {
    const now = Math.floor(Date.now() / 1000);
    const localId = groceryListData.id || nanoid();
    const payload = stripGroceryListPayloadForFirestore({
      ...groceryListData,
      id: localId,
      isDeleted: false,
    });

    const queueAndReturn = () => {
      dispatch(enqueuePendingSync({
        type: 'addGroceryList',
        id: `addGroceryList:${localId}`,
        payload,
      }));
      return {
        fbid: `pending-${localId}`,
        ...payload,
        updatedAt: now,
        offlineQueued: true,
      };
    };

    if (isBrowserOffline()) {
      return queueAndReturn();
    }

    try {
      const docRef = await withFirestoreWriteTimeout(
        addDoc(collection(db, 'grocery-lists'), {
          ...payload,
          updatedAt: serverTimestamp(),
        })
      );
      dispatch(dequeuePendingSync(`addGroceryList:${localId}`));
      const offlineQueued = await docHasPendingWrites(docRef);
      return { fbid: docRef.id, ...payload, updatedAt: now, offlineQueued };
    } catch (error) {
      if (shouldQueueOffline(error)) {
        return queueAndReturn();
      }
      return rejectWithValue(error.message);
    }
  }
);

export const editGroceryListFromFirestore = createAsyncThunk(
  'groceryLists/editGroceryList',
  async (groceryListData, { dispatch, rejectWithValue }) => {
    const now = Math.floor(Date.now() / 1000);
    const pendingId = `editGroceryList:${groceryListData.fbid}`;
    const baseUpdatedAt = normalizeUpdatedAt(
      groceryListData.baseUpdatedAt ?? groceryListData.updatedAt
    );
    const payload = stripGroceryListPayloadForFirestore(groceryListData);

    const buildResult = (
      docData: Record<string, unknown> | null,
      updatedAt = now,
      offlineQueued = false,
      merged = false,
      finalRecipes = payload.recipes,
      finalIngredients = payload.ingredients
    ) => ({
      fbid: payload.fbid,
      id: payload.id,
      userId: docData?.userId || payload.userId,
      timestamp: docData?.timestamp ?? payload.timestamp,
      recipes: docData?.recipes ?? finalRecipes,
      ingredients: docData?.ingredients ?? finalIngredients,
      updatedAt,
      offlineQueued,
      merged,
    });

    const queueAndReturn = () => {
      dispatch(enqueuePendingSync({
        type: 'editGroceryList',
        id: pendingId,
        payload: { ...payload, baseUpdatedAt },
      }));
      return buildResult(null, now, true);
    };

    try {
      const docRef = doc(db, 'grocery-lists', payload.fbid);
      let recipes = payload.recipes;
      let ingredients = payload.ingredients;
      let wasMerged = false;

      const currentSnap = await readLocalDocSnapshot(docRef);
      if (currentSnap?.exists()) {
        const serverData = currentSnap.data();
        const serverUpdatedAt = normalizeUpdatedAt(serverData.updatedAt);
        const isOwnerWrite =
          auth.currentUser?.uid &&
          serverData.userId === auth.currentUser.uid;

        if (serverUpdatedAt > baseUpdatedAt && !isOwnerWrite) {
          const merged = mergeGroceryListOnConflict(serverData, payload, {
            sharedCheckOffOnly: true,
          });
          recipes = merged.recipes;
          ingredients = merged.ingredients;
          wasMerged = true;
        }
      }

      await updateDoc(docRef, omitUndefinedFields({
        userId: payload.userId,
        timestamp: payload.timestamp,
        recipes,
        ingredients,
        isDeleted: payload.isDeleted ?? false,
        updatedAt: serverTimestamp(),
      }));

      dispatch(dequeuePendingSync(pendingId));

      const updatedSnapshot = await readLocalDocSnapshot(docRef);
      if (updatedSnapshot?.exists()) {
        const data = updatedSnapshot.data();
        const pending = updatedSnapshot.metadata.hasPendingWrites;
        return buildResult(
          data,
          normalizeUpdatedAt(data.updatedAt) || now,
          pending,
          wasMerged,
          recipes,
          ingredients
        );
      }

      const offlineQueued = await docHasPendingWrites(docRef);
      return buildResult(null, now, offlineQueued, wasMerged, recipes, ingredients);
    } catch (error) {
      if (shouldQueueOffline(error)) {
        return queueAndReturn();
      }
      console.error(error);
      return rejectWithValue(error.message);
    }
  }
);

export const shareGroceryListFromFirestore = createAsyncThunk(
  'groceryLists/shareGroceryList',
  async (
    { fbid, id, userId }: { fbid: string; id?: string; userId: string },
    { rejectWithValue }
  ) => {
    const now = Math.floor(Date.now() / 1000);
    const shareExpiresAt = now + SHARE_WINDOW_SECONDS;

    try {
      const docRef = doc(db, 'grocery-lists', fbid);
      await updateDoc(docRef, {
        sharedAt: now,
        shareExpiresAt,
        updatedAt: serverTimestamp(),
      });

      return { fbid, id, userId, sharedAt: now, shareExpiresAt };
    } catch (error) {
      handleFirestoreNetworkError(error);
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteGroceryListFromFirestore = createAsyncThunk(
  'groceryLists/deleteGroceryList',
  async (fbid, { dispatch, rejectWithValue }) => {
    const pendingId = `deleteGroceryList:${fbid}`;

    const queueAndReturn = () => {
      dispatch(enqueuePendingSync({
        type: 'deleteGroceryList',
        id: pendingId,
        payload: fbid,
      }));
      return fbid;
    };

    if (isBrowserOffline()) {
      return queueAndReturn();
    }

    try {
      const docRef = doc(db, 'grocery-lists', fbid);
      await withFirestoreWriteTimeout(
        updateDoc(docRef, {
          isDeleted: true,
          updatedAt: serverTimestamp(),
        })
      );

      dispatch(dequeuePendingSync(pendingId));
      return fbid;
    } catch (error) {
      if (shouldQueueOffline(error)) {
        return queueAndReturn();
      }
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
      state.groceryLists.unshift({ id: nanoid(), ...action.payload });
    },
    editGroceryList: (state, action) => {
      const indexToChange = state.groceryLists.findIndex(
        (groceryList) => groceryList.id === action.payload.groceryListId
      );

      if (indexToChange !== -1) {
        const groceryList = state.groceryLists[indexToChange];
        state.groceryLists[indexToChange] = {
          ...groceryList,
          ingredients: action.payload.ingredients || groceryList.ingredients,
          recipes: action.payload.recipes || groceryList.recipes,
        };
      }
    },
    deleteGroceryList: (state, action) => {
      state.groceryLists = state.groceryLists.filter(
        (gl) => gl.id !== action.payload.groceryListId
      );
    },
    upsertGroceryList: (state, action) => {
      upsertGroceryListInState(state, action.payload);
    },
    // searchRecipes: (state, action) => {
    //   const searchTerm = action.payload.toLowerCase();
    //   getRecipesBySearch(state, searchTerm);
    // }
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncGroceryListsFromFirestore.fulfilled, (state, action) => {
        if (!state.groceryLists) state.groceryLists = [];

        const incoming = action.payload;
        if (!incoming.length) {
          state.status = 'succeeded';
          return;
        }

        incoming.forEach((updatedList) => {
          const masterIndex = state.groceryLists.findIndex(gl => gl.fbid === updatedList.fbid);

          if (masterIndex !== -1 && isLocalNewer(state.groceryLists[masterIndex].updatedAt, updatedList.updatedAt)) {
            return;
          }
          
          if (updatedList.isDeleted) {
            if (masterIndex !== -1) state.groceryLists.splice(masterIndex, 1);
          } else {
            if (masterIndex !== -1) {
              state.groceryLists[masterIndex] = updatedList;
            } else {
              state.groceryLists.push(updatedList);
            }
          }
        });

        // 3. Rebuild allGroceryListsSorted
        // We recreate the sorted cache from the updated master bucket
        sortGroceryLists(state.groceryLists); 

        state.status = 'succeeded';
      })
      .addCase(getAllGroceryListsFromFirestore.pending, (state) => {
      
      })
      .addCase(getAllGroceryListsFromFirestore.fulfilled, (state, action) => {
        state.groceryLists = action.payload || [];

        let groceryLists = action.payload;
        sortGroceryLists(groceryLists);
        state.groceryLists = groceryLists;
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
        if (!action.payload) return;

        if (action.payload.id) {
          state.groceryLists = (state.groceryLists || []).filter(
            (gl) => gl.fbid !== `pending-${action.payload.id}`
          );
        }

        upsertGroceryListInState(state, action.payload);
      })
      .addCase(addGroceryListToFirestore.rejected, (state, action) => {
      
      })
      .addCase(editGroceryListFromFirestore.pending, (state, action) => {
        upsertGroceryListInState(state, action.meta.arg);
      })
      .addCase(editGroceryListFromFirestore.fulfilled, (state, action) => {
        if (!action.payload) return;
        upsertGroceryListInState(state, action.payload);
      })
      .addCase(editGroceryListFromFirestore.rejected, (state, action) => {
        
      })
      .addCase(deleteGroceryListFromFirestore.pending, (state, action) => {
        removeGroceryListFromState(state, action.meta.arg);
      })
      .addCase(deleteGroceryListFromFirestore.fulfilled, (state, action) => {
        removeGroceryListFromState(state, action.payload);
      })
      .addCase(deleteGroceryListFromFirestore.rejected, (state, action) => {
        
      });
  },
});

export const { setGroceryLists, addGroceryList, editGroceryList, deleteGroceryList, upsertGroceryList } = groceryListsSlice.actions

export const fetchGroceryLists = (storedGroceryLists: any) => (dispatch: any) => {
  dispatch(setGroceryLists(storedGroceryLists));
};

export const selectGroceryLists = (state: RootState) => state.groceryLists.groceryLists;

export default groceryListsSlice.reducer;