
import React from 'react';
import { LocationMarker } from '@/utils/geo-utils';
import UserMarker from './UserMarker';
import TempMarker from './TempMarker';

interface MarkersListProps {
  markers: LocationMarker[];
  tempMarker: [number, number] | null;
  markerName: string;
  markerType: 'pin' | 'area' | 'building';
  onDeleteMarker: (id: string) => void;
  onSaveMarker: () => void;
  setMarkerName: (name: string) => void;
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  mapKey?: string; // Added mapKey property
}

const MarkersList = ({
  markers,
  tempMarker,
  markerName,
  markerType,
  onDeleteMarker,
  onSaveMarker,
  setMarkerName,
  setMarkerType,
  mapKey = 'global' // Default value
}: MarkersListProps) => {
  return (
    <>
      {Array.isArray(markers) && markers.map((marker) => (
        <UserMarker 
          key={`marker-${marker.id}`} 
          marker={marker} 
          onDelete={onDeleteMarker}
          mapKey={mapKey}  // Pass mapKey to UserMarker
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
          mapKey={mapKey}  // Pass mapKey to TempMarker
        />
      )}
    </>
  );
};

export default React.memo(MarkersList);
