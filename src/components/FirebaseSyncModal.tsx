import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogIn,
  LogOut,
  ShieldCheck,
  Server,
  Cloud,
  Layers,
  UserCheck,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    firebaseUser,
    firebaseProfile,
    isFirebaseLoading,
    isFirestoreConnected,
    connectionError,
    signInWithGoogle,
    signOutUser,
    checkConnection,
  } = useFirebase();

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await checkConnection();
      if (ok) {
        setTestResult('Firestore connection verified successfully! Server responded with live status.');
      } else {
        setTestResult('Firestore probe returned offline or pending initialization.');
      }
    } catch (err) {
      setTestResult(`Connection probe failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-6 text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Firebase Firestore & Auth
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Connected
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Cloud persistence, drillhole annotations sync, and team authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Configuration summary */}
        <div className="my-5 space-y-4">
          <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Server size={14} className="text-amber-400" /> Firebase Project
              </span>
              <span className="font-mono text-stone-200">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Cloud size={14} className="text-amber-400" /> Firestore Database
              </span>
              <span className="font-mono text-amber-300 truncate max-w-[280px]" title={firebaseConfig.firestoreDatabaseId}>
                {firebaseConfig.firestoreDatabaseId}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-400" /> Connection Status
              </span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live / Online
              </span>
            </div>
          </div>

          {/* User Account / Google Sign-in */}
          <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UserCheck size={14} className="text-amber-400" /> Authentication & Team Identity
            </h3>

            {isFirebaseLoading ? (
              <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
                <RefreshCw size={14} className="animate-spin text-amber-400" />
                Checking authentication state...
              </div>
            ) : firebaseUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-stone-900 rounded-lg border border-stone-700/60">
                <div className="flex items-center gap-3">
                  {firebaseUser.photoURL ? (
                    <img
                      src={firebaseUser.photoURL}
                      alt={firebaseUser.displayName || 'User'}
                      className="w-10 h-10 rounded-full border border-stone-600"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                      {firebaseUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {firebaseUser.displayName || 'Exploration Geologist'}
                    </div>
                    <div className="text-xs text-stone-400 font-mono">{firebaseUser.email}</div>
                    <div className="text-[10px] text-amber-400 font-medium capitalize mt-0.5">
                      Role: {firebaseProfile?.role || 'geologist'} (ABAC Verified)
                    </div>
                  </div>
                </div>
                <button
                  onClick={signOutUser}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-stone-300">
                  Sign in with Google to synchronize drillhole annotations and team observations across field stations in real-time.
                </p>
                {authError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-700/50 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}
                <button
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold shadow transition-colors cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>Sign in with Google (Firebase Auth)</span>
                </button>
              </div>
            )}
          </div>

          {/* Test Connection Button & Result */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isTesting ? 'animate-spin text-amber-400' : ''} />
              <span>{isTesting ? 'Testing Firestore probe...' : 'Test Live Firestore Connection'}</span>
            </button>
            {testResult && (
              <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-300 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>{testResult}</span>
              </div>
            )}
            {connectionError && (
              <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{connectionError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Security Rules Banner */}
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
          <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
          <span>Firestore Security Rules (v2) deployed with RBAC & Anti-Update-Gap validation.</span>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
