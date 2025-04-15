
import React, { useEffect, useState } from 'react';
import { useApiSync } from '@/contexts/ApiSyncContext';
import { WifiOff, RefreshCw, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { checkBackendAvailability } from '@/utils/api-client';

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
      console.log('SyncStatusIndicator: ApiSyncProvider not found, using fallback mode');
      setIsApiSyncAvailable(false);
    }
  }
  
  const contextIsOnline = apiSyncContext?.isOnline ?? isOnline;
  const contextIsSyncing = apiSyncContext?.isSyncing ?? isSyncing;
  const contextLastSynced = apiSyncContext?.lastSynced ?? lastSynced;
  const syncNow = apiSyncContext?.syncNow ?? (() => console.log('Sync not available in fallback mode'));
  
  // Always set offline mode for this application
  const forceOfflineMode = true;
  
  // Connection status text and color
  const connectionStatus = forceOfflineMode 
    ? { label: 'Offline Mode', color: 'text-blue-500' }
    : contextIsOnline 
      ? isBackendReachable 
        ? { label: 'Server Connected', color: 'text-green-500' } 
        : { label: 'Local Only', color: 'text-orange-500' }
      : { label: 'Offline', color: 'text-yellow-500' };
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm rounded-md shadow-md">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              {forceOfflineMode ? (
                <WifiOff size={16} className={connectionStatus.color} />
              ) : contextIsOnline ? (
                isBackendReachable ? (
                  <Server size={16} className={connectionStatus.color} />
                ) : (
                  <WifiOff size={16} className={connectionStatus.color} />
                )
              ) : (
                <WifiOff size={16} className={connectionStatus.color} />
              )}
              <span className="text-xs font-medium">
                {connectionStatus.label}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {forceOfflineMode
                ? 'Application is running in offline mode - all data is stored locally'
                : contextIsOnline 
                  ? isBackendReachable 
                    ? 'Connected to server - data will sync automatically' 
                    : 'Online but server is unreachable - working with local data only'
                  : 'Working offline - data is stored locally'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {!forceOfflineMode && contextIsOnline && isBackendReachable && (
        <>
          <div className="h-4 border-l border-border mx-1" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={syncNow}
                  disabled={contextIsSyncing}
                >
                  <RefreshCw 
                    size={14} 
                    className={contextIsSyncing ? "animate-spin text-blue-500" : "text-muted-foreground"}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
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
