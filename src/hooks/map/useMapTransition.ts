
import { useEffect, useCallback, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapKey } from './useMapKey';
import { useTransitionState } from './useTransitionState';
import { useViewChangeTracker } from './useViewChangeTracker';

export function useMapTransition(
  currentView: 'cesium' | 'leaflet',
  selectedLocation?: Location,
  onMapReady?: () => void
) {
  const { mapKey, mapReady, setMapReady, regenerateMapKey } = useMapKey();
  const { 
    viewTransitionInProgress, 
    startTransition, 
    endTransition, 
    showViewReadyToast,
    cleanup: cleanupTransition
  } = useTransitionState(currentView, selectedLocation);
  
  const mapReadyCallbackRef = useRef<(() => void) | null>(null);
  
  // Save the callback for later
  useEffect(() => {
    mapReadyCallbackRef.current = onMapReady || null;
    
    return () => {
      mapReadyCallbackRef.current = null;
    };
  }, [onMapReady]);
  
  // Track view changes and regenerate map key when necessary
  const { isViewChangeInProgress } = useViewChangeTracker(currentView, () => {
    startTransition();
    regenerateMapKey();
    
    const timer = setTimeout(() => {
      endTransition();
      setMapReady(false);
    }, 800);
    
    return () => clearTimeout(timer);
  });

  // Safety timeout to end transitions if they get stuck
  useEffect(() => {
    if (viewTransitionInProgress) {
      const safetyTimer = setTimeout(() => {
        console.log('Safety timeout: ending view transition');
        endTransition();
      }, 5000);
      
      return () => clearTimeout(safetyTimer);
    }
  }, [viewTransitionInProgress, endTransition]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTransition();
    };
  }, [cleanupTransition]);

  const handleMapReadyInternal = useCallback(() => {
    console.log(`Map ready: currentView = ${currentView}`);
    setMapReady(true);
    
    // Small delay to ensure map is fully rendered
    setTimeout(() => {
      if (mapReadyCallbackRef.current) {
        console.log('Calling onMapReady callback');
        mapReadyCallbackRef.current();
      }
      
      // Display appropriate toast message based on the view
      showViewReadyToast();
    }, 100);
  }, [currentView, setMapReady, showViewReadyToast]);

  return {
    mapKey,
    viewTransitionInProgress,
    mapReady,
    setMapReady,
    handleMapReadyInternal
  };
}
