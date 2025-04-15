import React from 'react';
import { Marker } from 'react-leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  return (
    <Marker position={marker.position} key={marker.id}>
      <MarkerPopup marker={marker} onDelete={onDelete} />
    </Marker>
  );
};

export default UserMarker;

