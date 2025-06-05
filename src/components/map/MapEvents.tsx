
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
        target.closest('.leaflet-popup-content-wrapper') ||
        target.closest('button') ||
        target.closest('input')
      )) {
        console.log('Click on popup or interactive element allowed');
        return;
      }
      
      // Allow clicks on marker icons to show popups, but don't create new markers
      if (target && target.closest('.leaflet-marker-icon')) {
        console.log('Click on marker icon - allowing popup to show');
        return;
      }
      
      // Allow clicks on drawing toolbar and controls but don't create markers
      if (target && (
        target.closest('.leaflet-draw') ||
        target.closest('.leaflet-draw-toolbar') ||
        target.closest('.leaflet-draw-actions') ||
        target.closest('.upload-button-container') ||
        target.closest('.upload-button-wrapper') ||
        target.closest('.image-controls-container') ||
        target.closest('.image-controls-wrapper')
      )) {
        console.log('Click on drawing toolbar or controls allowed but no marker creation');
        return;
      }
      
      // Only ignore clicks on actual drawn shapes (paths, SVG elements) but allow map clicks
      if (target && (
        target.tagName === 'path' ||
        target.tagName === 'svg' ||
        (target.closest('path') && !target.closest('.leaflet-draw-toolbar'))
      )) {
        console.log('Click on drawn shape ignored');
        return;
      }
      
      // For all other clicks on the map, create a new marker
      console.log('Map click allowed - creating marker at:', e.latlng);
      onMapClick(e.latlng);
    }
  });
  
  return null;
};

export default MapEvents;
