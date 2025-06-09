
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
      
      // More precise click detection - only ignore UI controls, not interactive content
      if (e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Ignore clicks on actual marker icons (not their containers)
        if (target.closest('.leaflet-marker-icon img') || 
            target.classList.contains('leaflet-marker-icon')) {
          console.log('Click on marker icon ignored');
          return;
        }
        
        // Ignore clicks on popup close button and popup tip (but allow content clicks)
        if (target.closest('.leaflet-popup-close-button') ||
            target.closest('.leaflet-popup-tip')) {
          console.log('Click on popup close button ignored');
          return;
        }
        
        // Ignore clicks on drawing control buttons and toolbars
        if (target.closest('.leaflet-draw-toolbar') ||
            target.closest('.leaflet-draw-actions') ||
            target.closest('.leaflet-draw-section') ||
            target.closest('.leaflet-control') ||
            target.closest('.upload-button-container') ||
            target.closest('.upload-button-wrapper') ||
            target.closest('.image-controls-container') ||
            target.closest('.image-controls-wrapper')) {
          console.log('Click on drawing controls ignored');
          return;
        }
        
        // Special handling for SVG paths - allow drawing interaction but prevent map click
        if (target.tagName === 'path') {
          // If it's a drawing path with data attributes, let the layer handle it
          if (target.hasAttribute('data-drawing-id') || 
              target.hasAttribute('data-svg-uid') ||
              target.classList.contains('leaflet-interactive')) {
            console.log('Click on interactive drawing - letting layer handler manage it');
            // Don't call onMapClick, but don't prevent the event either
            // This allows the layer's click handler to work
            return;
          }
        }
      }
      
      console.log('Calling onMapClick handler');
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
