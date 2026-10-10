import { useState, useEffect, useCallback } from 'react';
import {
  initLocalForageStorage,
  getLocalForageStats,
  saveAnnotationLocally,
  saveDrillHolesToLocalForage,
  getStoredDrillHolesFromLocalForage,
  drainLocalForageSyncQueue,
  getAllStoredAnnotations,
  LocalForageStats,
  SyncQueueItem
} from '../services/localForageStorage';
import { DrillHole } from '../types';

export function useLocalForageSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [stats, setStats] = useState<LocalForageStats | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ syncedCount: number; errorsCount: number } | null>(null);
  const [storedAnnotations, setStoredAnnotations] = useState<Record<string, string[]>>({});

  const refreshStats = useCallback(async () => {
    try {
      const currentStats = await getLocalForageStats();
      setStats(currentStats);
      const annos = await getAllStoredAnnotations();
      setStoredAnnotations(annos);
    } catch (e) {
      console.warn('Error refreshing localForage stats:', e);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await drainLocalForageSyncQueue();
      setLastSyncResult(result);
      await refreshStats();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshStats]);

  // Initial setup and network listeners
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      await initLocalForageStorage();
      if (mounted) {
        await refreshStats();
      }
    };
    setup();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync upon reconnection
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync, refreshStats]);

  const addLocalAnnotation = useCallback(async (holeId: string, intervalIdx: number, text: string) => {
    await saveAnnotationLocally(holeId, intervalIdx, text);
    await refreshStats();
  }, [refreshStats]);

  const persistDrillHoles = useCallback(async (holes: DrillHole[]) => {
    await saveDrillHolesToLocalForage(holes);
    await refreshStats();
  }, [refreshStats]);

  const toggleSimulatedConnection = useCallback(() => {
    setIsOnline((prev) => !prev);
  }, []);

  return {
    isOnline,
    stats,
    isSyncing,
    lastSyncResult,
    storedAnnotations,
    triggerSync,
    refreshStats,
    addLocalAnnotation,
    persistDrillHoles,
    toggleSimulatedConnection
  };
}
