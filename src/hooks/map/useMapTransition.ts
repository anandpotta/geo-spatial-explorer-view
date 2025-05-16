
import { useEffect } from 'react';
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
  const { viewTransitionInProgress, startTransition, endTransition, showViewReadyToast } = 
    useTransitionState(currentView, selectedLocation);
  
  // Track view changes and regenerate map key when necessary
  useViewChangeTracker(currentView, () => {
    regenerateMapKey();
    startTransition();
    
    const timer = setTimeout(() => {
      endTransition();
      setMapReady(false);
    }, 800); // Slightly shorter for smoother transition
    
    return () => clearTimeout(timer);
  });

  const handleMapReadyInternal = () => {
    setMapReady(true);
    
    if (onMapReady) {
      onMapReady();
    }
    
    // Display appropriate toast message based on the view
    showViewReadyToast();
  };

  return {
    mapKey,
    viewTransitionInProgress,
    mapReady,
    setMapReady,
    handleMapReadyInternal
  };
}
