import { useState, useEffect, useCallback } from 'react';
import {
  initLocalForageStorage,
  getLocalForageStats,
  saveAnnotationLocally,
  saveDrillHolesToLocalForage,
  getStoredDrillHolesFromLocalForage,
  drainLocalForageSyncQueue,
  setSimulateOfflineMode,
  getSimulateOfflineMode,
  subscribeToAutoSync,
  getPendingSyncQueue,
  getAllLocalAnnotations,
  OfflineStorageStats,
  QueuedSyncAction,
} from '../services/localForageStorage';
import { DrillHole } from '../types';

export function useLocalForageSync(onCloudSync?: (action: QueuedSyncAction) => Promise<boolean>) {
  const [stats, setStats] = useState<OfflineStorageStats>({
    drillholeCount: 0,
    targetCount: 0,
    annotationCount: 0,
    pendingSyncCount: 0,
    lastSyncedAt: null,
    storageDriver: 'IndexedDB',
    isSimulatingOffline: false,
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [isSimulatingOffline, setIsSimulatingOffline] = useState<boolean>(getSimulateOfflineMode());
  const [pendingActions, setPendingActions] = useState<QueuedSyncAction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  // Refresh stats and queue
  const refreshStats = useCallback(async () => {
    const s = await getLocalForageStats();
    setStats(s);
    const queue = await getPendingSyncQueue();
    setPendingActions(queue);
  }, []);

  useEffect(() => {
    initLocalForageStorage().then(() => {
      refreshStats();
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = subscribeToAutoSync((event) => {
      setLastSyncMessage(event.message);
      if (event.type === 'sync_start') {
        setIsSyncing(true);
      } else if (event.type === 'sync_complete' || event.type === 'sync_error') {
        setIsSyncing(false);
        refreshStats();
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [refreshStats]);

  const toggleSimulatedOffline = useCallback(() => {
    const nextState = !isSimulatingOffline;
    setSimulateOfflineMode(nextState);
    setIsSimulatingOffline(nextState);
    refreshStats();
  }, [isSimulatingOffline, refreshStats]);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await drainLocalForageSyncQueue(onCloudSync);
    } finally {
      setIsSyncing(false);
      refreshStats();
    }
  }, [onCloudSync, refreshStats]);

  const addLocalAnnotation = useCallback(
    async (holeId: string, intervalKey: string, noteText: string) => {
      const result = await saveAnnotationLocally(holeId, intervalKey, noteText, isOnline && !isSimulatingOffline);
      await refreshStats();
      return result;
    },
    [isOnline, isSimulatingOffline, refreshStats]
  );

  const cacheDrillHoles = useCallback(
    async (holes: DrillHole[]) => {
      await saveDrillHolesToLocalForage(holes);
      await refreshStats();
    },
    [refreshStats]
  );

  const effectiveOnline = isOnline && !isSimulatingOffline;

  return {
    isOnline: effectiveOnline,
    rawIsOnline: isOnline,
    isSimulatingOffline,
    toggleSimulatedOffline,
    stats,
    pendingActions,
    isSyncing,
    lastSyncMessage,
    refreshStats,
    triggerSync,
    addLocalAnnotation,
    cacheDrillHoles,
    getStoredDrillHoles: getStoredDrillHolesFromLocalForage,
    getAllLocalAnnotations,
  };
}
