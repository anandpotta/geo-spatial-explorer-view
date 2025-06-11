
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
        
        // HIGH PRIORITY: Check for interactive drawing elements
        if (target.tagName === 'path' || target.tagName === 'PATH') {
          const drawingId = target.getAttribute('data-drawing-id');
          const isInteractive = target.getAttribute('data-interactive');
          const globalHandler = target.getAttribute('data-global-handler');
          
          if (drawingId || isInteractive) {
            console.log(`=== BLOCKING MAP CLICK === Interactive drawing element detected`);
            console.log(`Drawing ID: ${drawingId}, Interactive: ${isInteractive}, Global Handler: ${globalHandler}`);
            
            // Try to call the global handler if it exists
            if (globalHandler && (window as any)[globalHandler]) {
              console.log(`=== CALLING GLOBAL HANDLER FROM MAP CLICK: ${globalHandler} ===`);
              try {
                (window as any)[globalHandler]();
                console.log(`=== Global handler called successfully: ${globalHandler} ===`);
              } catch (error) {
                console.error(`Error calling global handler ${globalHandler}:`, error);
              }
            } else {
              console.warn(`Global handler ${globalHandler} not found on window object`);
              // List available global handlers for debugging
              const availableHandlers = Object.keys(window).filter(key => key.startsWith('triggerDrawingClick_'));
              console.log('Available global handlers:', availableHandlers);
            }
            
            // Completely block map click for drawing paths
            return;
          }
          
          // If it's any interactive SVG element, block map click
          if (target.hasAttribute('data-svg-uid') ||
              target.classList.contains('leaflet-interactive') ||
              target.closest('g[class*="leaflet"]')) {
            console.log('Click on interactive drawing element - blocking map click');
            return;
          }
        }
        
        // Also check parent elements for drawing attributes
        const pathParent = target.closest('path');
        if (pathParent) {
          const drawingId = pathParent.getAttribute('data-drawing-id');
          const isInteractive = pathParent.getAttribute('data-interactive');
          const globalHandler = pathParent.getAttribute('data-global-handler');
          
          if (drawingId || isInteractive) {
            console.log(`=== BLOCKING MAP CLICK === Parent interactive drawing element detected`);
            console.log(`Parent Drawing ID: ${drawingId}, Interactive: ${isInteractive}, Global Handler: ${globalHandler}`);
            
            // Try to call the global handler if it exists
            if (globalHandler && (window as any)[globalHandler]) {
              console.log(`=== CALLING GLOBAL HANDLER FROM MAP CLICK (PARENT): ${globalHandler} ===`);
              try {
                (window as any)[globalHandler]();
                console.log(`=== Global handler called successfully from parent: ${globalHandler} ===`);
              } catch (error) {
                console.error(`Error calling global handler from parent ${globalHandler}:`, error);
              }
            } else {
              console.warn(`Global handler from parent ${globalHandler} not found on window object`);
              // List available global handlers for debugging
              const availableHandlers = Object.keys(window).filter(key => key.startsWith('triggerDrawingClick_'));
              console.log('Available global handlers:', availableHandlers);
            }
            
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
