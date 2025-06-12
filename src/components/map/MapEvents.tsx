
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
      
      // Check if this click was already handled by a layer click handler
      if (e.originalEvent && (e.originalEvent as any).__handledByLayer) {
        console.log('Click already handled by layer, skipping map click');
        return;
      }
      
      // More precise click filtering - only ignore actual UI elements
      if (e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Check for actual marker icons ONLY - be extremely specific
        const isOnActualMarker = (
          target.tagName === 'IMG' && 
          target.classList.contains('leaflet-marker-icon') &&
          !target.hasAttribute('data-drawing-id') &&
          !target.hasAttribute('data-shape-type') &&
          !target.hasAttribute('data-drawing-type') &&
          !target.classList.contains('leaflet-interactive') &&
          !target.classList.contains('leaflet-drawing') &&
          !target.closest('[data-drawing-id]') &&
          !target.closest('[data-shape-type]') &&
          !target.closest('.leaflet-interactive') &&
          (target.getAttribute('src')?.includes('marker') || 
           target.getAttribute('alt')?.includes('marker') ||
           target.closest('.marker-container') !== null)
        );
        
        const isOnPopup = target.closest('.leaflet-popup') !== null;
        const isOnControl = target.closest('.leaflet-control') !== null;
        const isOnButton = target.tagName === 'BUTTON' || target.closest('button') !== null;
        const isOnInput = target.tagName === 'INPUT' || target.closest('input') !== null;
        
        // Check if clicking on a drawing path - these should be handled by layer handlers
        const isOnDrawingPath = (
          target.hasAttribute('data-drawing-id') ||
          target.classList.contains('clickable-drawing-path') ||
          target.closest('[data-drawing-id]') !== null ||
          target.classList.contains('leaflet-interactive') ||
          (target.tagName === 'path' && target.classList.contains('leaflet-interactive'))
        );
        
        // If clicking on a drawing path, don't process as map click - let layer handler take precedence
        if (isOnDrawingPath) {
          console.log('Click on drawing path - deferring to layer click handler');
          // Give layer handlers a chance to process first
          setTimeout(() => {
            // Only process as map click if the event wasn't handled by layer
            if (!(e.originalEvent as any).__handledByLayer) {
              console.log('Drawing path click not handled by layer, processing as map click');
              onMapClick(e.latlng);
            }
          }, 10);
          return;
        }
        
        // Only ignore if it's actually on a real location marker or other UI elements
        if (isOnActualMarker || isOnPopup || isOnControl || isOnButton || isOnInput) {
          console.log('Click on UI element ignored:', { isOnActualMarker, isOnPopup, isOnControl, isOnButton, isOnInput });
          return;
        }
        
        // For SVG elements (drawn shapes), handle them carefully
        if (target.tagName === 'path' || target.tagName === 'svg') {
          const hasDrawingId = target.getAttribute('data-drawing-id') !== null;
          const isInteractiveDrawing = target.closest('[data-drawing-id]') !== null;
          const isActiveDrawing = target.hasAttribute('data-shape-type') || 
                                 target.classList.contains('leaflet-drawing');
          
          // If it's an active drawing (polygon being drawn), allow the click to continue
          if (isActiveDrawing) {
            console.log('Click on active drawing path - allowing polygon drawing to continue');
            // Don't return here - let the drawing continue
          } else if (hasDrawingId || isInteractiveDrawing) {
            console.log('Click on completed drawing path - deferring to layer handler');
            // Defer to layer handler with timeout
            setTimeout(() => {
              if (!(e.originalEvent as any).__handledByLayer) {
                console.log('Drawing path click not handled by layer after timeout');
              }
            }, 100);
            return;
          }
          
          // For other SVG elements without drawing IDs, check if they have interactive attributes
          const hasClickHandler = target.onclick !== null || 
                                 target.getAttribute('onclick') !== null ||
                                 target.style.cursor === 'pointer';
          
          if (hasClickHandler && !isActiveDrawing) {
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
