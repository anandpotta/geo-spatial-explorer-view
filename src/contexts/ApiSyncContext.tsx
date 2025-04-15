
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { syncLocalDataWithBackend, checkBackendAvailability } from '@/utils/api-client';

// Force offline mode
const OFFLINE_MODE = true;

interface ApiSyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  syncNow: () => Promise<void>;
}

const ApiSyncContext = createContext<ApiSyncContextType | undefined>(undefined);

export const ApiSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(!OFFLINE_MODE && navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(false);

  // Monitor online status (only when not in forced offline mode)
  useEffect(() => {
    if (OFFLINE_MODE) return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check backend availability (only when not in forced offline mode)
  useEffect(() => {
    if (OFFLINE_MODE) return;
    
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

  // Don't perform periodic sync in offline mode
  useEffect(() => {
    if (OFFLINE_MODE || !isOnline || !backendAvailable || isSyncing) return;

    const syncInterval = setInterval(() => {
      syncNow();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(syncInterval);
  }, [isOnline, backendAvailable, isSyncing]);

  const syncNow = async () => {
    if (OFFLINE_MODE || !isOnline || !backendAvailable || isSyncing) return;
    
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
    <ApiSyncContext.Provider value={{ 
      isOnline: !OFFLINE_MODE && isOnline, 
      isSyncing, 
      lastSynced, 
      syncNow 
    }}>
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
