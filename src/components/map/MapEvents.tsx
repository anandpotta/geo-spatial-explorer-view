
import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
  onMapClick: (latlng: L.LatLng) => void;
}

const MapEvents = ({ onMapClick }: MapEventsProps) => {
  useMapEvents({
    click: (e) => {
      console.log('Map click detected at:', e.latlng);
      
      // Don't trigger click if we're in the process of deleting a marker
      if (window.preventMapClick) {
        console.log('Map click prevented after marker deletion');
        return;
      }
      
      // Ignore clicks on markers, popups, or SVG paths
      if (
        e.originalEvent.target &&
        ((e.originalEvent.target as HTMLElement).closest('.leaflet-marker-icon') ||
         (e.originalEvent.target as HTMLElement).closest('.leaflet-popup') ||
         (e.originalEvent.target as HTMLElement).closest('path') ||
         (e.originalEvent.target as HTMLElement).tagName === 'path' ||
         (e.originalEvent.target as HTMLElement).tagName === 'svg' ||
         // Also ignore clicks on upload buttons or image controls
         (e.originalEvent.target as HTMLElement).closest('.upload-button-container') ||
         (e.originalEvent.target as HTMLElement).closest('.upload-button-wrapper') ||
         (e.originalEvent.target as HTMLElement).closest('.image-controls-container') ||
         (e.originalEvent.target as HTMLElement).closest('.image-controls-wrapper'))
      ) {
        console.log('Click on marker, popup, path or control ignored');
        return;
      }
      
      console.log('Calling onMapClick handler');
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
