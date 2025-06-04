
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
      
      const target = e.originalEvent.target as HTMLElement;
      
      // Allow clicks on actual marker popups and their content
      if (target && (
        target.closest('.leaflet-popup') ||
        target.closest('.leaflet-popup-content') ||
        target.closest('.leaflet-popup-content-wrapper')
      )) {
        console.log('Click on popup allowed');
        return;
      }
      
      // Ignore clicks on drawing paths, SVG elements, and upload controls
      if (target && (
        target.closest('path') ||
        target.tagName === 'path' ||
        target.tagName === 'svg' ||
        target.closest('.upload-button-container') ||
        target.closest('.upload-button-wrapper') ||
        target.closest('.image-controls-container') ||
        target.closest('.image-controls-wrapper')
      )) {
        console.log('Click on drawing element or control ignored');
        return;
      }
      
      // Allow clicks on marker icons to show popups, but don't create new markers
      if (target && target.closest('.leaflet-marker-icon')) {
        console.log('Click on marker icon - allowing popup to show');
        // Don't call onMapClick for marker icons, let the marker handle its own popup
        return;
      }
      
      // For all other clicks on the map, create a new marker
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
