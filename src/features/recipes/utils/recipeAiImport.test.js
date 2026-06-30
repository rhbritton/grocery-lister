import {
  parseRecipeImportJson,
  stripJsonFences,
  normalizeIngredientType,
} from './recipeAiImport';

describe('recipeAiImport', () => {
  it('strips markdown json fences', () => {
    expect(stripJsonFences('```json\n{"name":"Test"}\n```')).toBe('{"name":"Test"}');
  });

  it('parses valid recipe json', () => {
    const result = parseRecipeImportJson(
      JSON.stringify({
        name: 'Tomato Soup',
        ingredients: [
          { amount: '2 cups', name: 'Tomatoes', type: 'produce' },
          { amount: '', name: 'Salt', type: 'unknown' },
        ],
        instructions: 'Simmer.\n\nServe.',
      })
    );

    expect(result.ok).toBe(true);
    expect(result.recipe).toEqual({
      name: 'Tomato Soup',
      ingredients: [
        { amount: '2 cups', name: 'Tomatoes', type: 'produce' },
        { amount: '1', name: 'Salt', type: '' },
      ],
      instructions: 'Simmer.\n\nServe.',
    });
  });

  it('rejects invalid json', () => {
    const result = parseRecipeImportJson('{not json');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid JSON/i);
  });

  it('rejects missing name', () => {
    const result = parseRecipeImportJson(
      JSON.stringify({ name: '  ', ingredients: [{ amount: '1', name: 'Flour' }] })
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/name/i);
  });

  it('normalizes ingredient types', () => {
    expect(normalizeIngredientType('Produce')).toBe('produce');
    expect(normalizeIngredientType('snacks')).toBe('');
  });
});
