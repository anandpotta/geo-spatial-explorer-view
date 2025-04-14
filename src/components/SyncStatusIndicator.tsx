
import React from 'react';
import { useApiSync } from '@/contexts/ApiSyncContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SyncStatusIndicator: React.FC = () => {
  const { isOnline, isSyncing, lastSynced, syncNow } = useApiSync();
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-md">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi size={16} className="text-green-500" />
              ) : (
                <WifiOff size={16} className="text-yellow-500" />
              )}
              <span className="text-xs font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? 'Connected to server' : 'Working offline'}</p>
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
              disabled={!isOnline || isSyncing}
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
    </div>
  );
};

export default SyncStatusIndicator;
