
import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

interface SelectedLocationMarkerProps {
  position: [number, number];
  label: string;
}

// Create a red marker icon for selected locations
const redMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const SelectedLocationMarker = ({ position, label }: SelectedLocationMarkerProps) => {
  return (
    <Marker 
      position={position} 
      icon={redMarkerIcon}
      draggable={false}
      title={label}
    />
  );
};

export default SelectedLocationMarker;
