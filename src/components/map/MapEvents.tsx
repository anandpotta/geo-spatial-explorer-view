
import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
  onMapClick: (latlng: L.LatLng) => void;
}

const MapEvents = ({ onMapClick }: MapEventsProps) => {
  useMapEvents({
    click: (e) => {
      console.log('MapEvents: Click detected at:', e.latlng);
      
      // Check if this is a click on a UI element that should be ignored
      if (e.originalEvent && e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Don't interfere with temp marker popups
        if (target.closest('.temp-marker-popup') || 
            target.closest('.temp-marker-content')) {
          console.log('MapEvents: Temp marker popup click - ignoring');
          return;
        }
        
        // Allow SVG path clicks for image uploads
        if (target.tagName === 'path' || 
            target.tagName === 'svg' || 
            target.closest('path') ||
            target.closest('svg')) {
          console.log('MapEvents: SVG/Path click detected - allowing functionality');
          // Don't prevent default - let the path handle its own events
          return;
        }
        
        // Allow marker clicks - let markers handle their own events
        if (target.closest('.leaflet-marker-icon') || 
            target.closest('.leaflet-marker-shadow') ||
            target.classList.contains('leaflet-marker-icon')) {
          console.log('MapEvents: Marker click detected - allowing popup');
          // Don't prevent default - let the marker handle its own events
          return;
        }
        
        // Don't create markers when clicking on any popup
        if (target.closest('.leaflet-popup') ||
            target.closest('.leaflet-popup-content') ||
            target.closest('.leaflet-popup-content-wrapper')) {
          console.log('MapEvents: Popup click - ignoring');
          return;
        }
        
        // Ignore clicks on controls and toolbars
        if (target.closest('.leaflet-control') ||
            target.closest('.leaflet-draw-toolbar') ||
            target.closest('.leaflet-draw-actions')) {
          console.log('MapEvents: Control/toolbar click - ignoring');
          return;
        }
      }
      
      // Allow the map click to proceed for marker creation
      console.log('MapEvents: Proceeding with map click for marker creation');
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
