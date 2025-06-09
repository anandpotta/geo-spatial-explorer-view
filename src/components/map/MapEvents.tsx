
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
      
      // Check if the click target is a control element that should be ignored
      if (e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        
        // Only ignore clicks on specific control elements, not on interactive map features
        if (
          target.closest('.leaflet-popup') ||
          target.closest('.upload-button-container') ||
          target.closest('.upload-button-wrapper') ||
          target.closest('.image-controls-container') ||
          target.closest('.image-controls-wrapper') ||
          target.closest('.leaflet-control') ||
          target.closest('.leaflet-bar') ||
          target.closest('.leaflet-draw-toolbar')
        ) {
          console.log('Click on control element ignored');
          return;
        }
        
        // Allow clicks on SVG paths and markers - these should be interactive
        if (
          target.closest('.leaflet-marker-icon') ||
          target.tagName === 'path' ||
          target.tagName === 'svg' ||
          target.closest('path') ||
          target.closest('svg')
        ) {
          console.log('Click on interactive map element - allowing event to propagate');
          // Don't return here - let the click propagate to the shape/marker handlers
          // But also don't call onMapClick to avoid creating a new marker
          return;
        }
      }
      
      console.log('Calling onMapClick handler');
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
