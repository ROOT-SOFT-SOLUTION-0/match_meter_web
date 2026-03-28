import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SyncQueueItem } from '../types/models';

interface MatchMeterDB extends DBSchema {
  tournaments: {
    key: string;
    value: any;
    indexes: { 'by-status': string };
  };
  matches: {
    key: string;
    value: any;
    indexes: { 'by-tournament': string; 'by-status': string };
  };
  registrations: {
    key: string;
    value: any;
    indexes: { 'by-tournament': string };
  };
  payments: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: string | number;
    value: SyncQueueItem;
  };
}

class OfflineService {
  private db: IDBPDatabase<MatchMeterDB> | null = null;
  private dbName = 'matchmeter-db';
  private version = 1;

  async init(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await openDB<MatchMeterDB>(this.dbName, this.version, {
        upgrade(db) {
          // Tournaments
          if (!db.objectStoreNames.contains('tournaments')) {
            const tourStore = db.createObjectStore('tournaments', {
              keyPath: 'id',
            });
            tourStore.createIndex('by-status', 'status');
          }

          // Matches
          if (!db.objectStoreNames.contains('matches')) {
            const matchStore = db.createObjectStore('matches', {
              keyPath: 'id',
            });
            matchStore.createIndex('by-tournament', 'tournamentId');
            matchStore.createIndex('by-status', 'status');
          }

          // Team Registrations
          if (!db.objectStoreNames.contains('registrations')) {
            const regStore = db.createObjectStore('registrations', {
              keyPath: 'id',
            });
            regStore.createIndex('by-tournament', 'tournamentId');
          }

          // Payments
          if (!db.objectStoreNames.contains('payments')) {
            db.createObjectStore('payments', { keyPath: 'id' });
          }

          // Sync Queue
          if (!db.objectStoreNames.contains('syncQueue')) {
            db.createObjectStore('syncQueue', {
              keyPath: 'id',
              autoIncrement: true,
            });
          }
        },
      });

      console.log('✓ IndexedDB initialized');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      this.db = null;
    }
  }

  async cacheTournaments(tournaments: any[]): Promise<void> {
    if (!this.db) await this.init();
    try {
      const tx = this.db!.transaction('tournaments', 'readwrite');
      for (const tournament of tournaments) {
        await tx.store.put(tournament);
      }
      await tx.done;
    } catch (error) {
      console.error('Error caching tournaments:', error);
    }
  }

  async getCachedTournaments(): Promise<any[]> {
    if (!this.db) await this.init();
    try {
      return (await this.db!.getAll('tournaments')) || [];
    } catch (error) {
      console.error('Error getting cached tournaments:', error);
      return [];
    }
  }

  async cacheMatch(match: any): Promise<void> {
    if (!this.db) await this.init();
    try {
      await this.db!.put('matches', match);
    } catch (error) {
      console.error('Error caching match:', error);
    }
  }

  async getCachedMatches(): Promise<any[]> {
    if (!this.db) await this.init();
    try {
      return (await this.db!.getAll('matches')) || [];
    } catch (error) {
      console.error('Error getting cached matches:', error);
      return [];
    }
  }

  async cacheRegistration(registration: any): Promise<void> {
    if (!this.db) await this.init();
    try {
      await this.db!.put('registrations', registration);
    } catch (error) {
      console.error('Error caching registration:', error);
    }
  }

  async getCachedRegistrations(): Promise<any[]> {
    if (!this.db) await this.init();
    try {
      return (await this.db!.getAll('registrations')) || [];
    } catch (error) {
      console.error('Error getting cached registrations:', error);
      return [];
    }
  }

  async queueAction(
    action: SyncQueueItem['action'],
    data: any
  ): Promise<void> {
    if (!this.db) await this.init();
    try {
      await this.db!.add('syncQueue', {
        action,
        data,
        timestamp: Date.now(),
        status: 'pending',
      });
      console.log(`✓ Action queued: ${action}`);
    } catch (error) {
      console.error('Error queueing action:', error);
    }
  }

  async getPendingActions(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();
    try {
      const items = await this.db!.getAll('syncQueue');
      return items.filter((item) => item.status !== 'synced') || [];
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  }

  async clearPendingAction(id: string | number): Promise<void> {
    if (!this.db) await this.init();
    try {
      await this.db!.delete('syncQueue', id);
    } catch (error) {
      console.error('Error clearing pending action:', error);
    }
  }

  async markActionSynced(id: string | number): Promise<void> {
    if (!this.db) await this.init();
    try {
      const item = await this.db!.get('syncQueue', id);
      if (item) {
        item.status = 'synced';
        await this.db!.put('syncQueue', item);
      }
    } catch (error) {
      console.error('Error marking action as synced:', error);
    }
  }

  async clearAllCache(): Promise<void> {
    if (!this.db) await this.init();
    try {
      await this.db!.clear('tournaments');
      await this.db!.clear('matches');
      await this.db!.clear('registrations');
      console.log('✓ Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default new OfflineService();
