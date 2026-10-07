import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  signInWithGoogle as authSignInWithGoogle,
  signOutUser as authSignOutUser,
  testFirestoreConnection,
  UserProfileDoc,
  DrillHoleAnnotationDoc,
  saveAnnotationToFirestore,
  deleteAnnotationFromFirestore,
  subscribeToDrillHoleAnnotations,
  handleFirestoreError,
  OperationType,
} from '../firebase';

interface FirebaseContextType {
  firebaseUser: User | null;
  firebaseProfile: UserProfileDoc | null;
  isFirebaseLoading: boolean;
  isFirestoreConnected: boolean;
  connectionError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  saveAnnotation: (annotation: DrillHoleAnnotationDoc) => Promise<void>;
  deleteAnnotation: (annotationId: string) => Promise<void>;
  subscribeAnnotations: (holeId: string, callback: (notes: DrillHoleAnnotationDoc[]) => void) => () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [firebaseProfile, setFirebaseProfile] = useState<UserProfileDoc | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Validate connection on boot as mandated
  useEffect(() => {
    let mounted = true;
    testFirestoreConnection()
      .then((ok) => {
        if (mounted) {
          setIsFirestoreConnected(ok);
        }
      })
      .catch((err) => {
        if (mounted) {
          setConnectionError(err instanceof Error ? err.message : String(err));
          setIsFirestoreConnected(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setFirebaseProfile(snap.data() as UserProfileDoc);
          } else {
            const initialProfile: UserProfileDoc = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Field Geologist',
              photoURL: user.photoURL || '',
              role: 'geologist',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile);
            setFirebaseProfile(initialProfile);
          }
        } catch (err) {
          console.warn('Could not load user profile from Firestore:', err);
        }
      } else {
        setFirebaseProfile(null);
      }
      setIsFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await authSignInWithGoogle();
    } catch (err) {
      console.error('Google Sign-in failed', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    await authSignOutUser();
    setFirebaseProfile(null);
  };

  const checkConnection = async (): Promise<boolean> => {
    const ok = await testFirestoreConnection();
    setIsFirestoreConnected(ok);
    return ok;
  };

  const saveAnnotation = async (annotation: DrillHoleAnnotationDoc) => {
    await saveAnnotationToFirestore(annotation);
  };

  const deleteAnnotation = async (annotationId: string) => {
    await deleteAnnotationFromFirestore(annotationId);
  };

  const subscribeAnnotations = (holeId: string, callback: (notes: DrillHoleAnnotationDoc[]) => void) => {
    return subscribeToDrillHoleAnnotations(holeId, callback);
  };

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        firebaseProfile,
        isFirebaseLoading,
        isFirestoreConnected,
        connectionError,
        signInWithGoogle,
        signOutUser,
        checkConnection,
        saveAnnotation,
        deleteAnnotation,
        subscribeAnnotations,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
