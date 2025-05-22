import React from 'react';
import { LayerGroup } from 'react-leaflet';
import TempMarker from './TempMarker';
import UserMarker from './UserMarker';
import { LocationMarker } from '@/utils/marker-utils';

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
  return (
    <LayerGroup>
      {markers.map((marker) => (
        <UserMarker 
          key={`marker-${marker.id}`} 
          marker={marker} 
          onDelete={onDeleteMarker} 
        />
      ))}
      
      {tempMarker && (
        <TempMarker
          key={`temp-marker-${tempMarker[0]}-${tempMarker[1]}`}
          position={tempMarker}
          markerName={markerName}
          setMarkerName={setMarkerName}
          markerType={markerType}
          setMarkerType={setMarkerType}
          onSave={onSaveMarker}
        />
      )}
    </LayerGroup>
  );
};

export default MarkersList;
