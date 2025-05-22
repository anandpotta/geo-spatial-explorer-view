
import { useRef, useEffect, useCallback } from 'react';

export function useViewChangeTracker(
  currentView: 'cesium' | 'leaflet',
  regenerateMapKey: () => void
) {
  const previousViewRef = useRef<string | null>(null);
  const viewChangeInProgressRef = useRef<boolean>(false);
  
  // Reset map instance when view changes
  useEffect(() => {
    // Only regenerate key when view type actually changes and not already in progress
    if (previousViewRef.current !== currentView && !viewChangeInProgressRef.current) {
      console.log(`View changed from ${previousViewRef.current} to ${currentView}, regenerating map key`);
      
      // Set flag to prevent multiple regenerations
      viewChangeInProgressRef.current = true;
      
      // Add a small delay before regenerating the key to ensure DOM is ready
      setTimeout(() => {
        regenerateMapKey();
        previousViewRef.current = currentView;
        
        // Reset the flag after a delay to allow for completion
        setTimeout(() => {
          viewChangeInProgressRef.current = false;
        }, 500);
      }, 50);
      
      return () => {
        // Reset flag on cleanup
        viewChangeInProgressRef.current = false;
      };
    }
  }, [currentView, regenerateMapKey]);

  return {
    previousView: previousViewRef.current,
    isViewChangeInProgress: viewChangeInProgressRef.current
  };
}
