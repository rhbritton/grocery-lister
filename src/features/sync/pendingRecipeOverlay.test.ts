import {
  getRecipeCatalogWithPending,
  overlayPendingRecipesOnCollections,
} from './pendingRecipeOverlay.ts';

describe('pendingRecipeOverlay', () => {
  it('prefers queued editRecipe over stale cached copies', () => {
    const catalog = getRecipeCatalogWithPending(
      [
        {
          id: '1',
          fbid: 'recipe-1',
          name: 'Stale All Recipes',
          updatedAt: 100,
          ingredients: [],
        },
      ],
      [
        {
          id: '1',
          fbid: 'recipe-1',
          name: 'Stale Favorite',
          updatedAt: 100,
          favorited: true,
          ingredients: [],
        },
      ],
      [
        {
          id: 'editRecipe:recipe-1',
          type: 'editRecipe',
          createdAt: 200_000,
          payload: {
            id: '1',
            fbid: 'recipe-1',
            name: 'Queued Offline Edit',
            ingredients: [{ amount: '1', name: 'Salt', type: 'other' }],
          },
        },
      ]
    );

    expect(catalog).toHaveLength(1);
    expect(catalog[0].name).toBe('Queued Offline Edit');
    expect(catalog[0].favorited).toBe(true);
  });

  it('writes queued edits back into both collections', () => {
    const next = overlayPendingRecipesOnCollections(
      [
        {
          id: '1',
          fbid: 'recipe-1',
          name: 'Stale All Recipes',
          updatedAt: 100,
          ingredients: [],
        },
      ],
      [
        {
          id: '1',
          fbid: 'recipe-1',
          name: 'Stale Favorite',
          updatedAt: 100,
          favorited: true,
          ingredients: [],
        },
      ],
      [
        {
          id: 'editRecipe:recipe-1',
          type: 'editRecipe',
          createdAt: 200_000,
          payload: {
            id: '1',
            fbid: 'recipe-1',
            name: 'Queued Offline Edit',
            ingredients: [{ amount: '1', name: 'Salt', type: 'other' }],
          },
        },
      ]
    );

    expect(next.allRecipes[0].name).toBe('Queued Offline Edit');
    expect(next.favoriteRecipes[0].name).toBe('Queued Offline Edit');
  });
});
