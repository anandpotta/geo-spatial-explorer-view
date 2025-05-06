
import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { checkBackendAvailability, getConnectionStatus } from '@/utils/api-service';

// Create a separate context consumer component
const ApiSyncConsumer = ({ children }: { children: (context: any) => React.ReactNode }) => {
  try {
    // Dynamically import the context to avoid errors when it's not available
    const { useApiSync } = require('@/contexts/ApiSyncContext');
    const context = useApiSync();
    return <>{children(context)}</>;
  } catch (error) {
    // Return null if context is not available - the fallback will be used
    return <>{children(null)}</>;
  }
};

const SyncStatusIndicator: React.FC = () => {
  // Default values when not wrapped in ApiSyncProvider
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isBackendReachable, setIsBackendReachable] = useState<boolean | null>(null);
  
  // Check connection status directly
  useEffect(() => {
    const { isOnline: online, isBackendAvailable } = getConnectionStatus();
    setIsOnline(online);
    setIsBackendReachable(isBackendAvailable);
  }, []);
  
  // Check backend status on mount and when online status changes
  useEffect(() => {
    if (isOnline) {
      const checkBackend = async () => {
        try {
          const available = await checkBackendAvailability();
          setIsBackendReachable(available);
        } catch (error) {
          console.log('Failed to check backend availability:', error);
          setIsBackendReachable(false);
        }
      };
      
      checkBackend();
      
      // Check again periodically if the backend becomes available
      const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    } else {
      setIsBackendReachable(false);
    }
  }, [isOnline]);
  
  // Add event listeners for online/offline status
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
  
  // Local sync function used when context is not available
  const localSyncNow = () => {
    console.log('Sync not available in fallback mode');
  };
  
  return (
    <ApiSyncConsumer>
      {(apiContext) => {
        // Use context values if available, otherwise use local state
        const contextIsOnline = apiContext?.isOnline ?? isOnline;
        const contextIsSyncing = apiContext?.isSyncing ?? isSyncing;
        const contextLastSynced = apiContext?.lastSynced ?? lastSynced;
        const syncNow = apiContext?.syncNow ?? localSyncNow;
        
        // Connection status text and color
        const connectionStatus = contextIsOnline 
          ? isBackendReachable 
            ? { label: 'Server Connected', color: 'text-green-500' } 
            : { label: 'Offline Mode', color: 'text-orange-500' }
          : { label: 'Offline', color: 'text-yellow-500' };
        
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm rounded-md shadow-md" tabIndex={-1}>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5" tabIndex={0} role="status">
                    {contextIsOnline ? (
                      isBackendReachable ? (
                        <Server size={16} className={connectionStatus.color} aria-hidden="true" />
                      ) : (
                        <WifiOff size={16} className={connectionStatus.color} aria-hidden="true" />
                      )
                    ) : (
                      <WifiOff size={16} className={connectionStatus.color} aria-hidden="true" />
                    )}
                    <span className="text-xs font-medium">
                      {connectionStatus.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>
                    {contextIsOnline 
                      ? isBackendReachable 
                        ? 'Connected to server - data will sync automatically' 
                        : 'Working in offline mode - data is stored locally only'
                      : 'Working offline - data is stored locally'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {contextIsOnline && isBackendReachable && apiContext && (
              <>
                <div className="h-4 border-l border-border mx-1" aria-hidden="true" />
                
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={syncNow}
                        disabled={contextIsSyncing}
                        aria-label={contextIsSyncing ? "Syncing data" : "Sync now"}
                      >
                        <RefreshCw 
                          size={14} 
                          className={contextIsSyncing ? "animate-spin text-blue-500" : "text-muted-foreground"}
                          aria-hidden="true"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>
                        {contextIsSyncing 
                          ? 'Syncing data with server...' 
                          : contextLastSynced 
                            ? `Last synced ${formatDistanceToNow(contextLastSynced, { addSuffix: true })}` 
                            : 'Click to sync with server'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        );
      }}
    </ApiSyncConsumer>
  );
};

export default SyncStatusIndicator;
