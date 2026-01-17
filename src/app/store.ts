import { configureStore, combineReducers } from '@reduxjs/toolkit';

import { 
  persistStore, 
  persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER 
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Defaults to localStorage for web

import counterReducer from '../features/counter/counterSlice.ts';
import recipesReducer from '../features/recipes/slices/recipesSlice.ts';
import groceryListsReducer from '../features/grocery-lists/slices/groceryListsSlice.ts';

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['recipes', 'groceryLists'], // Save these slices, ignore others
};

const appReducer = combineReducers({
  counter: counterReducer,
  recipes: recipesReducer,
  groceryLists: groceryListsReducer,
});

export const rootReducer = (state, action) => {
  if (action.type === 'USER_LOGOUT' || action.type === 'auth/userLogout') {
    storage.removeItem('persist:root'); // This kills the disk data
    return appReducer(undefined, action); // This kills the memory data
  }

  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      },
    }),
});

export const persistor = persistStore(store);
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch