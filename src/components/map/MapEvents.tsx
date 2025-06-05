
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
        
        // Don't interfere with temp marker popups or any popup content
        if (target.closest('.temp-marker-popup') || 
            target.closest('.temp-marker-content') ||
            target.closest('.leaflet-popup') ||
            target.closest('.leaflet-popup-content') ||
            target.closest('.leaflet-popup-content-wrapper')) {
          console.log('MapEvents: Popup click - stopping propagation');
          e.originalEvent.stopPropagation();
          return;
        }
        
        // Allow marker clicks to open popups - but don't create new markers
        if (target.closest('.leaflet-marker-icon') || 
            target.closest('.leaflet-marker-shadow') ||
            target.classList.contains('leaflet-marker-icon')) {
          console.log('MapEvents: Marker click detected - stopping map click propagation');
          e.originalEvent.stopPropagation();
          return;
        }
        
        // Allow SVG path clicks for image uploads
        if (target.tagName === 'path' || 
            target.tagName === 'svg' || 
            target.closest('path') ||
            target.closest('svg')) {
          console.log('MapEvents: SVG/Path click detected - allowing functionality');
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
