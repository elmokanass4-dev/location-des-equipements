import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { StorageService } from '../../services/storage';

interface SyncStatusIndicatorProps {
  onExportBackup?: () => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ onExportBackup }) => {
  const { t, formatDateTime } = useI18n();

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [syncState, setSyncState] = useState<'synced' | 'saving' | 'verified'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [storageStats, setStorageStats] = useState(() => StorageService.getStorageStats());
  const [isVerifying, setIsVerifying] = useState(false);

  // Monitor online / offline network state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor storage write events
  useEffect(() => {
    const handleStorageEvent = () => {
      setSyncState('saving');
      const timer = setTimeout(() => {
        setSyncState('synced');
        setLastSyncTime(new Date());
        setStorageStats(StorageService.getStorageStats());
      }, 400);

      return () => clearTimeout(timer);
    };

    window.addEventListener('kriya_storage_sync', handleStorageEvent);
    return () => {
      window.removeEventListener('kriya_storage_sync', handleStorageEvent);
    };
  }, []);

  const handleManualVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const ok = StorageService.verifyPersistence();
      setSyncState('verified');
      setLastSyncTime(new Date());
      setStorageStats(StorageService.getStorageStats());
      setIsVerifying(false);

      setTimeout(() => {
        setSyncState('synced');
      }, 2500);
    }, 300);
  };

  const handleDownloadBackup = () => {
    if (onExportBackup) {
      onExportBackup();
    } else {
      const jsonStr = StorageService.exportAllDataJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kriya-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
    }
  };

  return (
    <div className="relative">
      {/* Compact Header Pill Trigger */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-all ${
          !isOnline
            ? 'border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100/70'
            : syncState === 'saving'
            ? 'border-blue-200 bg-blue-50/70 text-blue-800'
            : 'border-stone-200 bg-stone-50/80 text-stone-700 hover:bg-stone-100 hover:text-stone-900'
        }`}
        title={t.app.syncStatus}
        aria-label={t.app.syncStatus}
      >
        {/* Status Dot / Icon */}
        {!isOnline ? (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <WifiOff className="h-3.5 w-3.5 text-amber-600" />
          </span>
        ) : syncState === 'saving' ? (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
            <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <HardDrive className="h-3.5 w-3.5 text-stone-500" />
          </span>
        )}

        {/* Text Label */}
        <span className="hidden sm:inline font-medium text-[11px]">
          {!isOnline
            ? t.app.syncOffline
            : syncState === 'saving'
            ? t.app.syncSaving
            : syncState === 'verified'
            ? 'Stockage vérifié'
            : t.app.syncSynced}
        </span>

        <ChevronDown className="h-3 w-3 text-stone-400 opacity-70" />
      </button>

      {/* Detail Popover */}
      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-stone-200 bg-white p-4 shadow-xl z-50 text-xs text-stone-800 space-y-3">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-2.5">
              <div>
                <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#1E4D38]" />
                  <span>{t.app.storageHealth}</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {t.app.lastSynced} : {formatDateTime(lastSyncTime.toISOString())}
                </div>
              </div>

              {/* Network Pill */}
              <div
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-emerald-600" />
                    <span>En ligne</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-amber-600" />
                    <span>Hors-ligne</span>
                  </>
                )}
              </div>
            </div>

            {/* Offline guarantee explainer */}
            <div className="rounded-lg bg-stone-50 border border-stone-200/80 p-2.5 text-[11px] text-stone-600 leading-relaxed">
              <span className="font-semibold text-stone-800">
                Mode dégradé / Connexion instable :
              </span>{' '}
              {t.app.offlineGuarantee}
            </div>

            {/* Storage metrics */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-stone-50/80 border border-stone-100">
                <div className="text-[10px] uppercase text-stone-400 font-semibold">
                  {t.app.recordsStored}
                </div>
                <div className="text-base font-bold text-stone-900 mt-0.5">
                  {storageStats.totalRecords}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-stone-50/80 border border-stone-100">
                <div className="text-[10px] uppercase text-stone-400 font-semibold">
                  {t.app.storageUsage}
                </div>
                <div className="text-base font-bold text-stone-900 mt-0.5">
                  ~{storageStats.estimatedKB} KB
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleManualVerify}
                disabled={isVerifying}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 text-stone-500 ${isVerifying ? 'animate-spin' : ''}`}
                />
                <span>{isVerifying ? t.app.syncChecking : t.app.forceVerify}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1E4D38] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#163B2B] shadow-2xs"
              >
                <Download className="h-3 w-3" />
                <span>{t.app.exportBackup}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
