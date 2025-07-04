
import React, { useEffect, useState } from 'react';
import { useApiSync } from '@/contexts/ApiSyncContext';
import { Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { checkBackendAvailability, getConnectionStatus } from '@/utils/api-service';

const SyncStatusIndicator: React.FC = () => {
  // Default values when not wrapped in ApiSyncProvider
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isBackendReachable, setIsBackendReachable] = useState<boolean | null>(null);
  const [isApiSyncAvailable, setIsApiSyncAvailable] = useState<boolean>(true);
  
  // Try to use ApiSyncContext if available, otherwise use the default values
  let apiSyncContext;
  try {
    apiSyncContext = useApiSync();
  } catch (error) {
    // If useApiSync throws an error, we'll use our local state instead
    if (isApiSyncAvailable) {
      console.warn('SyncStatusIndicator: ApiSyncProvider not found, using fallback mode');
      setIsApiSyncAvailable(false);
    }
  }
  
  const contextIsOnline = apiSyncContext?.isOnline ?? isOnline;
  const contextIsSyncing = apiSyncContext?.isSyncing ?? isSyncing;
  const contextLastSynced = apiSyncContext?.lastSynced ?? lastSynced;
  const syncNow = apiSyncContext?.syncNow ?? (() => console.log('Sync not available in fallback mode'));
  
  // Check connection status directly
  useEffect(() => {
    const { isOnline: online, isBackendAvailable } = getConnectionStatus();
    setIsOnline(online);
    setIsBackendReachable(isBackendAvailable);
  }, []);
  
  // Check backend status on mount and when online status changes
  useEffect(() => {
    if (contextIsOnline) {
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
  }, [contextIsOnline]);
  
  // Add event listeners for online/offline status when not using ApiSyncContext
  useEffect(() => {
    if (!apiSyncContext) {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
  
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
  
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [apiSyncContext]);
  
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
      
      {contextIsOnline && isBackendReachable && (
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
};

export default SyncStatusIndicator;
