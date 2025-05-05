
import { LocationMarker } from '@/utils/marker-utils';
import MarkersList from '../MarkersList';
import { memo } from 'react';

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
  // Create a memoized version of markers with unique IDs to prevent duplicates
  const uniqueMarkers = markers.filter(
    (marker, index, self) => index === self.findIndex(m => m.id === marker.id)
  );
  
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
  return (
    prevProps.tempMarker === nextProps.tempMarker &&
    prevProps.markerName === nextProps.markerName &&
    prevProps.markerType === nextProps.markerType &&
    JSON.stringify(prevProps.markers.map(m => m.id)) === 
    JSON.stringify(nextProps.markers.map(m => m.id))
  );
});

MarkersContainer.displayName = 'MarkersContainer';

export default MarkersContainer;
