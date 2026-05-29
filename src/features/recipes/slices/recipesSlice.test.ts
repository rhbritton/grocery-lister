import { configureStore } from '@reduxjs/toolkit';
import recipesReducer, {
  setRecipeSearchParams,
  searchRecipes,
  searchRecipesFromAll,
  applyPendingRecipesFromSyncQueue,
} from './recipesSlice.ts';
import { mergeRecipesByNewestUpdatedAt } from '../utils/recipeMerge.ts';
import pendingSyncReducer from '../../sync/pendingSyncSlice.ts';

function createRecipesStore(preloadedRecipes = {}) {
  return configureStore({
    reducer: {
      recipes: recipesReducer,
      pendingSync: pendingSyncReducer,
    },
    preloadedState: {
      recipes: {
        recipes: [],
        status: 'idle',
        searchTerm: '',
        searchType: 'Name',
        lastVisibleSearch: null,
        allRecipesGrabbed: false,
        error: null,
        allRecipes: [],
        allRecipesSorted: [],
        isFavoriteLoading: false,
        favoriteRecipes: [],
        ...preloadedRecipes,
      },
      pendingSync: { queue: [] },
    },
  });
}

describe('recipesSlice reducers', () => {
  it('stores search term and type', () => {
    const store = createRecipesStore();
    store.dispatch(setRecipeSearchParams({ searchTerm: 'pasta', searchType: 'Ingredient' }));

    expect(store.getState().recipes.searchTerm).toBe('pasta');
    expect(store.getState().recipes.searchType).toBe('Ingredient');
  });

  it('filters recipes by name via searchRecipes', () => {
    const store = createRecipesStore({
      allRecipes: [
        { id: '1', fbid: '1', name: 'Pasta Primavera', ingredients: [] },
        { id: '2', fbid: '2', name: 'Chicken Soup', ingredients: [] },
      ],
    });

    store.dispatch(
      searchRecipes({ searchString: 'pasta', searchType: 'name' })
    );

    expect(store.getState().recipes.recipes).toHaveLength(1);
    expect(store.getState().recipes.recipes[0].name).toBe('Pasta Primavera');
  });

  it('filters recipes by ingredient via searchRecipes', () => {
    const store = createRecipesStore({
      allRecipes: [
        {
          id: '1',
          fbid: '1',
          name: 'Salad',
          ingredients: [{ name: 'Tomato', amount: '2' }],
        },
        {
          id: '2',
          fbid: '2',
          name: 'Toast',
          ingredients: [{ name: 'Bread', amount: '2 slices' }],
        },
      ],
    });

    store.dispatch(
      searchRecipes({ searchString: 'tomato', searchType: 'ingredient' })
    );

    expect(store.getState().recipes.recipes).toHaveLength(1);
    expect(store.getState().recipes.recipes[0].name).toBe('Salad');
  });
});

