import { Recipe } from '../recipes/slices/recipeSlice.ts';
import { mergeRecipesByNewestUpdatedAt } from '../recipes/utils/recipeMerge.ts';
import { PendingSyncItem } from './pendingSyncSlice.ts';

function pendingUpdatedAt(item: PendingSyncItem): number {
  return Math.floor(item.createdAt / 1000);
}

export function buildRecipeFromPendingItem(item: PendingSyncItem): Recipe | null {
  switch (item.type) {
    case 'editRecipe': {
      const payload = item.payload as Recipe & { fbid?: string };
      const fbid = payload.fbid || payload.id;
      if (!fbid) return null;
      return {
        ...payload,
        fbid,
        id: payload.id || fbid,
        updatedAt: pendingUpdatedAt(item),
        offlineQueued: true,
      };
    }
    case 'addRecipe': {
      const payload = item.payload as Recipe;
      if (!payload.id) return null;
      return {
        ...payload,
        fbid: `pending-${payload.id}`,
        updatedAt: pendingUpdatedAt(item),
        offlineQueued: true,
      };
    }
    default:
      return null;
  }
}

export function getDeletedRecipeFbids(queue: PendingSyncItem[]): Set<string> {
  return new Set(
    queue
      .filter((item) => item.type === 'deleteRecipe')
      .map((item) => String(item.payload))
  );
}

/** Merge persisted recipes with any queued offline writes (source of truth for display). */
export function getRecipeCatalogWithPending(
  allRecipes: Recipe[] | undefined,
  favoriteRecipes: Recipe[] | undefined,
  queue: PendingSyncItem[]
): Recipe[] {
  const pendingRecipes = queue
    .map(buildRecipeFromPendingItem)
    .filter((recipe): recipe is Recipe => recipe != null);
  const deleted = getDeletedRecipeFbids(queue);

  return mergeRecipesByNewestUpdatedAt([
    ...(allRecipes || []),
    ...(favoriteRecipes || []),
    ...pendingRecipes,
  ]).filter((recipe) => !deleted.has(String(recipe.fbid || recipe.id)));
}

export function overlayPendingRecipesOnCollections(
  allRecipes: Recipe[] | undefined,
  favoriteRecipes: Recipe[] | undefined,
  queue: PendingSyncItem[]
): { allRecipes: Recipe[]; favoriteRecipes: Recipe[] } {
  const catalog = getRecipeCatalogWithPending(allRecipes, favoriteRecipes, queue);
  const deleted = getDeletedRecipeFbids(queue);
  const catalogById = new Map(
    catalog.map((recipe) => [String(recipe.fbid || recipe.id), recipe])
  );

  const nextAll = (allRecipes || [])
    .map((recipe) => {
      const id = String(recipe.fbid || recipe.id);
      return catalogById.get(id) ?? recipe;
    })
    .filter((recipe) => !deleted.has(String(recipe.fbid || recipe.id)));

  for (const recipe of catalog) {
    const id = String(recipe.fbid || recipe.id);
    if (!nextAll.some((entry) => String(entry.fbid || entry.id) === id)) {
      nextAll.push(recipe);
    }
  }

  const nextFavorites = (favoriteRecipes || [])
    .map((recipe) => {
      const id = String(recipe.fbid || recipe.id);
      if (deleted.has(id)) return null;
      const merged = catalogById.get(id);
      return merged ? { ...merged, favorited: true } : recipe;
    })
    .filter(Boolean) as Recipe[];

  for (const recipe of catalog) {
    const id = String(recipe.fbid || recipe.id);
    const wasFavorite = (favoriteRecipes || []).some(
      (entry) => String(entry.fbid || entry.id) === id
    );
    if (wasFavorite && !nextFavorites.some((entry) => String(entry.fbid || entry.id) === id)) {
      nextFavorites.push({ ...recipe, favorited: true });
    }
  }

  return { allRecipes: nextAll, favoriteRecipes: nextFavorites };
}
