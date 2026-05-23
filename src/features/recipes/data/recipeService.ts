import { db } from '../../../auth/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

import { Recipe } from '../slices/recipeSlice.ts';

const findRecipeInList = (recipes: Recipe[] | undefined, id: string): Recipe | undefined => {
  if (!recipes?.length) return undefined;
  return recipes.find((r) => r.fbid === id || r.id === id);
};

export const RecipeService = {
  getRecipe: async (id: string, localRecipes: Recipe[] = []): Promise<Recipe | undefined> => {
    const cached = findRecipeInList(localRecipes, id);
    if (cached) return cached;

    if (!navigator.onLine) return undefined;

    return RecipeService.getRecipeByFirebaseId(id);
  },
  getRecipeByFirebaseId: async (fbid: string) => {
    try {
      const docRef = doc(db, 'recipes', fbid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { fbid: docSnap.id, ...docSnap.data(), updatedAt: docSnap.data()?.updatedAt?.seconds || 0 };
      } else {
        console.log("No such document!");
        return undefined;
      }
    } catch (e) {
      console.error("Error getting document:", e);
      return undefined;
    }
  }
};
