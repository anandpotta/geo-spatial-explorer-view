
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
      
      // Check if this is a click on a leaflet control or popup that should be ignored
      if (e.originalEvent && e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Allow path clicks to proceed for image uploads - don't prevent these
        if (target.tagName === 'path' || target.tagName === 'svg' || target.closest('path')) {
          console.log('Click on path detected - allowing path to handle upload');
          // Let path handle its own events and don't create markers
          return;
        }
        
        // Allow marker clicks to proceed normally
        if (target.closest('.leaflet-marker-icon') || 
            target.closest('.leaflet-marker-shadow')) {
          console.log('Click on marker detected - allowing normal marker behavior');
          // Let marker handle its own events
          return;
        }
        
        // Don't create markers when clicking inside popups
        if (target.closest('.leaflet-popup-content') || 
            target.closest('.leaflet-popup-close-button')) {
          console.log('Click inside popup detected - ignoring for marker creation');
          return;
        }
        
        // Ignore clicks on drawing controls and UI elements
        if (
          target.closest('.leaflet-control') ||
          target.closest('.upload-button-container') ||
          target.closest('.upload-button-wrapper') ||
          target.closest('.image-controls-container') ||
          target.closest('.image-controls-wrapper') ||
          target.closest('.leaflet-draw-toolbar')
        ) {
          console.log('Click on control or UI element ignored');
          return;
        }
      }
      
      // Allow the map click to proceed for marker creation
      console.log('Map click proceeding for marker creation at:', e.latlng);
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
