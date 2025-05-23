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
  // Deduplicate markers by ID - we need to ensure we don't render duplicate markers
  const uniqueMarkers = useMemo(() => {
    // First ensure we have a valid array of markers
    if (!Array.isArray(markers)) {
      return [];
    }
    
    // Use a Map to keep only one marker per ID
    const markerMap = new Map<string, LocationMarker>();
    markers.forEach(marker => {
      if (marker && marker.id) {
        markerMap.set(marker.id, marker);
      }
    });
    
    // Convert back to array
    return Array.from(markerMap.values());
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
});

MarkersContainer.displayName = 'MarkersContainer';

export default MarkersContainer;
