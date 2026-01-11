import store from 'store2';

import { auth, db } from '../../../auth/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

import { GroceryList } from '../slices/groceryListSlice.ts';

export const GroceryListService = {
  getGroceryListById: async (id: string): Promise<GroceryList | undefined> => {
    let groceryList;
    let all_grocery_lists = store('grocery-lists');
    all_grocery_lists.some(function(gl) {
        if (gl.id == id) {
            groceryList = gl;
            return true;
        }
    });

    return groceryList;
  },
  getGroceryListByFirebaseId: async (fbid: string) => {
    try {
      const docRef = doc(db, 'grocery-lists', fbid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { fbid: docSnap.id, ...docSnap.data(), updatedAt: docSnap.data()?.updatedAt?.seconds || 0 };
      } else {
        // Document does not exist
        console.log("No such document!");
        return undefined;
      }
    } catch (e) {
      console.error("Error getting document:", e);
      return undefined;
    }
  }
};