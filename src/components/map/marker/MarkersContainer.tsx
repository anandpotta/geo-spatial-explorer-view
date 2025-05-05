
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
  const processedMarkersRef = useRef<string>("");
  
  // Update unique markers whenever the markers prop changes
  useEffect(() => {
    // Skip processing if we already processed this exact set of markers
    const markersSignature = JSON.stringify(markers.map(m => m.id).sort());
    if (markersSignature === processedMarkersRef.current) {
      return;
    }
    
    // Create a map to ensure uniqueness by ID
    const markerMap = new Map<string, LocationMarker>();
    
    // Process markers in original order to maintain consistency
    markers.forEach(marker => {
      // Only add if not already in the map
      if (!markerMap.has(marker.id)) {
        markerMap.set(marker.id, marker);
      }
    });
    
    // Convert map back to array
    const deduplicatedMarkers = Array.from(markerMap.values());
    console.log(`Deduplicated ${markers.length} markers down to ${deduplicatedMarkers.length}`);
    
    setUniqueMarkers(deduplicatedMarkers);
    processedMarkersRef.current = markersSignature;
  }, [markers]);
  
  return (
    <MarkersList
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
  const markersChanged = prevProps.markers.length !== nextProps.markers.length ||
    JSON.stringify(prevProps.markers.map(m => m.id).sort()) !== 
    JSON.stringify(nextProps.markers.map(m => m.id).sort());
  
  const tempMarkerChanged = 
    prevProps.tempMarker !== nextProps.tempMarker;
  
  const otherPropsChanged =
    prevProps.markerName !== nextProps.markerName ||
    prevProps.markerType !== nextProps.markerType;
  
  return !(markersChanged || tempMarkerChanged || otherPropsChanged);
});

MarkersContainer.displayName = 'MarkersContainer';

export default MarkersContainer;
