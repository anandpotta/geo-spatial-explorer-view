
import React, { useEffect, useState } from 'react';
import { useApiSync } from '@/contexts/ApiSyncContext';
import { Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { checkBackendAvailability } from '@/utils/api-client';

const SyncStatusIndicator: React.FC = () => {
  const { isOnline, isSyncing, lastSynced, syncNow } = useApiSync();
  const [isBackendReachable, setIsBackendReachable] = useState<boolean | null>(null);
  
  // Check backend status on mount and when online status changes
  useEffect(() => {
    if (isOnline) {
      const checkBackend = async () => {
        const available = await checkBackendAvailability();
        setIsBackendReachable(available);
      };
      checkBackend();
      
      // Check again periodically if the backend becomes available
      const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    } else {
      setIsBackendReachable(false);
    }
  }, [isOnline]);
  
  // Connection status text and color
  const connectionStatus = isOnline 
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
              {isOnline ? (
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
              {isOnline 
                ? isBackendReachable 
                  ? 'Connected to server - data will sync automatically' 
                  : 'Online but server is unreachable - working with local data only'
                : 'Working offline - data is stored locally'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isOnline && isBackendReachable && (
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
                  disabled={isSyncing}
                >
                  <RefreshCw 
                    size={14} 
                    className={isSyncing ? "animate-spin text-blue-500" : "text-muted-foreground"}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isSyncing 
                    ? 'Syncing data with server...' 
                    : lastSynced 
                      ? `Last synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}` 
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
