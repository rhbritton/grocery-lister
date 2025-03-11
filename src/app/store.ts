import { configureStore } from '@reduxjs/toolkit';

import counterReducer from '../features/counter/counterSlice.ts';
import recipesReducer from '../features/recipes/slices/recipesSlice.ts';
import groceryListsReducer from '../features/grocery-lists/slices/groceryListsSlice.ts';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    recipes: recipesReducer,
    groceryLists: groceryListsReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch