
import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
  onMapClick: (latlng: L.LatLng) => void;
}

const MapEvents = ({ onMapClick }: MapEventsProps) => {
  useMapEvents({
    click: (e) => {
      console.log('MapEvents: Click detected at:', e.latlng);
      
      // Check if this is a click on a UI element that should be ignored
      if (e.originalEvent && e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Allow path clicks for image uploads
        if (target.tagName === 'path' || target.tagName === 'svg' || target.closest('path')) {
          console.log('MapEvents: Path click - allowing upload functionality');
          return;
        }
        
        // Allow marker clicks - let markers handle their own events
        if (target.closest('.leaflet-marker-icon') || 
            target.closest('.leaflet-marker-shadow')) {
          console.log('MapEvents: Marker click - allowing marker popup');
          return;
        }
        
        // Don't create markers when clicking on popups
        if (target.closest('.leaflet-popup')) {
          console.log('MapEvents: Popup click - ignoring');
          return;
        }
        
        // Ignore clicks on controls
        if (target.closest('.leaflet-control') ||
            target.closest('.leaflet-draw-toolbar')) {
          console.log('MapEvents: Control click - ignoring');
          return;
        }
      }
      
      // Allow the map click to proceed for marker creation
      console.log('MapEvents: Proceeding with map click for marker creation');
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
