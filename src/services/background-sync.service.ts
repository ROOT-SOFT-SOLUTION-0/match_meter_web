import { SyncQueueItem } from '../types/models';
import offlineService from './offline.service';
import firestoreService from './firestore.service';

class BackgroundSyncService {
  private syncInProgress = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private syncTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private onlineSyncListeners: ((synced: number, failed: number) => void)[] = [];

  /**
   * Initialize background sync
   */
  async initialize(): Promise<void> {
    try {
      // Register service worker sync listener
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        try {
          await (registration as any).sync.register('matchmeter-sync');
          console.log('✓ Background sync registered');
        } catch (error) {
          console.log('Background sync not available:', error);
        }
      }

      // Start periodic sync check
      this.startPeriodicSync();

      // Listen for online event
      window.addEventListener('online', () => {
        console.log('✓ Online detected, syncing data...');
        this.syncPendingActions();
      });
    } catch (error) {
      console.error('Failed to initialize background sync:', error);
    }
  }

  /**
   * Start periodic sync every 30 seconds
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingActions();
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions(): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress || !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      const pendingActions = await offlineService.getPendingActions();
      console.log(`Syncing ${pendingActions.length} pending actions...`);

      for (const action of pendingActions) {
        try {
          await this.executeSyncAction(action);
          if (action.id !== undefined) {
            await offlineService.markActionSynced(action.id);
          }
          synced++;
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          failed++;
        }
      }

      if (synced > 0) {
        console.log(`✓ Synced ${synced} actions successfully`);
      }
      if (failed > 0) {
        console.log(`⚠ Failed to sync ${failed} actions`);
      }

      // Notify listeners
      this.notifyListeners(synced, failed);
    } catch (error) {
      console.error('Error during sync process:', error);
      failed++;
    } finally {
      this.syncInProgress = false;
    }

    return { synced, failed };
  }

  /**
   * Execute a single sync action
   */
  private async executeSyncAction(action: SyncQueueItem): Promise<void> {
    const { action: actionType, data } = action;

    switch (actionType) {
      case 'register_team':
        if (data?.tournamentId) {
          await firestoreService.registerTeam(data.tournamentId, data);
        }
        break;
      case 'update_match':
        if (data?.id) {
          await firestoreService.updateMatch(data.id, data);
        }
        break;
      case 'submit_result':
        if (data?.matchId && typeof data.team1Score === 'number' && typeof data.team2Score === 'number') {
          await firestoreService.updateMatchResult(data.matchId, data.team1Score, data.team2Score);
        }
        break;
      case 'update_profile':
        // Profile sync is handled by auth/profile service flows.
        break;
      default:
        throw new Error(`Unknown sync action: ${actionType}`);
    }
  }

  /**
   * Add sync listener
   */
  onSync(callback: (synced: number, failed: number) => void): () => void {
    this.onlineSyncListeners.push(callback);
    return () => {
      this.onlineSyncListeners = this.onlineSyncListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(synced: number, failed: number): void {
    this.onlineSyncListeners.forEach((callback) => {
      try {
        callback(synced, failed);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Get current sync status
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  /**
   * Force sync immediately
   */
  async forceSyncNow(): Promise<{ synced: number; failed: number }> {
    return this.syncPendingActions();
  }

  /**
   * Clear all pending syncs (danger zone)
   */
  async clearAllPendingSyncs(): Promise<void> {
    try {
      const pendingActions = await offlineService.getPendingActions();
      for (const action of pendingActions) {
        if (action.id !== undefined) {
          await offlineService.markActionSynced(action.id);
        }
      }
      console.log('✓ All pending syncs cleared');
    } catch (error) {
      console.error('Failed to clear pending syncs:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopPeriodicSync();
    if (this.syncTimeoutId) {
      clearTimeout(this.syncTimeoutId);
    }
  }
}

export default new BackgroundSyncService();
