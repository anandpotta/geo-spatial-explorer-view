
import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { isMapValid } from '@/utils/leaflet-type-utils';

interface MapInitializerProps {
  containerElement: HTMLElement;
  selectedLocation?: Location;
  onMapInitialized: (map: L.Map) => void;
}

const MapInitializer: React.FC<MapInitializerProps> = ({
  containerElement,
  selectedLocation,
  onMapInitialized
}) => {
  const mapInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!containerElement || mapInitializedRef.current) return;
    
    mapInitializedRef.current = true;
    console.log("Initializing Leaflet map");
    
    try {
      // Create the map instance
      const map = L.map(containerElement, {
        center: selectedLocation ? [selectedLocation.y, selectedLocation.x] : [0, 0],
        zoom: selectedLocation ? 16 : 2,
        zoomControl: false,
        attributionControl: true,
        minZoom: 1,
        maxZoom: 19,
        fadeAnimation: true,
        zoomAnimation: true,
        // Add rendering options to improve tile loading
        renderer: L.canvas(),
        preferCanvas: true
      });
      
      // Initialize feature group for drawing
      const featureGroup = new L.FeatureGroup();
      // Use any type to bypass TypeScript's strict checking temporarily
      (map as any).addLayer(featureGroup);
      window.featureGroup = featureGroup;
      
      // Notify that the map is initialized
      onMapInitialized(map);
      
      // Force a map redraw after initialization
      setTimeout(() => {
        if (map && isMapValid(map)) {
          map.invalidateSize(true);
          // Add additional redraw to ensure tiles load
          setTimeout(() => {
            map.invalidateSize(true);
            // Trigger events to ensure all map components are properly initialized
            map.fire('load');
            map.fire('moveend');
          }, 200);
        }
      }, 100);
    } catch (err) {
      console.error("Map initialization error:", err);
      mapInitializedRef.current = false;
    }
    
    return () => {
      mapInitializedRef.current = false;
    };
  }, [containerElement, selectedLocation, onMapInitialized]);
  
  return null;
};

export default MapInitializer;
