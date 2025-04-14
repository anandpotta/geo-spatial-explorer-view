
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { syncLocalDataWithBackend } from '@/utils/api-client';

interface ApiSyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  syncNow: () => Promise<void>;
}

const ApiSyncContext = createContext<ApiSyncContextType | undefined>(undefined);

export const ApiSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

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

  // Auto sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncNow();
    }
  }, [isOnline]);

  // Periodic sync every 5 minutes when online
  useEffect(() => {
    if (!isOnline) return;

    const syncInterval = setInterval(() => {
      syncNow();
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [isOnline]);

  const syncNow = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncLocalDataWithBackend();
      setLastSynced(new Date());
    } catch (error) {
      console.error('Failed to sync data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ApiSyncContext.Provider value={{ isOnline, isSyncing, lastSynced, syncNow }}>
      {children}
    </ApiSyncContext.Provider>
  );
};

export const useApiSync = () => {
  const context = useContext(ApiSyncContext);
  if (context === undefined) {
    throw new Error('useApiSync must be used within an ApiSyncProvider');
  }
  return context;
};
