
import { LocationMarker } from '@/utils/marker-utils';
import MarkersList from '../MarkersList';
import { memo, useMemo } from 'react';

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
  // Deduplicate markers by ID to prevent duplicates
  const uniqueMarkers = useMemo(() => {
    const markerMap = new Map<string, LocationMarker>();
    if (Array.isArray(markers)) {
      markers.forEach(marker => {
        markerMap.set(marker.id, marker);
      });
    }
    return Array.from(markerMap.values());
  }, [markers]);
  
  // Check if temp marker position matches any existing marker position
  const isTemporaryMarkerDuplicate = useMemo(() => {
    if (!tempMarker) return false;
    
    return uniqueMarkers.some(marker => {
      const [lat1, lng1] = marker.position;
      const [lat2, lng2] = tempMarker;
      
      // Use a small threshold for floating point comparison
      const threshold = 0.00001;
      return Math.abs(lat1 - lat2) < threshold && Math.abs(lng1 - lng2) < threshold;
    });
  }, [tempMarker, uniqueMarkers]);

  return (
    <MarkersList
      markers={uniqueMarkers}
      // Only pass tempMarker if it's not a duplicate of an existing marker
      tempMarker={isTemporaryMarkerDuplicate ? null : tempMarker}
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
