import { auth, db } from '../../../auth/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

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