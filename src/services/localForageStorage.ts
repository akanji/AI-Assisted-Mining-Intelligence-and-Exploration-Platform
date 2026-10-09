import localforage from 'localforage';
import { DrillHole, ExplorationTarget } from '../types';
import { SAMPLE_DRILLHOLES, EXPLORATION_TARGETS } from '../data/miningData';

// Configure distinct localForage store instances for clean segregation of exploration data
export const drillholesStore = localforage.createInstance({
  name: 'MineAI_Exploration_DB',
  storeName: 'critical_drillholes',
  description: 'Local storage of borehole surveys, collar coordinates, and lithological core intervals'
});

export const explorationTargetsStore = localforage.createInstance({
  name: 'MineAI_Exploration_DB',
  storeName: 'exploration_targets',
  description: 'Locally cached regional exploration targets, geochemical anomalies, and geophysical conductors'
});

export const annotationsStore = localforage.createInstance({
  name: 'MineAI_Exploration_DB',
  storeName: 'field_annotations',
  description: 'Field notes, geological core log annotations, and depth interval observations'
});

export const syncQueueStore = localforage.createInstance({
  name: 'MineAI_Exploration_DB',
  storeName: 'offline_sync_queue',
  description: 'Queued operations captured while offline awaiting cloud synchronization'
});

export const metadataStore = localforage.createInstance({
  name: 'MineAI_Exploration_DB',
  storeName: 'sync_metadata',
  description: 'Synchronization history, local cache statistics, and offline connectivity status'
});

