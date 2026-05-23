import {
  normalizeUpdatedAt,
  stableIngredientKey,
  mergeGroceryListOnConflict,
} from './groceryListMerge';

describe('normalizeUpdatedAt', () => {
  it('returns unix seconds for numeric timestamps', () => {
    expect(normalizeUpdatedAt(1700000000)).toBe(1700000000);
  });

  it('reads Firestore Timestamp-like objects', () => {
    expect(normalizeUpdatedAt({ seconds: 1700000001 })).toBe(1700000001);
  });

  it('returns 0 for missing or invalid values', () => {
    expect(normalizeUpdatedAt(undefined)).toBe(0);
    expect(normalizeUpdatedAt(null)).toBe(0);
    expect(normalizeUpdatedAt('')).toBe(0);
    expect(normalizeUpdatedAt(0)).toBe(0);
  });
});

describe('stableIngredientKey', () => {
  it('keys manual items by name and amount', () => {
    expect(
      stableIngredientKey({ ingredient: { name: 'Milk', amount: '1 gal' } })
    ).toBe('m:Milk:1 gal');
  });

  it('keys recipe items by recipe id and ingredient', () => {
    expect(
      stableIngredientKey({
        ingredient: { name: 'Flour', amount: '2 cups' },
        recipe: { id: 'r1', fbid: 'fb1' },
      })
    ).toBe('r:r1:fb1:Flour:2 cups');
  });
});

describe('mergeGroceryListOnConflict', () => {
  const serverDoc = {
    recipes: [
      {
        id: 'entry1',
        recipe: {
          id: 'r1',
          fbid: 'fb1',
          ingredients: [
            { name: 'Eggs', amount: '2', crossed: false },
            { name: 'Milk', amount: '1 cup', crossed: true },
          ],
        },
      },
    ],
    ingredients: [{ name: 'Bananas', amount: '3', crossed: false }],
  };

  it('merges crossed state with OR logic for matching items', () => {
    const merged = mergeGroceryListOnConflict(serverDoc, {
      recipes: [
        {
          id: 'entry1',
          recipe: {
            id: 'r1',
            fbid: 'fb1',
            ingredients: [
              { name: 'Eggs', amount: '2', crossed: true },
              { name: 'Milk', amount: '1 cup', crossed: false },
            ],
          },
        },
      ],
      ingredients: [{ name: 'Bananas', amount: '3', crossed: true }],
    });

    expect(merged.recipes[0].recipe.ingredients[0].crossed).toBe(true);
    expect(merged.recipes[0].recipe.ingredients[1].crossed).toBe(true);
    expect(merged.ingredients[0].crossed).toBe(true);
  });

  it('appends recipe entries that exist only on the client', () => {
    const merged = mergeGroceryListOnConflict(serverDoc, {
      recipes: [
        {
          id: 'entry2',
          recipe: {
            id: 'r2',
            fbid: 'fb2',
            ingredients: [{ name: 'Sugar', amount: '1 cup', crossed: false }],
          },
        },
      ],
      ingredients: [],
    });

    expect(merged.recipes).toHaveLength(2);
    expect(merged.recipes[1].recipe.fbid).toBe('fb2');
  });

  it('appends manual ingredients that exist only on the client', () => {
    const merged = mergeGroceryListOnConflict(serverDoc, {
      recipes: [],
      ingredients: [{ name: 'Bread', amount: '1 loaf', crossed: false }],
    });

    expect(merged.ingredients).toHaveLength(2);
    expect(merged.ingredients[1].name).toBe('Bread');
  });

  it('leaves server-only items unchanged when client has no matching key', () => {
    const merged = mergeGroceryListOnConflict(serverDoc, {
      recipes: [],
      ingredients: [],
    });

    expect(merged.recipes[0].recipe.ingredients[1].crossed).toBe(true);
    expect(merged.ingredients[0].name).toBe('Bananas');
  });
});
