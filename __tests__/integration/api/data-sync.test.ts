import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock data sync manager
class DataSyncManager {
  private localData: Map<string, any> = new Map();
  private remoteData: Map<string, any> = new Map();
  private syncQueue: { id: string; operation: string; data: any; timestamp: number }[] = [];
  private conflictResolutionStrategy: 'local-wins' | 'remote-wins' | 'timestamp' = 'timestamp';
  private isSyncing: boolean = false;
  private lastSyncTime: number = 0;
  private listeners: Map<string, Function[]> = new Map();

  constructor(strategy: 'local-wins' | 'remote-wins' | 'timestamp' = 'timestamp') {
    this.conflictResolutionStrategy = strategy;
  }

  // Local operations
  async createLocal(collection: string, data: any) {
    const id = `${collection}-${Date.now()}-${Math.random()}`;
    const record = {
      id,
      ...data,
      _localVersion: 1,
      _lastModified: Date.now(),
      _syncStatus: 'pending',
    };
    
    this.localData.set(`${collection}:${id}`, record);
    this.queueSync('create', collection, record);
    
    return record;
  }

  async updateLocal(collection: string, id: string, updates: any) {
    const key = `${collection}:${id}`;
    const existing = this.localData.get(key);
    
    if (!existing) {
      throw new Error(`Record not found: ${key}`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      _localVersion: existing._localVersion + 1,
      _lastModified: Date.now(),
      _syncStatus: 'pending',
    };
    
    this.localData.set(key, updated);
    this.queueSync('update', collection, updated);
    
    return updated;
  }

  async deleteLocal(collection: string, id: string) {
    const key = `${collection}:${id}`;
    const existing = this.localData.get(key);
    
    if (!existing) {
      throw new Error(`Record not found: ${key}`);
    }
    
    // Mark as deleted instead of removing
    const deleted = {
      ...existing,
      _deleted: true,
      _lastModified: Date.now(),
      _syncStatus: 'pending',
    };
    
    this.localData.set(key, deleted);
    this.queueSync('delete', collection, deleted);
    
    return true;
  }

  getLocal(collection: string, id: string) {
    return this.localData.get(`${collection}:${id}`);
  }

  getAllLocal(collection: string) {
    const results = [];
    for (const [key, value] of this.localData.entries()) {
      if (key.startsWith(`${collection}:`) && !value._deleted) {
        results.push(value);
      }
    }
    return results;
  }

  // Sync operations
  private queueSync(operation: string, collection: string, data: any) {
    this.syncQueue.push({
      id: `sync-${Date.now()}-${Math.random()}`,
      operation: `${operation}:${collection}`,
      data,
      timestamp: Date.now(),
    });
    
    this.emit('queued', { operation, collection, data });
  }

  async sync() {
    if (this.isSyncing) {
      return { status: 'already-syncing' };
    }
    
    this.isSyncing = true;
    this.emit('sync:start', { timestamp: Date.now() });
    
    const results = {
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: [],
    };
    
    try {
      // Upload local changes
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue.shift()!;
        
        try {
          await this.uploadChange(item);
          results.uploaded++;
        } catch (error) {
          results.errors.push({ item, error });
          // Re-queue on error
          this.syncQueue.push(item);
          break;
        }
      }
      
      // Download remote changes
      const remoteChanges = await this.fetchRemoteChanges();
      for (const change of remoteChanges) {
        const conflict = await this.applyRemoteChange(change);
        if (conflict) {
          results.conflicts++;
        } else {
          results.downloaded++;
        }
      }
      
      this.lastSyncTime = Date.now();
      this.emit('sync:complete', results);
      
    } catch (error) {
      this.emit('sync:error', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
    
    return results;
  }

  private async uploadChange(item: any) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate occasional network errors
    if (Math.random() < 0.1) {
      throw new Error('Network error');
    }
    
    // Store in "remote"
    const [operation, collection] = item.operation.split(':');
    const key = `${collection}:${item.data.id}`;
    
    if (operation === 'delete') {
      this.remoteData.delete(key);
    } else {
      this.remoteData.set(key, {
        ...item.data,
        _remoteVersion: (item.data._remoteVersion || 0) + 1,
        _syncStatus: 'synced',
      });
    }
    
    // Update local sync status
    const localData = this.localData.get(key);
    if (localData) {
      this.localData.set(key, {
        ...localData,
        _syncStatus: 'synced',
        _remoteVersion: (item.data._remoteVersion || 0) + 1,
      });
    }
  }

  private async fetchRemoteChanges() {
    // Simulate fetching changes since last sync
    const changes = [];
    
    for (const [key, remoteData] of this.remoteData.entries()) {
      const localData = this.localData.get(key);
      
      if (!localData || remoteData._lastModified > this.lastSyncTime) {
        changes.push({
          key,
          data: remoteData,
          isNew: !localData,
        });
      }
    }
    
    return changes;
  }

  private async applyRemoteChange(change: any) {
    const localData = this.localData.get(change.key);
    
    if (change.isNew) {
      // New remote record
      this.localData.set(change.key, {
        ...change.data,
        _syncStatus: 'synced',
      });
      return false; // No conflict
    }
    
    if (!localData) {
      // Should not happen
      return false;
    }
    
    // Check for conflict
    if (localData._syncStatus === 'pending' && localData._lastModified !== change.data._lastModified) {
      // Conflict detected
      const resolved = this.resolveConflict(localData, change.data);
      this.localData.set(change.key, resolved);
      return true; // Had conflict
    }
    
    // No conflict, apply remote change
    this.localData.set(change.key, {
      ...change.data,
      _syncStatus: 'synced',
    });
    return false;
  }

  private resolveConflict(local: any, remote: any) {
    switch (this.conflictResolutionStrategy) {
      case 'local-wins':
        return { ...local, _conflictResolved: 'local-wins' };
      
      case 'remote-wins':
        return { ...remote, _syncStatus: 'synced', _conflictResolved: 'remote-wins' };
      
      case 'timestamp':
      default:
        if (local._lastModified > remote._lastModified) {
          return { ...local, _conflictResolved: 'local-newer' };
        } else {
          return { ...remote, _syncStatus: 'synced', _conflictResolved: 'remote-newer' };
        }
    }
  }

  // Event handling
  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  // Utility methods
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingChanges: this.syncQueue.length,
      localRecords: this.localData.size,
      strategy: this.conflictResolutionStrategy,
    };
  }

  clearAll() {
    this.localData.clear();
    this.remoteData.clear();
    this.syncQueue = [];
    this.lastSyncTime = 0;
  }

  // Simulate remote changes for testing
  simulateRemoteChange(collection: string, id: string, data: any) {
    const key = `${collection}:${id}`;
    this.remoteData.set(key, {
      id,
      ...data,
      _remoteVersion: 1,
      _lastModified: Date.now(),
    });
  }
}

