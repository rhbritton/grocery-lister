import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../app/store.ts';
import { waitForFirestoreSync } from '../../services/offlineSync.ts';
import {
  addGroceryListToFirestore,
  deleteGroceryListFromFirestore,
  editGroceryListFromFirestore,
} from '../grocery-lists/slices/groceryListsSlice.ts';
import {
  addRecipeToFirestore,
  deleteRecipeFromFirestore,
  editRecipeFromFirestore,
  toggleFavoriteRecipeInFirestore,
} from '../recipes/slices/recipesSlice.ts';
import { dequeuePendingSync } from './pendingSyncSlice.ts';

export const flushPendingSync = createAsyncThunk(
  'pendingSync/flush',
  async (_, { getState, dispatch }) => {
    await waitForFirestoreSync();

    const queue = [...(getState() as RootState).pendingSync.queue];
    const failedIds: string[] = [];

    for (const item of queue) {
      try {
        switch (item.type) {
          case 'editGroceryList':
            await dispatch(editGroceryListFromFirestore(item.payload)).unwrap();
            break;
          case 'addGroceryList':
            await dispatch(addGroceryListToFirestore(item.payload)).unwrap();
            break;
          case 'deleteGroceryList':
            await dispatch(deleteGroceryListFromFirestore(item.payload)).unwrap();
            break;
          case 'editRecipe':
            await dispatch(editRecipeFromFirestore(item.payload)).unwrap();
            break;
          case 'addRecipe':
            await dispatch(addRecipeToFirestore(item.payload)).unwrap();
            break;
          case 'deleteRecipe':
            await dispatch(deleteRecipeFromFirestore(item.payload)).unwrap();
            break;
          case 'toggleFavorite':
            await dispatch(toggleFavoriteRecipeInFirestore(item.payload)).unwrap();
            break;
          default:
            break;
        }
        dispatch(dequeuePendingSync(item.id));
      } catch (error) {
        console.warn('Pending sync item failed:', item.type, error);
        failedIds.push(item.id);
      }
    }

    return { failedIds, flushedCount: queue.length - failedIds.length };
  }
);
