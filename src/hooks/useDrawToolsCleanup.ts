
import { useEffect, MutableRefObject } from 'react';
import L from 'leaflet';
import { cleanupEditHandlers, makeEditHandlersSafe } from '@/utils/leaflet/draw-tools-utils';

export const useDrawToolsCleanup = (
  editControlRef: React.RefObject<any>,
  isComponentMounted: MutableRefObject<boolean>,
  cleanupFunctionsRef: MutableRefObject<Array<() => void>>,
  featureGroup: L.FeatureGroup
) => {
  // Make sure the edit control is properly disposed when component unmounts
  useEffect(() => {
    // Run safety patches early
    const applySafetyPatches = () => {
      if (!editControlRef.current) return;
      setTimeout(() => {
        makeEditHandlersSafe(editControlRef);
      }, 200);
    };
    
    // Apply patches when editControl is available
    if (editControlRef.current) {
      applySafetyPatches();
    }
    
    return () => {
      if (!isComponentMounted.current) return;

      try {
        if (editControlRef.current) {
          // Prepare a cleanup function
          cleanupEditHandlers(editControlRef, featureGroup);
          
          // Schedule cleanup with timeout to ensure it runs after react-leaflet's cleanup
          const timerId = setTimeout(() => {
            try {
              // This timeout handles any final cleanup needed
              console.log('Final cleanup for edit control executed');
            } catch (err) {
              console.error('Error in delayed cleanup:', err);
            }
          }, 0);
          
          // Track the timeout so it can be cleared if needed
          if (window._leafletCleanupTimers) {
            // Convert the NodeJS.Timeout to a number
            window._leafletCleanupTimers.push(Number(timerId));
          }
        }
      } catch (err) {
        console.error('Error setting up edit control cleanup:', err);
      }
    };
  }, [featureGroup, editControlRef, isComponentMounted, cleanupFunctionsRef]);
};

// Add a global type for cleanup timers
declare global {
  interface Window {
    _leafletCleanupTimers?: number[];
  }
}
