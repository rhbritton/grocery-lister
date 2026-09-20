import { cloneRecipeDraft, duplicateRecipeName, findRecipeByDuplicateId } from './duplicateRecipe';

describe('duplicateRecipe', () => {
  it('appends (copy) once', () => {
    expect(duplicateRecipeName('Beef stew')).toBe('Beef stew (copy)');
    expect(duplicateRecipeName('Beef stew (copy)')).toBe('Beef stew (copy)');
    expect(duplicateRecipeName('  ')).toBe('Recipe (copy)');
  });

  it('clones ingredients without sharing object identity', () => {
    const original = {
      name: 'Soup',
      instructions: 'Simmer.',
      ingredients: [{ amount: '1', name: 'onion', type: 'produce', walmartUrl: 'https://walmart.com/ip/1' }],
    };
    const draft = cloneRecipeDraft(original);
    expect(draft.name).toBe('Soup (copy)');
    expect(draft.instructions).toBe('Simmer.');
    expect(draft.ingredients[0]).toEqual({
      amount: '1',
      name: 'onion',
      type: 'produce',
      walmartUrl: 'https://walmart.com/ip/1',
      walmartUsItemId: '',
    });
    draft.ingredients[0].name = 'changed';
    expect(original.ingredients[0].name).toBe('onion');
  });

  it('finds recipes by fbid or id', () => {
    const recipes = [{ fbid: 'abc', name: 'A' }, { id: 'xyz', name: 'B' }];
    expect(findRecipeByDuplicateId(recipes, 'abc')?.name).toBe('A');
    expect(findRecipeByDuplicateId(recipes, 'xyz')?.name).toBe('B');
    expect(findRecipeByDuplicateId(recipes, 'nope')).toBeNull();
  });
});
