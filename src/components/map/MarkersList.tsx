
import { LocationMarker } from '@/utils/geo-utils';
import UserMarker from './UserMarker';
import TempMarker from './TempMarker';
import { useMemo, useId } from 'react';

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
  // Generate a unique instance ID to ensure consistent marker keys
  const instanceId = useId();
  
  // Use useMemo to deduplicate markers based on id
  const uniqueMarkers = useMemo(() => {
    if (!Array.isArray(markers) || markers.length === 0) {
      return [];
    }
    
    // Create a Map using the ID as keys to naturally eliminate duplicates
    const uniqueMap = new Map();
    
    // Process markers to keep the ones with unique IDs
    markers.forEach(marker => {
      if (marker && marker.id) {
        uniqueMap.set(marker.id, marker);
      }
    });
    
    const result = Array.from(uniqueMap.values());
    console.log(`MarkersList: Deduplicated ${markers.length} markers to ${result.length} unique markers`);
    return result;
  }, [markers]);
  
  console.log(`MarkersList rendering ${uniqueMarkers.length} markers from ${markers.length} inputs`);
  
  return (
    <>
      {Array.isArray(uniqueMarkers) && uniqueMarkers.map((marker) => (
        <UserMarker 
          key={`user-marker-${instanceId}-${marker.id}`} 
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
