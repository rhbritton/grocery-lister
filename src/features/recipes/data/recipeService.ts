import store from 'store2';

import { Recipe } from '../slices/recipeSlice.ts';

export const RecipeService = {
  getRecipeById: async (id: string): Promise<Recipe | undefined> => {
    let recipe;
    let all_recipes = store('recipes');
    all_recipes.some(function(r) {
        if (r.id == id) {
            recipe = r;
            return true;
        }
    });

    return recipe;
  },
};