describe('searchRecipesFromAll', () => {
  it('returns all recipes when search term is empty', async () => {
    const store = createRecipesStore({
      allRecipes: [
        { id: '1', fbid: '1', name: 'Alpha', ingredient_keywords: [] },
        { id: '2', fbid: '2', name: 'Beta', ingredient_keywords: [] },
      ],
    });

    await store.dispatch(searchRecipesFromAll({ searchTerm: '', searchType: 'Name' }));

    expect(store.getState().recipes.recipes).toHaveLength(2);
    expect(store.getState().recipes.status).toBe('succeeded');
  });

  it('filters by ingredient keywords', async () => {
    const store = createRecipesStore({
      allRecipes: [
        {
          id: '1',
          fbid: '1',
          name: 'Curry',
          ingredient_keywords: ['coconut', 'milk'],
        },
        {
          id: '2',
          fbid: '2',
          name: 'Steak',
          ingredient_keywords: ['beef'],
        },
      ],
      favoriteRecipes: [],
    });

    await store.dispatch(
      searchRecipesFromAll({ searchTerm: 'coconut', searchType: 'Ingredient' })
    );

    expect(store.getState().recipes.recipes).toHaveLength(1);
    expect(store.getState().recipes.recipes[0].name).toBe('Curry');
  });

  it('deduplicates favorites and owned recipes by fbid', async () => {
    const shared = {
      id: '1',
      fbid: 'shared',
      name: 'Shared Recipe',
      ingredient_keywords: [],
    };

    const store = createRecipesStore({
      allRecipes: [shared],
      favoriteRecipes: [{ ...shared, favorited: true }],
    });

    await store.dispatch(searchRecipesFromAll({ searchTerm: '', searchType: 'Name' }));

    expect(store.getState().recipes.recipes).toHaveLength(1);
  });

  it('prefers the newer recipe when favorites and allRecipes disagree', async () => {
    const store = createRecipesStore({
      allRecipes: [
        {
          id: '1',
          fbid: 'recipe-1',
          name: 'Updated Offline',
          updatedAt: 200,
          ingredient_keywords: [],
        },
      ],
      favoriteRecipes: [
        {
          id: '1',
          fbid: 'recipe-1',
          name: 'Stale Favorite Copy',
          updatedAt: 100,
          favorited: true,
          ingredient_keywords: [],
        },
      ],
    });

    await store.dispatch(searchRecipesFromAll({ searchTerm: '', searchType: 'Name' }));

    expect(store.getState().recipes.recipes).toHaveLength(1);
    expect(store.getState().recipes.recipes[0].name).toBe('Updated Offline');
    expect(store.getState().recipes.recipes[0].favorited).toBe(true);
  });
});

describe('mergeRecipesByNewestUpdatedAt', () => {
  it('keeps the recipe with the latest updatedAt', () => {
    const merged = mergeRecipesByNewestUpdatedAt([
      { id: '1', fbid: '1', name: 'Old', updatedAt: 10 },
      { id: '1', fbid: '1', name: 'New', updatedAt: 20, favorited: true },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('New');
    expect(merged[0].favorited).toBe(true);
  });
});

describe('applyPendingRecipesFromSyncQueue', () => {
  it('re-applies queued recipe edits into allRecipes on cold start', async () => {
    const store = configureStore({
      reducer: {
        recipes: recipesReducer,
        pendingSync: pendingSyncReducer,
      },
      preloadedState: {
        recipes: {
          recipes: [],
          status: 'idle',
          searchTerm: '',
          searchType: 'Name',
          lastVisibleSearch: null,
          allRecipesGrabbed: false,
          error: null,
          allRecipes: [
            {
              id: '1',
              fbid: 'recipe-1',
              name: 'Stale Name',
              updatedAt: 100,
              ingredients: [],
            },
          ],
          allRecipesSorted: [],
          isFavoriteLoading: false,
          favoriteRecipes: [
            {
              id: '1',
              fbid: 'recipe-1',
              name: 'Stale Name',
              updatedAt: 100,
              favorited: true,
              ingredients: [],
            },
          ],
        },
        pendingSync: {
          queue: [
            {
              id: 'editRecipe:recipe-1',
              type: 'editRecipe',
              createdAt: 200_000_000_000,
              payload: {
                id: '1',
                fbid: 'recipe-1',
                name: 'Queued Offline Edit',
                updatedAt: 200,
                ingredients: [{ amount: '1', name: 'Salt', type: 'other' }],
              },
            },
          ],
        },
      },
    });

    await store.dispatch(applyPendingRecipesFromSyncQueue());
    await store.dispatch(searchRecipesFromAll({ searchTerm: '', searchType: 'Name' }));

    expect(store.getState().recipes.allRecipes[0].name).toBe('Queued Offline Edit');
    expect(store.getState().recipes.favoriteRecipes[0].name).toBe('Queued Offline Edit');
    expect(store.getState().recipes.recipes[0].name).toBe('Queued Offline Edit');
  });
});
