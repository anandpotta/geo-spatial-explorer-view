
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
      
      // More precise click detection - only ignore specific interactive elements
      if (e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Ignore clicks on actual marker icons (not their containers)
        if (target.closest('.leaflet-marker-icon img') || 
            target.classList.contains('leaflet-marker-icon')) {
          console.log('Click on marker icon ignored');
          return;
        }
        
        // Ignore clicks on popup content (not the map behind it)
        if (target.closest('.leaflet-popup-content') ||
            target.closest('.leaflet-popup-close-button')) {
          console.log('Click on popup content ignored');
          return;
        }
        
        // Only ignore clicks on interactive drawing paths, not all paths
        if (target.tagName === 'path' && 
            (target.classList.contains('leaflet-interactive') ||
             target.hasAttribute('data-drawing-id'))) {
          console.log('Click on interactive drawing path ignored');
          return;
        }
        
        // Ignore clicks on drawing control buttons and upload interfaces
        if (target.closest('.leaflet-draw-toolbar') ||
            target.closest('.leaflet-draw-actions') ||
            target.closest('.upload-button-container') ||
            target.closest('.upload-button-wrapper') ||
            target.closest('.image-controls-container') ||
            target.closest('.image-controls-wrapper')) {
          console.log('Click on drawing controls ignored');
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
