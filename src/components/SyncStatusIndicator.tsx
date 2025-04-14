
import React, { useEffect, useState } from 'react';
import { useApiSync } from '@/contexts/ApiSyncContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
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
    } else {
      setIsBackendReachable(false);
    }
  }, [isOnline]);
  
  // Connection status text and color
  const connectionStatus = isOnline 
    ? isBackendReachable 
      ? { label: 'Online', color: 'text-green-500' } 
      : { label: 'No Backend', color: 'text-orange-500' }
    : { label: 'Offline', color: 'text-yellow-500' };
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-md">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi size={16} className={connectionStatus.color} />
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
                  ? 'Connected to server' 
                  : 'Online but server is unreachable'
                : 'Working offline'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="h-4 border-l border-border mx-1" />
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={syncNow}
              disabled={!isOnline || !isBackendReachable || isSyncing}
            >
              <RefreshCw 
                size={14} 
                className={isSyncing ? "animate-spin text-blue-500" : isOnline && isBackendReachable ? "text-muted-foreground" : "text-muted-foreground/50"}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isSyncing 
                ? 'Syncing data with server...' 
                : !isOnline || !isBackendReachable
                  ? 'Cannot sync while offline or server unavailable'
                  : lastSynced 
                    ? `Last synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}` 
                    : 'Click to sync with server'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SyncStatusIndicator;
