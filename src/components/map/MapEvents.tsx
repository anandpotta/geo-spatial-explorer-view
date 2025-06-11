
import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
  onMapClick: (latlng: L.LatLng) => void;
  onPathClick?: (drawingId: string) => void;
}

const MapEvents = ({ onMapClick, onPathClick }: MapEventsProps) => {
  useMapEvents({
    click: (e) => {
      console.log('Map click detected at:', e.latlng);
      
      // Don't trigger click if we're in the process of deleting a marker
      if (typeof window !== 'undefined' && window.preventMapClick) {
        console.log('Map click prevented after marker deletion');
        return;
      }
      
      // More precise click detection - prioritize drawing paths
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
        
        // Check for SVG path clicks
        const pathElement = target.tagName === 'path' || target.tagName === 'PATH' 
          ? target 
          : target.closest('path');
        
        if (pathElement) {
          const drawingId = pathElement.getAttribute('data-drawing-id');
          
          console.log(`=== SVG PATH CLICKED ===`);
          console.log(`Drawing ID: ${drawingId}`);
          
          // If we have a drawing ID and the onPathClick handler, call it
          if (drawingId && onPathClick) {
            console.log(`=== OPENING UPLOAD POPUP for drawing: ${drawingId} ===`);
            onPathClick(drawingId);
            return; // Block map click when path is clicked
          }
          
          // If no drawing ID, allow map click to proceed
          console.log('SVG path clicked but no drawing ID found, allowing map click');
        }
      }
      
      console.log('Calling onMapClick handler');
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
