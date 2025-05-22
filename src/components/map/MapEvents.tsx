
import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
  onMapClick: (latlng: L.LatLng) => void;
}

const MapEvents = ({ onMapClick }: MapEventsProps) => {
  useMapEvents({
    click: (e) => {
      // Don't trigger click if we're in the process of deleting a marker
      if (window.preventMapClick) {
        console.log('Map click prevented after marker deletion');
        return;
      }
      
      // Ignore clicks on markers or popups
      if (
        e.originalEvent.target &&
        ((e.originalEvent.target as HTMLElement).closest('.leaflet-marker-icon') ||
         (e.originalEvent.target as HTMLElement).closest('.leaflet-popup'))
      ) {
        console.log('Click on marker or popup ignored');
        return;
      }
      
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
