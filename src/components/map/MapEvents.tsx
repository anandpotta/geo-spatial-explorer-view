
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
        let handlerCalled = false;
        
        // Check if the target itself is a path or find the closest path
        const pathElement = target.tagName === 'path' || target.tagName === 'PATH' 
          ? target 
          : target.closest('path');
        
        if (pathElement) {
          const drawingId = pathElement.getAttribute('data-drawing-id');
          const isInteractive = pathElement.getAttribute('data-interactive');
          const globalHandler = pathElement.getAttribute('data-global-handler');
          
          console.log(`=== INTERACTIVE PATH DETECTED ===`);
          console.log(`Drawing ID: ${drawingId}, Interactive: ${isInteractive}, Global Handler: ${globalHandler}`);
          
          // Only block map click if we have valid attributes AND a working global handler
          if (drawingId && isInteractive === 'true' && globalHandler && (window as any)[globalHandler]) {
            console.log(`=== BLOCKING MAP CLICK === Interactive drawing element detected`);
            
            console.log(`=== CALLING GLOBAL HANDLER: ${globalHandler} ===`);
            try {
              (window as any)[globalHandler]();
              console.log(`=== Global handler called successfully: ${globalHandler} ===`);
              handlerCalled = true;
            } catch (error) {
              console.error(`Error calling global handler ${globalHandler}:`, error);
            }
            
            // Completely block map click for valid drawing paths
            return;
          } else if (drawingId || isInteractive || globalHandler) {
            // If we have partial attributes but missing critical ones, warn and don't block
            console.warn(`Path has incomplete attributes - not blocking map click. DrawingId: ${drawingId}, Interactive: ${isInteractive}, Handler: ${globalHandler}`);
            
            // Clean up incomplete attributes to prevent future confusion
            if (!drawingId) pathElement.removeAttribute('data-drawing-id');
            if (!isInteractive || isInteractive !== 'true') pathElement.removeAttribute('data-interactive');
            if (!globalHandler || !(window as any)[globalHandler]) pathElement.removeAttribute('data-global-handler');
          }
          
          // If it's any other interactive SVG element without proper attribution, don't block
          if (target.hasAttribute('data-svg-uid') ||
              target.classList.contains('leaflet-interactive')) {
            console.log('Click on general interactive SVG element - allowing map click to proceed');
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
