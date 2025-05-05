
import { useEffect, useRef } from 'react';
import { LocationMarker } from '@/utils/markers/types';
import { getSavedMarkers } from '@/utils/markers/storage';
import { deduplicateMarkers, markersHaveChanged } from './marker-utils';

export function useMarkerUpdates(
  setMarkers: (markers: LocationMarker[]) => void
) {
  // Use a stable reference to track markers state and prevent duplicates
  const markerStateRef = useRef<{
    markers: LocationMarker[],
    lastEventTime: number
  }>({
    markers: [],
    lastEventTime: 0
  });
  
  useEffect(() => {
    const savedMarkers = getSavedMarkers();
    // Use a stable reference to avoid duplicate markers
    const uniqueSavedMarkers = deduplicateMarkers(savedMarkers);
    setMarkers(uniqueSavedMarkers);
    markerStateRef.current.markers = uniqueSavedMarkers;
    
    // Listen for marker updates
    const handleMarkersUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const timestamp = customEvent.detail?.timestamp || Date.now();
      
      // Prevent duplicate processing of the same event
      if (timestamp <= markerStateRef.current.lastEventTime) {
        console.log("Skipping duplicate markers updated event");
        return;
      }
      
      markerStateRef.current.lastEventTime = timestamp;
      
      // Get updated markers from storage
      let updatedMarkers = getSavedMarkers();
      
      // Deduplicate markers
      updatedMarkers = deduplicateMarkers(updatedMarkers);
      
      // Only update state if the marker set has actually changed
      const hasChanges = markersHaveChanged(markerStateRef.current.markers, updatedMarkers);
      
      if (hasChanges) {
        console.log(`Updating markers state with ${updatedMarkers.length} unique markers`);
        setMarkers(updatedMarkers);
        markerStateRef.current.markers = updatedMarkers;
      }
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
    };
  }, [setMarkers]); // Dependency on setMarkers function
}
