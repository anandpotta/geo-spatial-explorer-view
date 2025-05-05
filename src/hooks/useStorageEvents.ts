
import { useEffect } from 'react';

interface UseStorageEventsProps {
  isMountedRef: React.MutableRefObject<boolean>;
  debouncedUpdateLayers: () => void;
}

export function useStorageEvents({
  isMountedRef,
  debouncedUpdateLayers
}: UseStorageEventsProps) {
  // Handle storage events for cross-tab updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      if (isMountedRef.current) {
        debouncedUpdateLayers();
      }
    };
    
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('floorPlanUpdated', handleStorageUpdate);
    
    // Also listen for visibility changes to update when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        debouncedUpdateLayers();
      }
    });
    
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('floorPlanUpdated', handleStorageUpdate);
      document.removeEventListener('visibilitychange', handleStorageUpdate);
    };
  }, [debouncedUpdateLayers, isMountedRef]);
}
