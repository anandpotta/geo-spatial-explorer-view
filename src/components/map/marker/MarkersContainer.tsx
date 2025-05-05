
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
  // Use state to store deduplicated markers
  const [uniqueMarkers, setUniqueMarkers] = useState<LocationMarker[]>([]);
  const processedMarkersRef = useRef<Set<string>>(new Set());
  const instanceIdRef = useRef(`marker-container-${Date.now()}`);
  const previousMarkersRef = useRef<LocationMarker[]>([]);
  
  // Update unique markers whenever the markers prop changes
  useEffect(() => {
    if (!Array.isArray(markers)) {
      console.warn('MarkersContainer received non-array markers:', markers);
      setUniqueMarkers([]);
      return;
    }
    
    // Skip processing if markers haven't changed by reference and content
    if (
      previousMarkersRef.current === markers &&
      previousMarkersRef.current.length === markers.length
    ) {
      return;
    }
    
    console.log(`MarkersContainer ${instanceIdRef.current} received ${markers.length} markers`);
    
    // Create a map to ensure uniqueness by ID
    const markerMap = new Map<string, LocationMarker>();
    
    // Process all markers to get the latest version of each
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
    previousMarkersRef.current = markers;
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
});

MarkersContainer.displayName = 'MarkersContainer';

export default MarkersContainer;
