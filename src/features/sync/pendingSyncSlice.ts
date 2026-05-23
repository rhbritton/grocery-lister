import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

export type PendingSyncType =
  | 'editGroceryList'
  | 'addGroceryList'
  | 'deleteGroceryList'
  | 'editRecipe'
  | 'addRecipe'
  | 'deleteRecipe'
  | 'toggleFavorite';

export interface PendingSyncItem {
  id: string;
  type: PendingSyncType;
  payload: unknown;
  createdAt: number;
}

interface PendingSyncState {
  queue: PendingSyncItem[];
}

const initialState: PendingSyncState = {
  queue: [],
};

export const pendingSyncSlice = createSlice({
  name: 'pendingSync',
  initialState,
  reducers: {
    enqueuePendingSync: (
      state,
      action: PayloadAction<{ type: PendingSyncType; payload: unknown; id?: string }>
    ) => {
      const { type, payload, id } = action.payload;
      const key = id || `${type}:${nanoid()}`;
      const existingIndex = state.queue.findIndex((item) => item.id === key);

      const entry: PendingSyncItem = {
        id: key,
        type,
        payload,
        createdAt: Date.now(),
      };

      if (existingIndex !== -1) {
        state.queue[existingIndex] = entry;
      } else {
        state.queue.push(entry);
      }
    },
    dequeuePendingSync: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((item) => item.id !== action.payload);
    },
    clearPendingSync: (state) => {
      state.queue = [];
    },
  },
});

export const { enqueuePendingSync, dequeuePendingSync, clearPendingSync } =
  pendingSyncSlice.actions;

export const selectPendingSyncQueue = (state: { pendingSync: PendingSyncState }) =>
  state.pendingSync.queue;

export default pendingSyncSlice.reducer;
