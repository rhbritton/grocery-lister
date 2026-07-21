import {
  buildGroceryListSharePayload,
  buildRecipeSharePayload,
} from './shareMessages';

describe('shareMessages', () => {
  it('builds a professional recipe share payload', () => {
    expect(
      buildRecipeSharePayload({
        name: 'Chicken Enchiladas',
        ingredientCount: 8,
        url: 'https://web.grocerylisterapp.com?recipe=abc',
      })
    ).toEqual({
      title: 'Chicken Enchiladas · GroceryLister',
      text: 'Chicken Enchiladas (8 ingredients) — shared via GroceryLister',
      url: 'https://web.grocerylisterapp.com?recipe=abc',
    });
  });

  it('builds a professional grocery list share payload', () => {
    expect(
      buildGroceryListSharePayload({
        listDate: 'May 23, 2026',
        url: 'https://web.grocerylisterapp.com?grocerylist=xyz',
      })
    ).toEqual({
      title: 'Grocery list · May 23, 2026',
      text: 'Grocery list for May 23, 2026. Open this link to view items and check them off while you shop.',
      url: 'https://web.grocerylisterapp.com?grocerylist=xyz',
    });
  });
});
