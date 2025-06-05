
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
        
        // Allow path clicks to proceed - they should handle their own events for uploads
        if (target.tagName === 'path' || target.tagName === 'svg' || target.closest('path')) {
          console.log('Click on path detected - allowing path to handle upload');
          // Let the path handle its own click events for image uploads
          return;
        }
        
        // Check if this is a click on a marker - allow normal marker behavior
        if (target.closest('.leaflet-marker-icon') || 
            target.closest('.leaflet-marker-shadow')) {
          console.log('Click on marker detected - allowing normal marker behavior');
          return;
        }
        
        // Don't create markers when clicking on popups
        if (target.closest('.leaflet-popup')) {
          console.log('Click on popup detected - ignoring for marker creation');
          return;
        }
        
        // Ignore clicks on specific UI controls
        if (
          target.closest('.leaflet-control') ||
          target.closest('.upload-button-container') ||
          target.closest('.upload-button-wrapper') ||
          target.closest('.image-controls-container') ||
          target.closest('.image-controls-wrapper')
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
