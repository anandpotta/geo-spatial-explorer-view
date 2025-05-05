
import { LocationMarker } from '@/utils/markers/types';
import MarkersList from '../MarkersList';
import { memo, useEffect, useState, useRef } from 'react';

interface MarkersContainerProps {
  markers: LocationMarker[];
  tempMarker: [number, number] | null;
  markerName: string;
  markerType: 'pin' | 'area' | 'building';
  onDeleteMarker: (id: string) => void;
  onSaveMarker: () => void;
  setMarkerName: (name: string) => void;
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
}

const MarkersContainer = memo(({
  markers,
  tempMarker,
  markerName,
  markerType,
  onDeleteMarker,
  onSaveMarker,
  setMarkerName,
  setMarkerType
}: MarkersContainerProps) => {
  // Use a state to store deduplicated markers
  const [uniqueMarkers, setUniqueMarkers] = useState<LocationMarker[]>([]);
  const processedMarkersRef = useRef<Set<string>>(new Set());
  const instanceIdRef = useRef(`marker-container-${Date.now()}`);
  
  // Update unique markers whenever the markers prop changes
  useEffect(() => {
    // For debugging only
    console.log(`MarkersContainer ${instanceIdRef.current} received ${markers.length} markers`);
    
    // Create a map to ensure uniqueness by ID, using the last (most recent) occurrence of each ID
    const markerMap = new Map<string, LocationMarker>();
    
    // First pass - process all markers to get the latest version
    markers.forEach(marker => {
      if (marker && marker.id) {
        markerMap.set(marker.id, marker);
      }
    });
    
    // Convert map back to array
    const deduplicatedMarkers = Array.from(markerMap.values());
    
    console.log(`Deduplicated ${markers.length} markers down to ${deduplicatedMarkers.length}`);
    setUniqueMarkers(deduplicatedMarkers);
    
    // Update processed markers reference
    processedMarkersRef.current = new Set(deduplicatedMarkers.map(m => m.id));
    
  }, [markers]);
  
  return (
    <MarkersList
      key={`marker-list-${instanceIdRef.current}`}
      markers={uniqueMarkers}
      tempMarker={tempMarker}
      markerName={markerName}
      markerType={markerType}
      onDeleteMarker={onDeleteMarker}
      onSaveMarker={onSaveMarker}
      setMarkerName={setMarkerName}
      setMarkerType={setMarkerType}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if the keys that we care about changed
  
  // Check if marker arrays have the same IDs
  const prevIds = new Set(prevProps.markers.map(m => m.id));
  const nextIds = new Set(nextProps.markers.map(m => m.id));
  
  // Different number of unique IDs means we need to re-render
  if (prevIds.size !== nextIds.size) return false;
  
  // Check if any IDs are different
  for (const id of prevIds) {
    if (!nextIds.has(id)) return false;
  }
  
  const tempMarkerChanged = 
    (prevProps.tempMarker === null && nextProps.tempMarker !== null) ||
    (prevProps.tempMarker !== null && nextProps.tempMarker === null) ||
    (prevProps.tempMarker && nextProps.tempMarker && 
      (prevProps.tempMarker[0] !== nextProps.tempMarker[0] || 
       prevProps.tempMarker[1] !== nextProps.tempMarker[1]));
  
  const otherPropsChanged =
    prevProps.markerName !== nextProps.markerName ||
    prevProps.markerType !== nextProps.markerType;
  
  return !(tempMarkerChanged || otherPropsChanged);
});

MarkersContainer.displayName = 'MarkersContainer';

export default MarkersContainer;
