import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
export const configured = () => Boolean(process.env.FIREBASE_PROJECT_ID);
export function firebaseApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId)
    throw new Error(
      "Configure o projeto Firebase para ativar esta funcionalidade.",
    );
  return (
    getApps()[0] ||
    initializeApp({
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      ...(process.env.FIRESTORE_EMULATOR_HOST
        ? {}
        : { credential: applicationDefault() }),
    })
  );
}
export const firestore = () => getFirestore(firebaseApp());
export const auth = () => getAuth(firebaseApp());
export const bucket = () => getStorage(firebaseApp()).bucket();
