/** Normalize Firestore updatedAt to unix seconds. */
export function normalizeUpdatedAt(value: unknown): number {
  if (typeof value === 'number' && value > 0) return value;
  if (value && typeof value === 'object' && 'seconds' in value) {
    return (value as { seconds: number }).seconds || 0;
  }
  return 0;
}

type IngredientLike = {
  name?: string;
  amount?: string;
  crossed?: boolean;
  [key: string]: unknown;
};

type RecipeLike = {
  id?: string;
  fbid?: string;
  ingredients?: IngredientLike[];
  [key: string]: unknown;
};

type RecipeEntryLike = {
  id?: string;
  recipe?: RecipeLike;
  [key: string]: unknown;
};

/** Stable key for matching the same item across server/client (ignores array index). */
export function stableIngredientKey(item: {
  ingredient: IngredientLike;
  recipe?: RecipeLike;
}): string {
  const name = item.ingredient?.name ?? '';
  const amount = item.ingredient?.amount ?? '';
  if (item.recipe) {
    return `r:${item.recipe.id ?? ''}:${item.recipe.fbid ?? ''}:${name}:${amount}`;
  }
  return `m:${name}:${amount}`;
}

function recipeEntryId(entry: RecipeEntryLike): string {
  return String(entry.id ?? entry.recipe?.fbid ?? entry.recipe?.id ?? '');
}

function buildCrossedMap(
  recipes: RecipeEntryLike[] | undefined,
  ingredients: IngredientLike[] | undefined
): Map<string, boolean> {
  const map = new Map<string, boolean>();

  (recipes ?? []).forEach((entry) => {
    const recipe = entry.recipe;
    if (!recipe?.ingredients) return;
    recipe.ingredients.forEach((ing) => {
      map.set(stableIngredientKey({ ingredient: ing, recipe }), !!ing.crossed);
    });
  });

  (ingredients ?? []).forEach((ing) => {
    map.set(stableIngredientKey({ ingredient: ing }), !!ing.crossed);
  });

  return map;
}

/**
 * When the server doc is newer than the client's base version, merge instead of overwriting.
 * Checked items use OR logic so concurrent check-offs from two people are both kept.
 */
export function mergeGroceryListOnConflict(
  serverDoc: Record<string, unknown>,
  clientPayload: { recipes?: RecipeEntryLike[]; ingredients?: IngredientLike[] }
): { recipes: RecipeEntryLike[]; ingredients: IngredientLike[] } {
  const serverRecipes = [...((serverDoc.recipes as RecipeEntryLike[]) ?? [])];
  const serverIngredients = [...((serverDoc.ingredients as IngredientLike[]) ?? [])];
  const clientCrossed = buildCrossedMap(clientPayload.recipes, clientPayload.ingredients);

  const mergedRecipes = serverRecipes.map((entry) => {
    const recipe = entry.recipe;
    if (!recipe?.ingredients) return entry;
    return {
      ...entry,
      recipe: {
        ...recipe,
        ingredients: recipe.ingredients.map((ing) => {
          const key = stableIngredientKey({ ingredient: ing, recipe });
          const clientCross = clientCrossed.get(key);
          if (clientCross === undefined) return ing;
          return { ...ing, crossed: !!ing.crossed || clientCross };
        }),
      },
    };
  });

  const serverRecipeIds = new Set(serverRecipes.map(recipeEntryId));
  for (const entry of clientPayload.recipes ?? []) {
    const id = recipeEntryId(entry);
    if (id && !serverRecipeIds.has(id)) {
      mergedRecipes.push(entry);
      serverRecipeIds.add(id);
    }
  }

  const mergedIngredients = serverIngredients.map((ing) => {
    const key = stableIngredientKey({ ingredient: ing });
    const clientCross = clientCrossed.get(key);
    if (clientCross === undefined) return ing;
    return { ...ing, crossed: !!ing.crossed || clientCross };
  });

  const serverManualKeys = new Set(
    serverIngredients.map((ing) => stableIngredientKey({ ingredient: ing }))
  );
  for (const ing of clientPayload.ingredients ?? []) {
    const key = stableIngredientKey({ ingredient: ing });
    if (!serverManualKeys.has(key)) {
      mergedIngredients.push(ing);
      serverManualKeys.add(key);
    }
  }

  return { recipes: mergedRecipes, ingredients: mergedIngredients };
}
