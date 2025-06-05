
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
        
        // Check if this is a click on a path element - let it handle its own events
        if (target.tagName === 'path' || target.tagName === 'svg' || target.closest('path')) {
          console.log('Click on path detected - allowing path to handle its own events');
          // Don't prevent the event, but also don't create markers
          // The path should handle its own click events
          return;
        }
        
        // Check if this is a click on a marker or its popup
        if (target.closest('.leaflet-marker-icon') || 
            target.closest('.leaflet-marker-shadow') ||
            target.closest('.leaflet-popup')) {
          console.log('Click on marker or popup detected - allowing marker interaction');
          // Don't create new markers for these clicks
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
