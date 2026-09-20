export function duplicateRecipeName(name) {
  const trimmed = String(name || '').trim() || 'Recipe';
  return /\s*\(copy\)\s*$/i.test(trimmed) ? trimmed : `${trimmed} (copy)`;
}

export function cloneRecipeDraft(recipe, { asCopy = true } = {}) {
  const sourceIngredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  const ingredients = sourceIngredients.length
    ? sourceIngredients.map((ingredient) => ({
        amount:
          ingredient?.amount == null || String(ingredient.amount).trim() === ''
            ? '1'
            : String(ingredient.amount),
        name: String(ingredient?.name || ''),
        type: String(ingredient?.type || ''),
        walmartUrl: String(ingredient?.walmartUrl || ''),
        walmartUsItemId: String(ingredient?.walmartUsItemId || ''),
      }))
    : [{ amount: '1', name: '', type: '' }];

  return {
    name: asCopy ? duplicateRecipeName(recipe?.name) : String(recipe?.name || ''),
    ingredients,
    instructions: recipe?.instructions == null ? '' : String(recipe.instructions),
  };
}

export function findRecipeByDuplicateId(recipes, duplicateId) {
  const id = String(duplicateId || '');
  if (!id || !Array.isArray(recipes)) return null;
  return recipes.find((recipe) => recipe?.fbid === id || recipe?.id === id) || null;
}
