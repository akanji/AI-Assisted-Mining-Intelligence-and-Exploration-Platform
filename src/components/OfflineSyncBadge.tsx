import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Check,
  ChevronDown,
} from 'lucide-react';
import { precacheCriticalMiningData, getOfflineSyncStatus, OfflineSyncStatus } from '../utils/offlineStorage';

export const OfflineSyncBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState<OfflineSyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    refreshStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshStatus = async () => {
    const status = await getOfflineSyncStatus();
    setSyncStatus(status);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await precacheCriticalMiningData();
      if (res.success) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 2500);
      }
      await refreshStatus();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative">
      {/* Offline Status Badge */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border ${
          isOnline
            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
            : 'bg-amber-950/80 text-amber-300 border-amber-500 animate-pulse'
        }`}
        title="Offline Storage & Remote Field Sync Status"
      >
        {isOnline ? (
          <Wifi size={12} className="text-emerald-400" />
        ) : (
          <WifiOff size={12} className="text-amber-400" />
        )}
        <span className="hidden sm:inline">
          {isOnline ? 'Online (IndexedDB Ready)' : 'Remote Offline Mode'}
        </span>
        <Database size={11} className="text-amber-400 opacity-80" />
      </button>

      {/* Sync Status Modal / Dropdown */}
      {showDetails && (
        <div className="absolute top-10 right-0 z-50 w-80 p-4 rounded-2xl bg-[#2A1810] border-2 border-amber-500 shadow-2xl text-white text-xs space-y-3 animate-slideDown">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <HardDrive size={15} />
              <span>Offline Field Storage</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {isOnline ? 'Connected' : 'Offline Mode'}
            </span>
          </div>

          <p className="text-[11px] text-stone-300 leading-relaxed">
            Critical mining data is cached locally via Service Worker & IndexedDB so you can explore remote drill sites without internet coverage.
          </p>

          {/* Sync Stats */}
          {syncStatus && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-black/40 border border-stone-800">
                <span className="text-stone-400 block text-[10px]">GIS Targets</span>
                <span className="font-bold text-amber-400">{syncStatus.stores.targets} cached</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-stone-800">
                <span className="text-stone-400 block text-[10px]">Drillholes & Assays</span>
                <span className="font-bold text-amber-400">{syncStatus.stores.drillholes} cached</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-stone-800">
                <span className="text-stone-400 block text-[10px]">Mineral Database</span>
                <span className="font-bold text-amber-400">{syncStatus.stores.minerals} cached</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-stone-800">
                <span className="text-stone-400 block text-[10px]">Voice Field Notes</span>
                <span className="font-bold text-purple-300">{syncStatus.stores.voiceNotes} saved</span>
              </div>
            </div>
          )}

          {/* Sync Trigger Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Pre-Caching Records...</span>
              </>
            ) : justSynced ? (
              <>
                <Check size={13} />
                <span>Synced Successfully</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                <span>Precache for Remote Field Trip</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
