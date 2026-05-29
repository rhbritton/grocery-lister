import { Recipe } from '../slices/recipeSlice.ts';
import { isLocalNewer } from '../../../services/offlineSync.ts';

export function mergeRecipesByNewestUpdatedAt(recipes: Recipe[]): Recipe[] {
  const uniqueMap = new Map<string, Recipe>();

  for (const recipe of recipes) {
    const id = recipe.fbid || recipe.id;
    if (!id) continue;

    const key = String(id);
    const existing = uniqueMap.get(key);
    if (!existing) {
      uniqueMap.set(key, recipe);
      continue;
    }

    const keepExisting = isLocalNewer(existing.updatedAt, recipe.updatedAt);
    const winner = keepExisting ? existing : recipe;
    const loser = keepExisting ? recipe : existing;
    uniqueMap.set(key, {
      ...loser,
      ...winner,
      favorited: Boolean(existing.favorited || recipe.favorited),
    });
  }

  return Array.from(uniqueMap.values());
}
