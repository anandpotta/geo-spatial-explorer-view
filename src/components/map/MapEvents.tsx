
import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
  onMapClick: (latlng: L.LatLng) => void;
}

const MapEvents = ({ onMapClick }: MapEventsProps) => {
  useMapEvents({
    click: (e) => {
      // Don't trigger click if we're in the process of deleting a marker
      if (window.preventMapClick) {
        console.log('Map click prevented after marker deletion');
        return;
      }
      
      // Check if this is a click on a leaflet control or popup that should be ignored
      if (e.originalEvent && e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Check if this is a click on a path element - allow it but don't create markers
        if (target.tagName === 'path' || target.tagName === 'svg' || target.closest('path')) {
          console.log('Click on path detected - allowing path interaction');
          // For path clicks, we want to allow the path to handle the interaction
          // but we don't want to create new markers
          return;
        }
        
        // Check if this is a click on a marker - allow it and don't create new markers
        if (target.closest('.leaflet-marker-icon') || target.closest('.leaflet-marker-shadow')) {
          console.log('Click on marker detected - allowing marker interaction');
          // For marker clicks, let the marker handle its own click events
          // Don't create new markers
          return;
        }
        
        // Only ignore clicks on specific UI controls that should not create markers
        if (
          // Ignore clicks on leaflet popups (but allow them to function)
          target.closest('.leaflet-popup') ||
          // Ignore clicks on leaflet controls
          target.closest('.leaflet-control') ||
          // Ignore clicks on specific UI controls
          target.closest('.upload-button-container') ||
          target.closest('.upload-button-wrapper') ||
          target.closest('.image-controls-container') ||
          target.closest('.image-controls-wrapper')
        ) {
          console.log('Click on control or UI element ignored');
          return;
        }
      }
      
      // Allow the map click to proceed for marker creation
      console.log('Map click proceeding for marker creation at:', e.latlng);
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
