import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  reauthenticateWithPopup,
  deleteUser,
} from 'firebase/auth';
import { auth, db, projectId } from '../auth/firebaseConfig';
import { store } from '../app/store.ts';

const BATCH_SIZE = 400;

export function collectOwnedDocumentIds(items, userId) {
  return [...new Set(
    (items || [])
      .filter((item) => item && (!item.userId || item.userId === userId))
      .map((item) => item.fbid)
      .filter((fbid) => fbid && !String(fbid).startsWith('pending-'))
  )];
}

async function deleteMatchingDocs(collectionName, field, userId) {
  while (true) {
    const snapshot = await getDocs(
      query(
        collection(db, collectionName),
        where(field, '==', userId),
        limit(BATCH_SIZE)
      )
    );

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }
}

async function deleteOptionalDoc(docRef) {
  try {
    await deleteDoc(docRef);
  } catch (error) {
    if (error?.code !== 'not-found') {
      throw error;
    }
  }
}

async function deleteDocumentById(collectionName, documentId) {
  await deleteOptionalDoc(doc(db, collectionName, documentId));
}

function getUserProfileRef(userId) {
  // App.js stores profiles under artifacts/{projectId}/… (see App.js local appId).
  return doc(db, 'artifacts', projectId, 'users', userId, 'profiles', userId);
}

export function getOwnedContentIdsFromState(userId) {
  const state = store.getState();

  return {
    recipeFbids: collectOwnedDocumentIds(state.recipes?.allRecipes ?? [], userId),
    listFbids: collectOwnedDocumentIds(state.groceryLists?.groceryLists ?? [], userId),
  };
}

export async function deleteUserFirestoreData(userId, { supplementIds = null } = {}) {
  await deleteMatchingDocs('recipes', 'userId', userId);
  await deleteMatchingDocs('grocery-lists', 'userId', userId);

  const recipeFbids = supplementIds?.recipeFbids ?? [];
  const listFbids = supplementIds?.listFbids ?? [];

  for (const fbid of recipeFbids) {
    await deleteDocumentById('recipes', fbid);
  }

  for (const fbid of listFbids) {
    await deleteDocumentById('grocery-lists', fbid);
  }

  await deleteOptionalDoc(doc(db, 'recipe-favorites', userId));
  await deleteOptionalDoc(getUserProfileRef(userId));
}

export async function reauthenticateForAccountDeletion() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not signed in');
  }

  await reauthenticateWithPopup(user, new GoogleAuthProvider());
}

export function getDeleteAccountErrorMessage(error) {
  if (error?.code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled. Confirm your account to delete it.';
  }

  if (error?.code === 'auth/popup-blocked') {
    return 'Allow pop-ups for this site, then try again.';
  }

  if (error?.code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and try again.';
  }

  return error?.message || 'Could not delete your account. Try again or email support.';
}

export async function deleteAuthUser() {
  let currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Not signed in');
  }

  try {
    await deleteUser(currentUser);
  } catch (error) {
    if (error?.code !== 'auth/requires-recent-login') {
      throw error;
    }

    await reauthenticateForAccountDeletion();
    currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not signed in');
    }
    await deleteUser(currentUser);
  }
}

export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not signed in');
  }

  const supplementIds = getOwnedContentIdsFromState(user.uid);
  await deleteUserFirestoreData(user.uid, { supplementIds });
  await deleteAuthUser();
}