export interface QueuedSyncAction {
  id: string;
  type: 'annotation' | 'drillhole_update' | 'field_note' | 'assay_update';
  holeId?: string;
  intervalKey?: string;
  payload: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

export interface OfflineStorageStats {
  drillholeCount: number;
  targetCount: number;
  annotationCount: number;
  pendingSyncCount: number;
  lastSyncedAt: string | null;
  storageDriver: string;
  isSimulatingOffline: boolean;
}

export type AutoSyncCallback = (event: {
  type: 'online' | 'offline' | 'sync_start' | 'sync_progress' | 'sync_complete' | 'sync_error';
  message: string;
  pendingCount?: number;
  syncedCount?: number;
  timestamp: string;
}) => void;

const SYNC_LISTENERS: Set<AutoSyncCallback> = new Set();
let isSimulatingOfflineMode = false;
let autoSyncIntervalId: ReturnType<typeof setInterval> | null = null;

// Notify all subscribers of sync state updates
function notifyListeners(event: Parameters<AutoSyncCallback>[0]) {
  SYNC_LISTENERS.forEach((cb) => {
    try {
      cb(event);
    } catch (err) {
      console.warn('Error in sync listener callback:', err);
    }
  });
}

/**
 * Initializes localForage IndexedDB stores and pre-populates default datasets if empty
 */
export async function initLocalForageStorage(): Promise<OfflineStorageStats> {
  try {
    const existingHolesCount = await drillholesStore.length();
    if (existingHolesCount === 0) {
      // Seed initial critical drillhole datasets
      for (const hole of SAMPLE_DRILLHOLES) {
        await drillholesStore.setItem(hole.holeId, hole);
      }
    }

    const existingTargetsCount = await explorationTargetsStore.length();
    if (existingTargetsCount === 0) {
      for (const target of EXPLORATION_TARGETS) {
        await explorationTargetsStore.setItem(target.id, target);
      }
    }

    // Default metadata
    const lastSync = await metadataStore.getItem<string>('last_successful_sync');
    if (!lastSync) {
      await metadataStore.setItem('last_successful_sync', new Date().toISOString());
    }

    startAutoSyncWatchdog();
    return await getLocalForageStats();
  } catch (err) {
    console.error('Failed to initialize localForage IndexedDB store:', err);
    return await getLocalForageStats();
  }
}

/**
 * Retrieve all drillholes stored in localForage
 */
export async function getStoredDrillHolesFromLocalForage(): Promise<DrillHole[]> {
  try {
    const holes: DrillHole[] = [];
    await drillholesStore.iterate<DrillHole, void>((value) => {
      if (value && value.holeId) {
        holes.push(value);
      }
    });
    if (holes.length === 0) {
      return SAMPLE_DRILLHOLES;
    }
    return holes;
  } catch (err) {
    console.warn('Failed to read drillholes from localForage, falling back to in-memory sample:', err);
    return SAMPLE_DRILLHOLES;
  }
}

/**
 * Save or update drillholes in localForage IndexedDB
 */
export async function saveDrillHolesToLocalForage(holes: DrillHole[]): Promise<void> {
  try {
    for (const hole of holes) {
      await drillholesStore.setItem(hole.holeId, hole);
    }
    await metadataStore.setItem('last_cached_at', new Date().toISOString());
  } catch (err) {
    console.error('Failed to cache drillholes to localForage:', err);
    throw err;
  }
}

/**
 * Retrieve cached exploration targets
 */
export async function getStoredTargetsFromLocalForage(): Promise<ExplorationTarget[]> {
  try {
    const targets: ExplorationTarget[] = [];
    await explorationTargetsStore.iterate<ExplorationTarget, void>((value) => {
      if (value && value.id) {
        targets.push(value);
      }
    });
    if (targets.length === 0) {
      return EXPLORATION_TARGETS;
    }
    return targets;
  } catch (err) {
    return EXPLORATION_TARGETS;
  }
}

/**
 * Save an annotation locally in IndexedDB, and enqueue for sync if network is unavailable
 */
export async function saveAnnotationLocally(
  holeId: string,
  intervalKey: string,
  noteText: string,
  isOnline: boolean
): Promise<{ savedLocally: boolean; queuedForSync: boolean }> {
  try {
    // 1. Save to local annotation store
    const existingNotes = (await annotationsStore.getItem<string[]>(intervalKey)) || [];
    if (!existingNotes.includes(noteText)) {
      existingNotes.push(noteText);
      await annotationsStore.setItem(intervalKey, existingNotes);
    }

    // 2. If offline or simulated offline, enqueue for auto-sync
    const effectivelyOffline = !isOnline || isSimulatingOfflineMode;
    if (effectivelyOffline) {
      const syncAction: QueuedSyncAction = {
        id: `sync-annot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'annotation',
        holeId,
        intervalKey,
        payload: { holeId, intervalKey, note: noteText, timestamp: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        status: 'pending',
        retryCount: 0
      };
      await syncQueueStore.setItem(syncAction.id, syncAction);
      notifyListeners({
        type: 'offline',
        message: `Saved locally to IndexedDB: "${noteText.substring(0, 32)}..." (Queued for Auto-Sync)`,
        timestamp: new Date().toISOString()
      });
      return { savedLocally: true, queuedForSync: true };
    }

    return { savedLocally: true, queuedForSync: false };
  } catch (err) {
    console.error('Failed to save annotation to localForage:', err);
    throw err;
  }
}

/**
 * Retrieve all local annotations map
 */
export async function getAllLocalAnnotations(): Promise<Record<string, string[]>> {
  const map: Record<string, string[]> = {};
  try {
    await annotationsStore.iterate<string[], void>((val, key) => {
      map[key] = val;
    });
  } catch (err) {
    console.warn('Failed to read annotations from localForage:', err);
  }
  return map;
}

/**
 * Get pending sync queue items
 */
export async function getPendingSyncQueue(): Promise<QueuedSyncAction[]> {
  const items: QueuedSyncAction[] = [];
  try {
    await syncQueueStore.iterate<QueuedSyncAction, void>((value) => {
      if (value) items.push(value);
    });
  } catch (err) {
    console.warn('Failed to read sync queue from localForage:', err);
  }
  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Drains the offline sync queue by uploading pending actions to cloud or local persistence
 */
export async function drainLocalForageSyncQueue(
  cloudSyncHandler?: (action: QueuedSyncAction) => Promise<boolean>
): Promise<{ total: number; synced: number; failed: number }> {
  if (isSimulatingOfflineMode) {
    return { total: 0, synced: 0, failed: 0 };
  }

  const pending = await getPendingSyncQueue();
  if (pending.length === 0) {
    return { total: 0, synced: 0, failed: 0 };
  }

  notifyListeners({
    type: 'sync_start',
    message: `Auto-Sync initiating: Syncing ${pending.length} pending exploration record(s) to cloud...`,
    pendingCount: pending.length,
    timestamp: new Date().toISOString()
  });

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      let success = true;
      if (cloudSyncHandler) {
        success = await cloudSyncHandler(item);
      }

      if (success) {
        // Remove item from queue once successfully processed
        await syncQueueStore.removeItem(item.id);
        synced++;
        notifyListeners({
          type: 'sync_progress',
          message: `Synchronized ${item.type} for ${item.holeId || 'exploration item'}`,
          syncedCount: synced,
          pendingCount: pending.length - synced,
          timestamp: new Date().toISOString()
        });
      } else {
        item.retryCount = (item.retryCount || 0) + 1;
        await syncQueueStore.setItem(item.id, item);
        failed++;
      }
    } catch (err) {
      item.retryCount = (item.retryCount || 0) + 1;
      await syncQueueStore.setItem(item.id, item);
      failed++;
    }
  }

  const nowIso = new Date().toISOString();
  await metadataStore.setItem('last_successful_sync', nowIso);

  notifyListeners({
    type: 'sync_complete',
    message: `Auto-Sync completed! ${synced} item(s) synchronized successfully.`,
    syncedCount: synced,
    pendingCount: failed,
    timestamp: nowIso
  });

  return { total: pending.length, synced, failed };
}

/**
 * Simulates offline/online mode for field testing
 */
export function setSimulateOfflineMode(simulate: boolean): boolean {
  isSimulatingOfflineMode = simulate;
  notifyListeners({
    type: simulate ? 'offline' : 'online',
    message: simulate
      ? 'Field Offline Mode activated: Exploration data will be cached exclusively to IndexedDB (localForage).'
      : 'Online Mode restored: Auto-Sync will now synchronize queued local exploration data.',
    timestamp: new Date().toISOString()
  });

  if (!simulate) {
    // Attempt auto-sync right away when switching back to online
    setTimeout(() => {
      drainLocalForageSyncQueue();
    }, 400);
  }
  return isSimulatingOfflineMode;
}

export function getSimulateOfflineMode(): boolean {
  return isSimulatingOfflineMode;
}

/**
 * Get comprehensive statistics of the localForage IndexedDB layer
 */
export async function getLocalForageStats(): Promise<OfflineStorageStats> {
  try {
    const [dhCount, targetCount, annotCount, pendingCount, lastSync] = await Promise.all([
      drillholesStore.length(),
      explorationTargetsStore.length(),
      annotationsStore.length(),
      syncQueueStore.length(),
      metadataStore.getItem<string>('last_successful_sync')
    ]);

    return {
      drillholeCount: dhCount,
      targetCount,
      annotationCount: annotCount,
      pendingSyncCount: pendingCount,
      lastSyncedAt: lastSync || null,
      storageDriver: drillholesStore.driver() || 'asyncStorage / IndexedDB',
      isSimulatingOffline: isSimulatingOfflineMode
    };
  } catch (err) {
    return {
      drillholeCount: 0,
      targetCount: 0,
      annotationCount: 0,
      pendingSyncCount: 0,
      lastSyncedAt: null,
      storageDriver: 'IndexedDB',
      isSimulatingOffline: isSimulatingOfflineMode
    };
  }
}

/**
 * Subscribe to auto-sync events
 */
export function subscribeToAutoSync(callback: AutoSyncCallback): () => void {
  SYNC_LISTENERS.add(callback);
  return () => {
    SYNC_LISTENERS.delete(callback);
  };
}

/**
 * Set up network event listeners and auto-sync watchdog
 */
function startAutoSyncWatchdog() {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    if (!isSimulatingOfflineMode) {
      notifyListeners({
        type: 'online',
        message: 'Internet connection detected. Auto-sync triggered.',
        timestamp: new Date().toISOString()
      });
      drainLocalForageSyncQueue();
    }
  };

  const handleOffline = () => {
    notifyListeners({
      type: 'offline',
      message: 'Internet connection lost. Local storage via localForage IndexedDB is active.',
      timestamp: new Date().toISOString()
    });
  };

  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Periodic background check every 25 seconds
  if (!autoSyncIntervalId) {
    autoSyncIntervalId = setInterval(() => {
      if (navigator.onLine && !isSimulatingOfflineMode) {
        drainLocalForageSyncQueue();
      }
    }, 25000);
  }
}
