import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {apiService} from '../services/api';

export interface SyncItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  tableName: string;
  recordId: string;
  data: any;
  timestamp: string;
  attempts: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingItems: SyncItem[];
  failedItems: SyncItem[];
  
  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  addSyncItem: (item: Omit<SyncItem, 'id' | 'timestamp' | 'attempts' | 'status'>) => void;
  syncToServer: () => Promise<void>;
  syncFromServer: () => Promise<void>;
  retryFailedItems: () => Promise<void>;
  clearSyncQueue: () => void;
  getSyncStatus: () => {
    pendingCount: number;
    failedCount: number;
    lastSync: string | null;
    isOnline: boolean;
  };
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      pendingItems: [],
      failedItems: [],

      setOnlineStatus: (isOnline: boolean) => {
        set({isOnline});
        
        // Auto-sync when coming back online
        if (isOnline && get().pendingItems.length > 0) {
          setTimeout(() => {
            get().syncToServer();
          }, 1000);
        }
      },

      addSyncItem: (item) => {
        const syncItem: SyncItem = {
          ...item,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          attempts: 0,
          status: 'PENDING',
        };

        set(state => ({
          pendingItems: [...state.pendingItems, syncItem],
        }));

        // Try to sync immediately if online
        if (get().isOnline) {
          setTimeout(() => {
            get().syncToServer();
          }, 500);
        }
      },

      syncToServer: async () => {
        const state = get();
        if (!state.isOnline || state.isSyncing || state.pendingItems.length === 0) {
          return;
        }

        set({isSyncing: true});

        try {
          const itemsToSync = state.pendingItems.filter(item => item.status === 'PENDING');
          
          if (itemsToSync.length === 0) {
            set({isSyncing: false});
            return;
          }

          // Mark items as processing
          set(state => ({
            pendingItems: state.pendingItems.map(item =>
              itemsToSync.find(i => i.id === item.id)
                ? {...item, status: 'PROCESSING' as const}
                : item
            ),
          }));

          const response = await apiService.pushSync({
            items: itemsToSync.map(item => ({
              action: item.action,
              tableName: item.tableName,
              recordId: item.recordId,
              data: item.data,
              timestamp: item.timestamp,
            })),
            lastSyncTimestamp: state.lastSyncTime || undefined,
          });

          // Process results
          const successfulIds: string[] = [];
          const failedItems: SyncItem[] = [];

          response.results.forEach((result: any, index: number) => {
            const item = itemsToSync[index];
            if (result.status === 'success') {
              successfulIds.push(item.id);
            } else {
              failedItems.push({
                ...item,
                status: 'FAILED',
                attempts: item.attempts + 1,
                error: result.error,
              });
            }
          });

          set(state => ({
            pendingItems: state.pendingItems.filter(item => !successfulIds.includes(item.id)),
            failedItems: [...state.failedItems, ...failedItems],
            lastSyncTime: new Date().toISOString(),
          }));

        } catch (error) {
          console.error('Sync to server failed:', error);
          
          // Mark items as failed
          set(state => ({
            pendingItems: state.pendingItems.map(item =>
              item.status === 'PROCESSING'
                ? {
                    ...item,
                    status: 'FAILED' as const,
                    attempts: item.attempts + 1,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  }
                : item
            ),
          }));
        } finally {
          set({isSyncing: false});
        }
      },

      syncFromServer: async () => {
        const state = get();
        if (!state.isOnline || state.isSyncing) {
          return;
        }

        set({isSyncing: true});

        try {
          const response = await apiService.pullSync(state.lastSyncTime || undefined);
          
          // Process server changes
          // This would update local stores with server data
          console.log('Received changes from server:', response.changes);

          set({
            lastSyncTime: response.timestamp,
          });

        } catch (error) {
          console.error('Sync from server failed:', error);
        } finally {
          set({isSyncing: false});
        }
      },

      retryFailedItems: async () => {
        const state = get();
        const retryableItems = state.failedItems.filter(item => item.attempts < 3);

        if (retryableItems.length === 0) {
          return;
        }

        // Move failed items back to pending
        set(state => ({
          pendingItems: [
            ...state.pendingItems,
            ...retryableItems.map(item => ({
              ...item,
              status: 'PENDING' as const,
            })),
          ],
          failedItems: state.failedItems.filter(item => item.attempts >= 3),
        }));

        // Try to sync
        await get().syncToServer();
      },

      clearSyncQueue: () => {
        set({
          pendingItems: [],
          failedItems: [],
        });
      },

      getSyncStatus: () => {
        const state = get();
        return {
          pendingCount: state.pendingItems.length,
          failedCount: state.failedItems.length,
          lastSync: state.lastSyncTime,
          isOnline: state.isOnline,
        };
      },
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Initialize network monitoring
NetInfo.addEventListener(state => {
  useSyncStore.getState().setOnlineStatus(state.isConnected ?? false);
});

// Auto-sync every 5 minutes when online
setInterval(() => {
  const syncStore = useSyncStore.getState();
  if (syncStore.isOnline && !syncStore.isSyncing) {
    syncStore.syncFromServer();
  }
}, 5 * 60 * 1000);