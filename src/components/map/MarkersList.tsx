import { LocationMarker } from '@/utils/geo-utils';
import UserMarker from './UserMarker';
import TempMarker from './TempMarker';
import { useMemo } from 'react';

interface MarkersListProps {
  markers: LocationMarker[];
  tempMarker: [number, number] | null;
  markerName: string;
  markerType: 'pin' | 'area' | 'building';
  onDeleteMarker: (id: string) => void;
  onSaveMarker: () => void;
  setMarkerName: (name: string) => void;
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
}

const MarkersList = ({
  markers,
  tempMarker,
  markerName,
  markerType,
  onDeleteMarker,
  onSaveMarker,
  setMarkerName,
  setMarkerType
}: MarkersListProps) => {
  // Use useMemo to deduplicate markers based on id
  const uniqueMarkers = useMemo(() => {
    const uniqueMap = new Map();
    
    // Filter out duplicates by keeping only the last instance of each ID
    markers.forEach(marker => {
      uniqueMap.set(marker.id, marker);
    });
    
    return Array.from(uniqueMap.values());
  }, [markers]);
  
  return (
    <>
      {Array.isArray(uniqueMarkers) && uniqueMarkers.map((marker) => (
        <UserMarker 
          key={`marker-${marker.id}`} 
          marker={marker} 
          onDelete={onDeleteMarker} 
        />
      ))}
      
      {tempMarker && Array.isArray(tempMarker) && (
        <TempMarker 
          position={tempMarker}
          markerName={markerName}
          setMarkerName={setMarkerName}
          markerType={markerType}
          setMarkerType={setMarkerType}
          onSave={onSaveMarker}
        />
      )}
    </>
  );
};

export default MarkersList;
