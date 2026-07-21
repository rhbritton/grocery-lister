export function buildRecipeSharePayload({ name, ingredientCount = 0, url }) {
  const recipeName = String(name || '').trim() || 'Recipe';

  return {
    title: `${recipeName} · GroceryLister`,
    text:
      ingredientCount > 0
        ? `${recipeName} (${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}) — shared via GroceryLister`
        : `${recipeName} — shared via GroceryLister`,
    url,
  };
}

export function buildGroceryListSharePayload({ listDate, url }) {
  const dateLabel = String(listDate || '').trim();

  return {
    title: dateLabel ? `Grocery list · ${dateLabel}` : 'Grocery list · GroceryLister',
    text: dateLabel
      ? `Grocery list for ${dateLabel}. Open this link to view items and check them off while you shop.`
      : 'Shared grocery list on GroceryLister. Open this link to view items and check them off while you shop.',
    url,
  };
}
