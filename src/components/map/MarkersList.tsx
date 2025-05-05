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
    // Create a Map using the ID as keys to naturally eliminate duplicates
    const uniqueMap = new Map();
    
    // We need consistent rendering order, so process markers in reverse to keep the most recent
    // This ensures when we have duplicates, we keep the last one (most recent) in the map
    [...markers].reverse().forEach(marker => {
      uniqueMap.set(marker.id, marker);
    });
    
    return Array.from(uniqueMap.values());
  }, [markers]);
  
  console.log(`MarkersList rendering ${uniqueMarkers.length} markers from ${markers.length} inputs`);
  
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
