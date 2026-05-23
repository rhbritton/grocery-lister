import { configureStore } from '@reduxjs/toolkit';
import recipesReducer, {
  setRecipeSearchParams,
  searchRecipes,
  searchRecipesFromAll,
} from './recipesSlice.ts';

function createRecipesStore(preloadedRecipes = {}) {
  return configureStore({
    reducer: { recipes: recipesReducer },
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
});
