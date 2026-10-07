import { EXPLORATION_TARGETS, MINERALS_DATABASE, SAMPLE_DRILLHOLES } from '../data/miningData';
import { Mineral, DrillHole, ExplorationTarget } from '../types';

const DB_NAME = 'MineAI_Offline_Store';
const DB_VERSION = 2;

export interface VoiceNoteRecord {
  id: string;
  timestamp: string;
  transcript: string;
  audioBlobUrl?: string;
  tag?: string;
  location?: string;
}

export interface OfflineSyncStatus {
  isSupported: boolean;
  totalRecords: number;
  lastSyncedAt: string | null;
  stores: {
    targets: number;
    drillholes: number;
    minerals: number;
    fieldReports: number;
    voiceNotes: number;
  };
}

let dbInstance: IDBDatabase | null = null;

export const openMiningDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      try {
        // Verify database connection is still active
        if (dbInstance.objectStoreNames) {
          resolve(dbInstance);
          return;
        }
      } catch {
        dbInstance = null;
      }
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device/environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('exploration_targets')) {
        db.createObjectStore('exploration_targets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('drillholes')) {
        db.createObjectStore('drillholes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('minerals')) {
        db.createObjectStore('minerals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('field_reports')) {
        db.createObjectStore('field_reports', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('voice_field_notes')) {
        db.createObjectStore('voice_field_notes', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * Pre-cache all critical mining data (drillholes, exploration targets, minerals, and reports)
 * into IndexedDB so field personnel can access them in remote locations without internet.
 */
export const precacheCriticalMiningData = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const db = await openMiningDatabase();
    let totalCount = 0;

    // 1. Cache Exploration Targets
    if (db.objectStoreNames.contains('exploration_targets')) {
      const targetsTx = db.transaction('exploration_targets', 'readwrite');
      const targetsStore = targetsTx.objectStore('exploration_targets');
      EXPLORATION_TARGETS.forEach((target: ExplorationTarget, index: number) => {
        const id = target.id || `target-${index + 1}`;
        targetsStore.put({ ...target, id });
        totalCount++;
      });
    }

    // 2. Cache Minerals
    if (db.objectStoreNames.contains('minerals')) {
      const mineralsTx = db.transaction('minerals', 'readwrite');
      const mineralsStore = mineralsTx.objectStore('minerals');
      MINERALS_DATABASE.forEach((mineral: Mineral, index: number) => {
        const id = mineral.id || (mineral as any).mineralId || mineral.name || `mineral-${index + 1}`;
        mineralsStore.put({ ...mineral, id });
        totalCount++;
      });
    }

    // 3. Cache Drillholes - Guarantee keyPath 'id' is always populated
    if (db.objectStoreNames.contains('drillholes')) {
      const drillTx = db.transaction('drillholes', 'readwrite');
      const drillStore = drillTx.objectStore('drillholes');
      SAMPLE_DRILLHOLES.forEach((dh: DrillHole, index: number) => {
        const id = dh.id || dh.holeId || `dh-${index + 1}`;
        const record = {
          ...dh,
          id,
          holeId: dh.holeId || id,
        };
        drillStore.put(record);
        totalCount++;
      });
    }

    // 4. Cache Base Executive Field Report
    if (db.objectStoreNames.contains('field_reports')) {
      const reportTx = db.transaction('field_reports', 'readwrite');
      const reportStore = reportTx.objectStore('field_reports');
      reportStore.put({
        id: 'report-global-summary',
        title: 'Global Exploration & ESG Compliance Baseline Dossier',
        timestamp: new Date().toISOString(),
        standards: 'JORC 2012 / NI 43-101 / CIM Standards',
        activeJurisdictions: ['Canada', 'USA', 'Europe', 'Australia', 'Africa'],
        criticalAnomaliesCount: EXPLORATION_TARGETS.length,
      });
      totalCount++;
    }

    localStorage.setItem('mineai_last_offline_sync', new Date().toISOString());

    return { success: true, count: totalCount };
  } catch (err: any) {
    console.error('Failed to pre-cache mining data to IndexedDB:', err);
    return { success: false, count: 0, error: err?.message || 'IndexedDB caching failed' };
  }
};

/**
 * Retrieve all items from a designated store
 */
export const getOfflineStoreItems = async <T = any>(storeName: string): Promise<T[]> => {
  try {
    const db = await openMiningDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      return [];
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB read failed for store ${storeName}:`, err);
    return [];
  }
};

/**
 * Save a voice field note into IndexedDB
 */
export const saveVoiceFieldNote = async (note: Omit<VoiceNoteRecord, 'id' | 'timestamp'>): Promise<VoiceNoteRecord> => {
  const db = await openMiningDatabase();
  const record: VoiceNoteRecord = {
    id: `vnote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    transcript: note.transcript,
    audioBlobUrl: note.audioBlobUrl,
    tag: note.tag || 'Field Geological Note',
    location: note.location || 'Remote Exploration Site',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('voice_field_notes', 'readwrite');
    const store = tx.objectStore('voice_field_notes');
    const req = store.add(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
};

/**
 * Retrieve all saved voice field notes
 */
export const getVoiceFieldNotes = async (): Promise<VoiceNoteRecord[]> => {
  return getOfflineStoreItems<VoiceNoteRecord>('voice_field_notes');
};

/**
 * Check overall IndexedDB offline storage status
 */
export const getOfflineSyncStatus = async (): Promise<OfflineSyncStatus> => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return {
      isSupported: false,
      totalRecords: 0,
      lastSyncedAt: null,
      stores: { targets: 0, drillholes: 0, minerals: 0, fieldReports: 0, voiceNotes: 0 },
    };
  }

  try {
    const [targets, drillholes, minerals, reports, notes] = await Promise.all([
      getOfflineStoreItems('exploration_targets'),
      getOfflineStoreItems('drillholes'),
      getOfflineStoreItems('minerals'),
      getOfflineStoreItems('field_reports'),
      getOfflineStoreItems('voice_field_notes'),
    ]);

    const total = targets.length + drillholes.length + minerals.length + reports.length + notes.length;
    const lastSyncedAt = localStorage.getItem('mineai_last_offline_sync');

    return {
      isSupported: true,
      totalRecords: total,
      lastSyncedAt,
      stores: {
        targets: targets.length,
        drillholes: drillholes.length,
        minerals: minerals.length,
        fieldReports: reports.length,
        voiceNotes: notes.length,
      },
    };
  } catch (err) {
    return {
      isSupported: true,
      totalRecords: 0,
      lastSyncedAt: null,
      stores: { targets: 0, drillholes: 0, minerals: 0, fieldReports: 0, voiceNotes: 0 },
    };
  }
};
