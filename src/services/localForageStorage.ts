import localforage from 'localforage';
import { DrillHole, ExplorationTarget } from '../types';
import { SAMPLE_DRILLHOLES, EXPLORATION_TARGETS } from '../data/miningData';

// Configured localForage store instances
export const drillholesLocalStore = localforage.createInstance({
  name: 'MineAI_Offline_Store',
  storeName: 'drillholes_exploration',
  description: 'IndexedDB offline storage for borehole geometries, assays, and geological strata'
});

export const explorationTargetsLocalStore = localforage.createInstance({
  name: 'MineAI_Offline_Store',
  storeName: 'exploration_targets',
  description: 'IndexedDB offline storage for concession exploration targets'
});

export const syncQueueLocalStore = localforage.createInstance({
  name: 'MineAI_Offline_Store',
  storeName: 'sync_mutation_queue',
  description: 'Pending mutations awaiting network restoration for auto-sync'
});

export const annotationsLocalStore = localforage.createInstance({
  name: 'MineAI_Offline_Store',
  storeName: 'drillhole_annotations',
  description: 'Stratigraphical interval annotations saved offline'
});

export interface SyncQueueItem {
  id: string;
  type: 'DRILLHOLE_UPDATE' | 'DRILLHOLE_CREATE' | 'ANNOTATION_ADD' | 'TARGET_UPDATE';
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
}

export interface LocalForageStats {
  drillholeCount: number;
  targetCount: number;
  pendingSyncCount: number;
  annotationCount: number;
  lastSyncedTimestamp: string | null;
  storageDriver: string;
}

// Initialize and seed if empty
export const initLocalForageStorage = async (): Promise<void> => {
  try {
    const holeKeys = await drillholesLocalStore.keys();
    if (holeKeys.length === 0) {
      for (const hole of SAMPLE_DRILLHOLES) {
        const key = hole.id || hole.holeId;
        await drillholesLocalStore.setItem(key, hole);
      }
    }

    const targetKeys = await explorationTargetsLocalStore.keys();
    if (targetKeys.length === 0) {
      for (const target of EXPLORATION_TARGETS) {
        await explorationTargetsLocalStore.setItem(target.id, target);
      }
    }
  } catch (error) {
    console.warn('Failed to initialize localForage storage layer:', error);
  }
};

// Retrieve all drillholes from localForage
export const getStoredDrillHolesFromLocalForage = async (): Promise<DrillHole[]> => {
  try {
    const holes: DrillHole[] = [];
    await drillholesLocalStore.iterate<DrillHole, void>((value) => {
      holes.push(value);
    });
    if (holes.length === 0) {
      // Seed and return sample
      await initLocalForageStorage();
      return SAMPLE_DRILLHOLES;
    }
    return holes;
  } catch (error) {
    console.warn('Error reading drillholes from localForage, falling back to sample data:', error);
    return SAMPLE_DRILLHOLES;
  }
};

// Save or update drillhole in localForage
export const saveDrillHoleToLocalForage = async (hole: DrillHole): Promise<void> => {
  const key = hole.id || hole.holeId;
  await drillholesLocalStore.setItem(key, hole);
  // Queue for auto-sync if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await queueMutationForSync({
      id: `sync_hole_${key}_${Date.now()}`,
      type: 'DRILLHOLE_UPDATE',
      payload: hole,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    });
  }
};

// Save array of drillholes
export const saveDrillHolesToLocalForage = async (holes: DrillHole[]): Promise<void> => {
  for (const hole of holes) {
    const key = hole.id || hole.holeId;
    await drillholesLocalStore.setItem(key, hole);
  }
};

// Annotations
export const saveAnnotationLocally = async (holeId: string, intervalIdx: number, text: string): Promise<void> => {
  const key = `${holeId}_int_${intervalIdx}`;
  const existing = (await annotationsLocalStore.getItem<string[]>(key)) || [];
  const updated = [...existing, text];
  await annotationsLocalStore.setItem(key, updated);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await queueMutationForSync({
      id: `sync_ann_${key}_${Date.now()}`,
      type: 'ANNOTATION_ADD',
      payload: { holeId, intervalIdx, text, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    });
  }
};

export const getAnnotationsLocally = async (holeId: string, intervalIdx: number): Promise<string[]> => {
  const key = `${holeId}_int_${intervalIdx}`;
  return (await annotationsLocalStore.getItem<string[]>(key)) || [];
};

export const getAllStoredAnnotations = async (): Promise<Record<string, string[]>> => {
  const result: Record<string, string[]> = {};
  await annotationsLocalStore.iterate<string[], void>((value, key) => {
    result[key] = value;
  });
  return result;
};

// Sync queue management
export const queueMutationForSync = async (item: SyncQueueItem): Promise<void> => {
  await syncQueueLocalStore.setItem(item.id, item);
};

export const getPendingSyncItems = async (): Promise<SyncQueueItem[]> => {
  const items: SyncQueueItem[] = [];
  await syncQueueLocalStore.iterate<SyncQueueItem, void>((value) => {
    if (value.status === 'pending' || value.status === 'failed') {
      items.push(value);
    }
  });
  return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

// Drain queue when online
export const drainLocalForageSyncQueue = async (
  onItemSynced?: (item: SyncQueueItem) => void
): Promise<{ syncedCount: number; errorsCount: number }> => {
  const pending = await getPendingSyncItems();
  let syncedCount = 0;
  let errorsCount = 0;

  for (const item of pending) {
    try {
      item.status = 'syncing';
      await syncQueueLocalStore.setItem(item.id, item);

      // Simulate remote network transmission latency
      await new Promise((r) => setTimeout(r, 120));

      // Successfully synced
      item.status = 'synced';
      await syncQueueLocalStore.removeItem(item.id);
      syncedCount++;
      if (onItemSynced) {
        onItemSynced(item);
      }
    } catch (err) {
      console.error('Failed to sync item:', item.id, err);
      item.status = 'failed';
      item.retryCount += 1;
      await syncQueueLocalStore.setItem(item.id, item);
      errorsCount++;
    }
  }

  return { syncedCount, errorsCount };
};

// Statistics
export const getLocalForageStats = async (): Promise<LocalForageStats> => {
  const drillholeKeys = await drillholesLocalStore.keys();
  const targetKeys = await explorationTargetsLocalStore.keys();
  const syncKeys = await syncQueueLocalStore.keys();
  const annotationKeys = await annotationsLocalStore.keys();
  const driver = drillholesLocalStore.driver() || 'asyncStorage';

  return {
    drillholeCount: drillholeKeys.length,
    targetCount: targetKeys.length,
    pendingSyncCount: syncKeys.length,
    annotationCount: annotationKeys.length,
    lastSyncedTimestamp: new Date().toISOString(),
    storageDriver: driver.replace(/localforage_/, '')
  };
};

// Clear and reset offline cache
export const resetLocalForageOfflineData = async (): Promise<void> => {
  await drillholesLocalStore.clear();
  await explorationTargetsLocalStore.clear();
  await syncQueueLocalStore.clear();
  await annotationsLocalStore.clear();
  await initLocalForageStorage();
};
