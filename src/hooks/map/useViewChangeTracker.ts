
import { useRef, useEffect } from 'react';

export function useViewChangeTracker(
  currentView: 'cesium' | 'leaflet',
  regenerateMapKey: () => void
) {
  const previousViewRef = useRef<string | null>(null);
  
  // Reset map instance when view changes
  useEffect(() => {
    // Only regenerate key when view type actually changes
    if (previousViewRef.current !== currentView) {
      console.log(`View changed from ${previousViewRef.current} to ${currentView}, regenerating map key`);
      
      regenerateMapKey();
      previousViewRef.current = currentView;
      
      return () => {
        // Cleanup logic if needed
      };
    }
  }, [currentView, regenerateMapKey]);

  return {
    previousView: previousViewRef.current
  };
}
