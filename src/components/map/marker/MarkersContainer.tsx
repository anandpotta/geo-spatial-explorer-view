
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
  // Deduplicate markers
  const uniqueMarkers = useMemo(() => {
    const markerMap = new Map<string, LocationMarker>();
    if (Array.isArray(markers)) {
      markers.forEach(marker => {
        markerMap.set(marker.id, marker);
      });
    }
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
