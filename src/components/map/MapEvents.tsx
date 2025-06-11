
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
      
      // More precise click filtering - only ignore actual UI elements
      if (e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Check if click is on specific interactive elements
        const isOnMarker = target.closest('.leaflet-marker-icon') !== null;
        const isOnPopup = target.closest('.leaflet-popup') !== null;
        const isOnControl = target.closest('.leaflet-control') !== null;
        const isOnButton = target.tagName === 'BUTTON' || target.closest('button') !== null;
        const isOnInput = target.tagName === 'INPUT' || target.closest('input') !== null;
        
        // Only ignore if it's actually on an interactive element
        if (isOnMarker || isOnPopup || isOnControl || isOnButton || isOnInput) {
          console.log('Click on interactive element ignored:', { isOnMarker, isOnPopup, isOnControl, isOnButton, isOnInput });
          return;
        }
        
        // Check for SVG elements - allow clicks on paths with drawing IDs (these should trigger region clicks)
        if (target.tagName === 'path' || target.tagName === 'svg') {
          const hasDrawingId = target.getAttribute('data-drawing-id') !== null;
          const isInteractiveDrawing = target.closest('[data-drawing-id]') !== null;
          
          // If it's a drawing with an ID, let the layer click handler deal with it
          // Don't call onMapClick for these as they should trigger region clicks instead
          if (hasDrawingId || isInteractiveDrawing) {
            console.log('Click on drawing path - letting layer handler manage it');
            return;
          }
          
          // For other SVG elements without drawing IDs, check if they have interactive attributes
          const hasClickHandler = target.onclick !== null || 
                                 target.getAttribute('onclick') !== null ||
                                 target.style.cursor === 'pointer';
          
          if (hasClickHandler) {
            console.log('Click on interactive SVG element ignored');
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
