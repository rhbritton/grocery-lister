import { configureStore, combineReducers } from '@reduxjs/toolkit';

import counterReducer from '../features/counter/counterSlice.ts';
import recipesReducer from '../features/recipes/slices/recipesSlice.ts';
import groceryListsReducer from '../features/grocery-lists/slices/groceryListsSlice.ts';

const appReducer = combineReducers({
  counter: counterReducer,
  recipes: recipesReducer,
  groceryLists: groceryListsReducer,
});

export const rootReducer = (state, action) => {
  if (action.type === 'USER_LOGOUT')
    return appReducer(undefined, action);

  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['recipes.lastVisibleSearch', 'groceryLists.lastVisibleSearch'],
        ignoredActionPaths: ['payload.lastVisibleSearch'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch