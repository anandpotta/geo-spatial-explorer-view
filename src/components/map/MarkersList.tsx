
import { LocationMarker } from '@/utils/geo-utils';
import UserMarker from './UserMarker';
import TempMarker from './TempMarker';
import { useMemo, useRef } from 'react';

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
  const instanceId = useRef<string>(`markers-${Date.now()}`).current;

  console.log(`MarkersList rendering ${markers.length} markers from ${markers.length} inputs`);
  
  return (
    <>
      {markers.map((marker) => (
        <UserMarker 
          key={`user-marker-${instanceId}-${marker.id}`} 
          marker={marker} 
          onDelete={onDeleteMarker} 
        />
      ))}
      
      {tempMarker && (
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