describe('Data Synchronization Integration', () => {
  let syncManager: DataSyncManager;
  
  beforeEach(() => {
    syncManager = new DataSyncManager('timestamp');
  });
  
  afterEach(() => {
    syncManager.clearAll();
  });

  describe('Local Operations', () => {
    it('creates local records', async () => {
      const patient = await syncManager.createLocal('patients', {
        name: 'John Doe',
        roomNumber: '302',
      });
      
      expect(patient.id).toBeDefined();
      expect(patient.name).toBe('John Doe');
      expect(patient._syncStatus).toBe('pending');
      expect(patient._localVersion).toBe(1);
    });

    it('updates local records', async () => {
      const patient = await syncManager.createLocal('patients', {
        name: 'John Doe',
        roomNumber: '302',
      });
      
      const updated = await syncManager.updateLocal('patients', patient.id, {
        roomNumber: '305',
      });
      
      expect(updated.roomNumber).toBe('305');
      expect(updated._localVersion).toBe(2);
      expect(updated._syncStatus).toBe('pending');
    });

    it('deletes local records', async () => {
      const patient = await syncManager.createLocal('patients', {
        name: 'John Doe',
      });
      
      await syncManager.deleteLocal('patients', patient.id);
      
      const deleted = syncManager.getLocal('patients', patient.id);
      expect(deleted._deleted).toBe(true);
      expect(deleted._syncStatus).toBe('pending');
    });

    it('retrieves all records for collection', async () => {
      await syncManager.createLocal('patients', { name: 'Patient 1' });
      await syncManager.createLocal('patients', { name: 'Patient 2' });
      await syncManager.createLocal('alerts', { type: 'medical' });
      
      const patients = syncManager.getAllLocal('patients');
      expect(patients).toHaveLength(2);
      expect(patients.every(p => p.name.startsWith('Patient'))).toBe(true);
    });
  });

  describe('Basic Sync Operations', () => {
    it('syncs created records to remote', async () => {
      const patient = await syncManager.createLocal('patients', {
        name: 'John Doe',
        roomNumber: '302',
      });
      
      const result = await syncManager.sync();
      
      expect(result.uploaded).toBe(1);
      expect(result.downloaded).toBe(0);
      expect(result.conflicts).toBe(0);
      
      // Check sync status updated
      const synced = syncManager.getLocal('patients', patient.id);
      expect(synced._syncStatus).toBe('synced');
    });

    it('syncs multiple operations', async () => {
      // Create multiple records
      await syncManager.createLocal('patients', { name: 'Patient 1' });
      await syncManager.createLocal('patients', { name: 'Patient 2' });
      await syncManager.createLocal('alerts', { type: 'medical' });
      
      const result = await syncManager.sync();
      
      expect(result.uploaded).toBe(3);
      expect(syncManager.getStatus().pendingChanges).toBe(0);
    });

    it('handles sync errors gracefully', async () => {
      // Force network error
      jest.spyOn(Math, 'random').mockReturnValue(0.05);
      
      await syncManager.createLocal('patients', { name: 'Test' });
      
      const result = await syncManager.sync();
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(syncManager.getStatus().pendingChanges).toBeGreaterThan(0);
      
      jest.spyOn(Math, 'random').mockRestore();
    });

    it('prevents concurrent syncs', async () => {
      await syncManager.createLocal('patients', { name: 'Test' });
      
      const sync1 = syncManager.sync();
      const sync2 = syncManager.sync();
      
      const result2 = await sync2;
      expect(result2.status).toBe('already-syncing');
      
      await sync1;
    });
  });

  describe('Conflict Resolution', () => {
    it('detects and resolves conflicts with timestamp strategy', async () => {
      // Create and sync initial record
      const patient = await syncManager.createLocal('patients', {
        name: 'John Doe',
        roomNumber: '302',
      });
      
      await syncManager.sync();
      
      // Simulate remote change
      syncManager.simulateRemoteChange('patients', patient.id, {
        name: 'John Doe',
        roomNumber: '305',
        notes: 'Moved by nurse',
      });
      
      // Make local change
      await syncManager.updateLocal('patients', patient.id, {
        roomNumber: '304',
        notes: 'Moved by doctor',
      });
      
      // Sync should detect conflict
      const result = await syncManager.sync();
      expect(result.conflicts).toBe(1);
      
      // Check resolution
      const resolved = syncManager.getLocal('patients', patient.id);
      expect(resolved._conflictResolved).toBeDefined();
    });

    it('applies local-wins strategy', async () => {
      const localWinsManager = new DataSyncManager('local-wins');
      
      const patient = await localWinsManager.createLocal('patients', {
        name: 'John Doe',
        roomNumber: '302',
      });
      
      await localWinsManager.sync();
      
      // Simulate conflict
      localWinsManager.simulateRemoteChange('patients', patient.id, {
        roomNumber: '305',
      });
      
      await localWinsManager.updateLocal('patients', patient.id, {
        roomNumber: '304',
      });
      
      await localWinsManager.sync();
      
      const resolved = localWinsManager.getLocal('patients', patient.id);
      expect(resolved.roomNumber).toBe('304'); // Local wins
      expect(resolved._conflictResolved).toBe('local-wins');
    });

    it('applies remote-wins strategy', async () => {
      const remoteWinsManager = new DataSyncManager('remote-wins');
      
      const patient = await remoteWinsManager.createLocal('patients', {
        name: 'John Doe',
        roomNumber: '302',
      });
      
      await remoteWinsManager.sync();
      
      // Simulate conflict
      remoteWinsManager.simulateRemoteChange('patients', patient.id, {
        roomNumber: '305',
      });
      
      await remoteWinsManager.updateLocal('patients', patient.id, {
        roomNumber: '304',
      });
      
      await remoteWinsManager.sync();
      
      const resolved = remoteWinsManager.getLocal('patients', patient.id);
      expect(resolved.roomNumber).toBe('305'); // Remote wins
      expect(resolved._conflictResolved).toBe('remote-wins');
    });
  });

  describe('Bidirectional Sync', () => {
    it('downloads new remote records', async () => {
      // Simulate remote records
      syncManager.simulateRemoteChange('patients', 'remote-1', {
        name: 'Remote Patient',
        roomNumber: '401',
      });
      
      const result = await syncManager.sync();
      
      expect(result.downloaded).toBe(1);
      
      const downloaded = syncManager.getLocal('patients', 'remote-1');
      expect(downloaded).toBeDefined();
      expect(downloaded.name).toBe('Remote Patient');
    });

    it('handles mixed upload and download', async () => {
      // Create local records
      await syncManager.createLocal('patients', { name: 'Local 1' });
      await syncManager.createLocal('patients', { name: 'Local 2' });
      
      // Simulate remote records
      syncManager.simulateRemoteChange('patients', 'remote-1', { name: 'Remote 1' });
      syncManager.simulateRemoteChange('patients', 'remote-2', { name: 'Remote 2' });
      
      const result = await syncManager.sync();
      
      expect(result.uploaded).toBe(2);
      expect(result.downloaded).toBe(2);
      
      const allPatients = syncManager.getAllLocal('patients');
      expect(allPatients).toHaveLength(4);
    });
  });

  describe('Event Handling', () => {
    it('emits sync lifecycle events', async () => {
      const events: string[] = [];
      
      syncManager.on('sync:start', () => events.push('start'));
      syncManager.on('sync:complete', () => events.push('complete'));
      
      await syncManager.createLocal('patients', { name: 'Test' });
      await syncManager.sync();
      
      expect(events).toEqual(['start', 'complete']);
    });

    it('emits queue events', async () => {
      const queuedEvents: any[] = [];
      
      syncManager.on('queued', (data) => queuedEvents.push(data));
      
      await syncManager.createLocal('patients', { name: 'Test' });
      
      expect(queuedEvents).toHaveLength(1);
      expect(queuedEvents[0].operation).toBe('create');
      expect(queuedEvents[0].collection).toBe('patients');
    });

    it('emits error events', async () => {
      let errorEmitted = false;
      
      syncManager.on('sync:error', () => {
        errorEmitted = true;
      });
      
      // Force error
      jest.spyOn(Math, 'random').mockReturnValue(0.05);
      
      await syncManager.createLocal('patients', { name: 'Test' });
      
      try {
        await syncManager.sync();
      } catch (error) {
        // Expected
      }
      
      expect(errorEmitted).toBe(true);
      
      jest.spyOn(Math, 'random').mockRestore();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large batches efficiently', async () => {
      const startTime = Date.now();
      
      // Create many records
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(syncManager.createLocal('patients', { 
          name: `Patient ${i}`,
          data: { index: i },
        }));
      }
      
      await Promise.all(promises);
      
      const createTime = Date.now() - startTime;
      expect(createTime).toBeLessThan(1000); // Should be fast
      
      // Sync all
      const syncStart = Date.now();
      const result = await syncManager.sync();
      const syncTime = Date.now() - syncStart;
      
      expect(result.uploaded).toBe(50);
      expect(syncTime).toBeLessThan(5000); // Reasonable sync time
    });

    it('handles deleted records correctly', async () => {
      const patient = await syncManager.createLocal('patients', { name: 'Test' });
      await syncManager.sync();
      
      await syncManager.deleteLocal('patients', patient.id);
      const result = await syncManager.sync();
      
      expect(result.uploaded).toBe(1);
      
      // Should not appear in getAllLocal
      const patients = syncManager.getAllLocal('patients');
      expect(patients).toHaveLength(0);
    });

    it('maintains data integrity during errors', async () => {
      // Create records
      await syncManager.createLocal('patients', { name: 'Patient 1' });
      await syncManager.createLocal('patients', { name: 'Patient 2' });
      
      // Force error on first sync
      jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.05) // Force error
        .mockReturnValue(0.95); // Allow success
      
      try {
        await syncManager.sync();
      } catch (error) {
        // Expected
      }
      
      // Verify data integrity
      const patients = syncManager.getAllLocal('patients');
      expect(patients).toHaveLength(2);
      expect(patients.every(p => p._syncStatus === 'pending')).toBe(true);
      
      // Retry sync
      const result = await syncManager.sync();
      expect(result.uploaded).toBe(2);
      
      jest.spyOn(Math, 'random').mockRestore();
    });
  });
});