import { db } from '../../../auth/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

import { GroceryList } from '../slices/groceryListSlice.ts';

const findGroceryListInList = (groceryLists: GroceryList[] | undefined, id: string): GroceryList | undefined => {
  if (!groceryLists?.length) return undefined;
  return groceryLists.find((gl) => gl.fbid === id || gl.id === id);
};

export const GroceryListService = {
  getGroceryList: async (id: string, localGroceryLists: GroceryList[] = []): Promise<GroceryList | undefined> => {
    const cached = findGroceryListInList(localGroceryLists, id);
    if (cached) return cached;

    if (!navigator.onLine) return undefined;

    return GroceryListService.getGroceryListByFirebaseId(id);
  },
  getGroceryListByFirebaseId: async (fbid: string) => {
    try {
      const docRef = doc(db, 'grocery-lists', fbid);
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
