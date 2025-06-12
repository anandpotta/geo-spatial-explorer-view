
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
        
        // Check if click is on specific interactive elements - be more specific
        const isOnActualMarker = target.closest('.leaflet-marker-icon') !== null || 
                                 target.classList.contains('leaflet-marker-icon');
        const isOnPopup = target.closest('.leaflet-popup') !== null;
        const isOnControl = target.closest('.leaflet-control') !== null;
        const isOnButton = target.tagName === 'BUTTON' || target.closest('button') !== null;
        const isOnInput = target.tagName === 'INPUT' || target.closest('input') !== null;
        
        // Only ignore if it's actually on a real marker icon or other UI elements
        if (isOnActualMarker || isOnPopup || isOnControl || isOnButton || isOnInput) {
          console.log('Click on UI element ignored:', { isOnActualMarker, isOnPopup, isOnControl, isOnButton, isOnInput });
          return;
        }
        
        // For SVG elements (drawn shapes), check if they have drawing IDs
        if (target.tagName === 'path' || target.tagName === 'svg') {
          const hasDrawingId = target.getAttribute('data-drawing-id') !== null;
          const isInteractiveDrawing = target.closest('[data-drawing-id]') !== null;
          
          if (hasDrawingId || isInteractiveDrawing) {
            console.log('Click on drawing path - letting layer handler process it');
            // Don't return here - let the event continue to be processed
            // The layer's click handler should have already been triggered with higher priority
            // If we reach this point, it means the layer handler didn't catch it
            // So we should NOT create a new marker on a drawing
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
