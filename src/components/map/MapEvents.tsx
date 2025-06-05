
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
        
        // Don't interfere with popup content clicks
        if (target.closest('.leaflet-popup') ||
            target.closest('.leaflet-popup-content') ||
            target.closest('.leaflet-popup-content-wrapper') ||
            target.closest('.temp-marker-popup') || 
            target.closest('.temp-marker-content')) {
          console.log('MapEvents: Popup content click - ignoring');
          return;
        }
        
        // Handle marker clicks - allow popup to open but don't create new markers
        if (target.closest('.leaflet-marker-icon') || 
            target.closest('.leaflet-marker-shadow') ||
            target.classList.contains('leaflet-marker-icon')) {
          console.log('MapEvents: Marker click detected - allowing popup, not creating new marker');
          return;
        }
        
        // Allow SVG path clicks for image uploads and other drawing interactions
        if (target.tagName === 'path' || 
            target.tagName === 'svg' || 
            target.closest('path') ||
            target.closest('svg')) {
          console.log('MapEvents: SVG/Path click detected - allowing drawing functionality');
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
      
      // This is a valid map click for marker creation
      console.log('MapEvents: Valid map click - calling onMapClick handler');
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
