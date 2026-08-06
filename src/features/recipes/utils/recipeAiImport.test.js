import {
  parseRecipeImportJson,
  stripJsonFences,
  normalizeIngredientType,
  getRecipeAiImportPrompt,
  RECIPE_AI_IMPORT_PROMPT,
  RECIPE_AI_IMPORT_SIMPLIFY_ADDENDUM,
} from './recipeAiImport';

describe('recipeAiImport', () => {
  it('strips markdown json fences', () => {
    expect(stripJsonFences('```json\n{"name":"Test"}\n```')).toBe('{"name":"Test"}');
  });

  it('returns base prompt by default and appends simplify addendum when enabled', () => {
    expect(getRecipeAiImportPrompt()).toBe(RECIPE_AI_IMPORT_PROMPT);
    expect(getRecipeAiImportPrompt({ simplify: false })).toBe(RECIPE_AI_IMPORT_PROMPT);
    expect(getRecipeAiImportPrompt({ simplify: true })).toBe(
      `${RECIPE_AI_IMPORT_PROMPT}${RECIPE_AI_IMPORT_SIMPLIFY_ADDENDUM}`
    );
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
