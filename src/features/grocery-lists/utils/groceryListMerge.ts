import { isBrowserOffline } from '../../../services/offlineSync.ts';

/** Normalize Firestore updatedAt to unix seconds. */
export function normalizeUpdatedAt(value: unknown): number {
  if (typeof value === 'number' && value > 0) return value;
  if (value && typeof value === 'object' && 'seconds' in value) {
    return (value as { seconds: number }).seconds || 0;
  }
  return 0;
}

type GroceryListSnapshotLike = {
  updatedAt?: unknown;
  offlineQueued?: boolean;
};

/**
 * Whether a Firestore snapshot should replace in-memory list state.
 * Keeps local/offline edits until the server has a newer updatedAt.
 */
export function shouldApplyRemoteGroceryListSnapshot(
  currentList: GroceryListSnapshotLike | null | undefined,
  remoteList: GroceryListSnapshotLike,
  contentSame: boolean,
  hasPendingSync = false
): boolean {
  if (!currentList) return true;
  if (contentSame) return false;
  if (hasPendingSync || currentList.offlineQueued) return false;

  const localUpdatedAt = normalizeUpdatedAt(currentList.updatedAt);
  const remoteUpdatedAt = normalizeUpdatedAt(remoteList.updatedAt);

  if (localUpdatedAt > remoteUpdatedAt) return false;

  if (isBrowserOffline() && localUpdatedAt >= remoteUpdatedAt) {
    return false;
  }

  return remoteUpdatedAt >= localUpdatedAt;
}

const INGREDIENT_MERGE_KEYS = [
  'name',
  'amount',
  'type',
  'crossed',
  'duplicate',
  'walmartUrl',
  'walmartUsItemId',
] as const;

type IngredientLike = {
  name?: string;
  amount?: string;
  crossed?: boolean;
  [key: string]: unknown;
};

function mergeIngredientFields(
  serverIng: IngredientLike,
  clientIng: IngredientLike | undefined
): IngredientLike {
  if (!clientIng) return serverIng;

  const merged = { ...serverIng };
  for (const key of INGREDIENT_MERGE_KEYS) {
    if (clientIng[key] !== undefined) {
      merged[key] = clientIng[key];
    }
  }
  return merged;
}

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
 * Matched items use the client's field values (including uncheck and renames).
 * For shared-list check-offs only, crossed uses OR so two shoppers can both mark items done.
 */
export function mergeGroceryListOnConflict(
  serverDoc: Record<string, unknown>,
  clientPayload: { recipes?: RecipeEntryLike[]; ingredients?: IngredientLike[] },
  options: { sharedCheckOffOnly?: boolean } = {}
): { recipes: RecipeEntryLike[]; ingredients: IngredientLike[] } {
  const sharedCheckOffOnly = options.sharedCheckOffOnly ?? false;
  const serverRecipes = [...((serverDoc.recipes as RecipeEntryLike[]) ?? [])];
  const serverIngredients = [...((serverDoc.ingredients as IngredientLike[]) ?? [])];
  const clientCrossed = buildCrossedMap(clientPayload.recipes, clientPayload.ingredients);
  const clientRecipesById = new Map(
    (clientPayload.recipes ?? []).map((entry) => [recipeEntryId(entry), entry])
  );

  const mergedRecipes = serverRecipes.map((entry) => {
    const recipe = entry.recipe;
    if (!recipe?.ingredients) return entry;

    const clientEntry = clientRecipesById.get(recipeEntryId(entry));
    const clientIngredients = clientEntry?.recipe?.ingredients ?? [];

    return {
      ...entry,
      recipe: {
        ...recipe,
        ingredients: recipe.ingredients.map((ing, idx) => {
          const clientIng = clientIngredients[idx];
          if (clientIng) {
            if (sharedCheckOffOnly) {
              return {
                ...ing,
                crossed: !!ing.crossed || !!clientIng.crossed,
              };
            }
            return mergeIngredientFields(ing, clientIng);
          }

          const key = stableIngredientKey({ ingredient: ing, recipe });
          const clientCross = clientCrossed.get(key);
          if (clientCross === undefined) return ing;
          if (sharedCheckOffOnly) {
            return { ...ing, crossed: !!ing.crossed || clientCross };
          }
          return { ...ing, crossed: clientCross };
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

  const clientManual = clientPayload.ingredients ?? [];

  const mergedIngredients = serverIngredients.map((ing, idx) => {
    const clientIng = clientManual[idx];
    if (clientIng) {
      if (sharedCheckOffOnly) {
        return {
          ...ing,
          crossed: !!ing.crossed || !!clientIng.crossed,
        };
      }
      return mergeIngredientFields(ing, clientIng);
    }

    const key = stableIngredientKey({ ingredient: ing });
    const clientCross = clientCrossed.get(key);
    if (clientCross === undefined) return ing;
    if (sharedCheckOffOnly) {
      return { ...ing, crossed: !!ing.crossed || clientCross };
    }
    return { ...ing, crossed: clientCross };
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
