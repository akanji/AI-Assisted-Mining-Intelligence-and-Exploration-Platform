import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Smoke test connection to Firestore as mandated
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    // Return false or log
    return false;
  }
}

// User Profile interface
export interface UserProfileDoc {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'geologist' | 'engineer' | 'admin' | 'viewer';
  createdAt: string;
  updatedAt?: string;
}

// Drill Hole Annotation interface
export interface DrillHoleAnnotationDoc {
  id: string;
  holeId: string;
  depthFrom: number;
  depthTo: number;
  note: string;
  category?: string;
  authorId: string;
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
}

// Auth helpers
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    // Check if profile exists, if not create
    const userRef = doc(db, 'users', user.uid);
    try {
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        const newProfile: UserProfileDoc = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Geologist',
          photoURL: user.photoURL || '',
          role: 'geologist',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
      }
    } catch {
      // Ignored non-fatal on profile check
    }
    return user;
  } catch (err) {
    console.error('Firebase Google sign-in failed', err);
    throw err;
  }
}

export async function signOutUser() {
  await fbSignOut(auth);
}

// Firestore operations for Annotations
export async function saveAnnotationToFirestore(annotation: DrillHoleAnnotationDoc): Promise<void> {
  const path = `drillHoleAnnotations/${annotation.id}`;
  try {
    await setDoc(doc(db, 'drillHoleAnnotations', annotation.id), annotation);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAnnotationFromFirestore(annotationId: string): Promise<void> {
  const path = `drillHoleAnnotations/${annotationId}`;
  try {
    await deleteDoc(doc(db, 'drillHoleAnnotations', annotationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToDrillHoleAnnotations(
  holeId: string,
  onUpdate: (annotations: DrillHoleAnnotationDoc[]) => void
): Unsubscribe {
  const path = 'drillHoleAnnotations';
  const q = query(collection(db, path), where('holeId', '==', holeId));
  return onSnapshot(
    q,
    (snapshot) => {
      const notes: DrillHoleAnnotationDoc[] = [];
      snapshot.forEach((docSnap) => {
        notes.push(docSnap.data() as DrillHoleAnnotationDoc);
      });
      onUpdate(notes);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}
