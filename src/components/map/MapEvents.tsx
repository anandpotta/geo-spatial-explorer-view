
import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
  onMapClick: (latlng: L.LatLng) => void;
  onRegionClick?: (drawing: any) => void;
}

const MapEvents = ({ onMapClick, onRegionClick }: MapEventsProps) => {
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
        
        // Special handling for SVG elements - detect if it's a drawn shape
        if (target.tagName === 'path' || target.tagName === 'svg') {
          // Check if the path/svg is part of a control that should be ignored
          if (target.closest('.leaflet-control') || 
              target.closest('.leaflet-draw-toolbar') ||
              target.closest('.upload-button-container') ||
              target.closest('.image-controls-container')) {
            console.log('Click on control SVG element ignored');
            return;
          }
          
          // Check if this is a drawn shape (has specific classes or attributes)
          const pathElement = target.tagName === 'path' ? target : target.querySelector('path');
          if (pathElement) {
            // Look for data attributes or classes that indicate this is a drawn shape
            const hasDrawingId = pathElement.hasAttribute('data-drawing-id') || 
                                pathElement.closest('[data-drawing-id]') ||
                                pathElement.classList.contains('leaflet-interactive');
            
            if (hasDrawingId && onRegionClick) {
              console.log('Click on drawn shape detected, triggering region click');
              
              // Try to get the drawing ID from the path element or its parent
              let drawingId = pathElement.getAttribute('data-drawing-id');
              if (!drawingId) {
                const parentWithId = pathElement.closest('[data-drawing-id]');
                if (parentWithId) {
                  drawingId = parentWithId.getAttribute('data-drawing-id');
                }
              }
              
              // If we found a drawing ID, trigger region click
              if (drawingId) {
                console.log('Found drawing ID:', drawingId);
                onRegionClick({ id: drawingId });
                return;
              } else {
                // Fallback: create a mock drawing object for region click
                console.log('No drawing ID found, using fallback region click');
                onRegionClick({ 
                  id: `shape-${Date.now()}`,
                  type: 'unknown',
                  clickPosition: e.latlng 
                });
                return;
              }
            }
          }
          
          console.log('Click on SVG path/element - no drawing ID found, treating as map click');
        }
        
        // Check if the target has specific classes that indicate it's a control
        if (target.classList.contains('leaflet-marker-icon') ||
            target.classList.contains('leaflet-popup') ||
            target.classList.contains('leaflet-control')) {
          console.log('Click on control element ignored');
          return;
        }
      }
      
      console.log('Calling onMapClick handler for marker creation');
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
