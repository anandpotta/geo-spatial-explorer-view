
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
  // Use memoized markers to prevent unnecessary re-renders
  const memoizedMarkers = useMemo(() => {
    // Ensure we have unique markers by ID
    return markers.reduce((unique: LocationMarker[], marker) => {
      if (!unique.find(m => m.id === marker.id)) {
        unique.push(marker);
      }
      return unique;
    }, []);
  }, [markers]);
  
  return (
    <MarkersList
      markers={memoizedMarkers}
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
