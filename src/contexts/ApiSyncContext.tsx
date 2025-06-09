
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { syncLocalDataWithBackend, checkBackendAvailability } from '@/utils/api-client';

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
  const [backendAvailable, setBackendAvailable] = useState<boolean>(false);

  // Monitor online status
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

  // Check backend availability
  useEffect(() => {
    if (isOnline) {
      const checkBackend = async () => {
        const available = await checkBackendAvailability();
        setBackendAvailable(available);
        if (available) {
          syncNow();
        }
      };
      
      checkBackend();
    } else {
      setBackendAvailable(false);
    }
  }, [isOnline]);

  // Periodic sync when online and backend is available
  useEffect(() => {
    if (!isOnline || !backendAvailable) return;

    const syncInterval = setInterval(() => {
      if (!isSyncing) {
        syncNow();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(syncInterval);
  }, [isOnline, backendAvailable, isSyncing]);

  const syncNow = async () => {
    if (!isOnline || !backendAvailable || isSyncing) return;
    
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
