import { useEffect, useState } from 'react';
import { SyncQueueItem } from '../types/models';
import offlineService from '../services/offline.service';
import backgroundSyncService from '../services/background-sync.service';

interface UseOfflineReturn {
  isOnline: boolean;
  pendingActionCount: number;
  isSyncing: boolean;
  syncError: string | null;
  pendingActions: SyncQueueItem[];
  forceSyncNow: () => Promise<void>;
  clearPendingActions: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActionCount, setPendingActionCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<SyncQueueItem[]>([]);

  // Initialize offline service and listen for changes
  useEffect(() => {
    // Initialize services
    backgroundSyncService.initialize();

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setSyncError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync events
    const unsubscribeSync = backgroundSyncService.onSync((_, failed) => {
      setIsSyncing(false);
      if (failed > 0) {
        setSyncError(`Failed to sync ${failed} actions`);
      } else {
        setSyncError(null);
      }
      loadPendingActions();
    });

    // Load initial pending actions
    loadPendingActions();

    // Periodic update of pending actions
    const interval = setInterval(loadPendingActions, 5000); // Every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
      clearInterval(interval);
      backgroundSyncService.destroy();
    };
  }, []);

  const loadPendingActions = async () => {
    try {
      const actions = await offlineService.getPendingActions();
      setPendingActions(actions);
      setPendingActionCount(actions.length);
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  };

  const forceSyncNow = async () => {
    if (!isOnline) {
      setSyncError('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const result = await backgroundSyncService.forceSyncNow();
      console.log(`Synced ${result.synced}, Failed ${result.failed}`);
      await loadPendingActions();
      if (result.failed > 0) {
        setSyncError(`Failed to sync ${result.failed} actions`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncError(errorMessage);
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearPendingActions = async () => {
    try {
      await backgroundSyncService.clearAllPendingSyncs();
      await loadPendingActions();
      setSyncError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Clear failed';
      setSyncError(errorMessage);
      console.error('Clear error:', error);
    }
  };

  return {
    isOnline,
    pendingActionCount,
    isSyncing,
    syncError,
    pendingActions,
    forceSyncNow,
    clearPendingActions,
  };
}
