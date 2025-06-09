
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getConnectionStatus } from '@/utils/api-service';

interface ApiSyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  syncNow: () => Promise<void>;
}

const ApiSyncContext = createContext<ApiSyncContextType | undefined>(undefined);

export const useApiSync = () => {
  const context = useContext(ApiSyncContext);
  if (context === undefined) {
    throw new Error('useApiSync must be used within an ApiSyncProvider');
  }
  return context;
};

interface ApiSyncProviderProps {
  children: React.ReactNode;
}

export const ApiSyncProvider: React.FC<ApiSyncProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Monitor online/offline status
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

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSynced(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  const value: ApiSyncContextType = {
    isOnline,
    isSyncing,
    lastSynced,
    syncNow
  };

  return <ApiSyncContext.Provider value={value}>{children}</ApiSyncContext.Provider>;
};
