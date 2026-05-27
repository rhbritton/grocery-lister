import { doc, setDoc } from 'firebase/firestore';
import { db, projectId } from './firebaseConfig.js';

export async function upsertUserProfile(user) {
  if (!user?.uid) {
    throw new Error('Cannot upsert profile without a signed-in user.');
  }

  const userProfileRef = doc(
    db,
    `artifacts/${projectId}/users/${user.uid}/profiles/${user.uid}`
  );

  await setDoc(
    userProfileRef,
    {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
    },
    { merge: true }
  );
}
