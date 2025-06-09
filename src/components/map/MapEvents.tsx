
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
      if (typeof window !== 'undefined' && window.preventMapClick) {
        console.log('Map click prevented after marker deletion');
        return;
      }
      
      // More specific checks for what should be ignored
      if (e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Check if click is on specific interactive elements that should be ignored
        if (
          target.closest('.leaflet-marker-icon') ||
          target.closest('.leaflet-popup') ||
          target.closest('.leaflet-control') ||
          target.closest('.leaflet-draw-toolbar') ||
          target.closest('.upload-button-container') ||
          target.closest('.image-controls-container') ||
          target.closest('.leaflet-draw-tooltip')
        ) {
          console.log('Click on interactive element ignored');
          return;
        }
        
        // Special handling for SVG elements - allow clicks on paths but not on certain control elements
        if (target.tagName === 'path' || target.tagName === 'svg') {
          // Check if the path/svg is part of a control that should be ignored
          if (target.closest('.leaflet-control') || 
              target.closest('.leaflet-draw-toolbar') ||
              target.closest('.upload-button-container') ||
              target.closest('.image-controls-container')) {
            console.log('Click on control SVG element ignored');
            return;
          }
          
          // Allow clicks on drawing paths and other interactive SVG elements
          console.log('Click on SVG path/element allowed');
        }
        
        // Check if the target has specific classes that indicate it's a control
        if (target.classList.contains('leaflet-marker-icon') ||
            target.classList.contains('leaflet-popup') ||
            target.classList.contains('leaflet-control')) {
          console.log('Click on control element ignored');
          return;
        }
      }
      
      console.log('Calling onMapClick handler');
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
