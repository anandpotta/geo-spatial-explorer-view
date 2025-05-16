
import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { toast } from 'sonner';

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
  const isMountedRef = useRef(true);
  const mapRef = useRef<L.Map | null>(null);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      
      // Clean up map instance if needed
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (err) {
          console.error("Error cleaning up map:", err);
        }
      }
    };
  }, []);
  
  useEffect(() => {
    if (!containerElement || mapInitializedRef.current) return;
    
    // Check if the container already has a Leaflet map initialized
    if (containerElement._leaflet_id) {
      console.warn("Container already has a Leaflet map. Skipping initialization.");
      return;
    }
    
    try {
      mapInitializedRef.current = true;
      console.log("Initializing Leaflet map");
      
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
      
      // Store map reference
      mapRef.current = map;
      
      // Add an identifier to the map
      (map as any)._customInitTime = Date.now();
      
      // Initialize feature group for drawing
      const featureGroup = new L.FeatureGroup();
      map.addLayer(featureGroup);
      (window as any).featureGroup = featureGroup;
      
      // Notify that the map is initialized after a short delay
      // This gives tiles time to start loading
      setTimeout(() => {
        if (isMountedRef.current) {
          onMapInitialized(map);
        }
        
        // Force a map redraw after initialization
        setTimeout(() => {
          if (map && isMapValid(map) && isMountedRef.current) {
            map.invalidateSize(true);
            // Add additional redraw to ensure tiles load
            setTimeout(() => {
              if (map && isMapValid(map) && isMountedRef.current) {
                map.invalidateSize(true);
                // Trigger events to ensure all map components are properly initialized
                map.fire('load');
                map.fire('moveend');
              }
            }, 300);
          }
        }, 200);
      }, 100);
    } catch (err) {
      console.error("Map initialization error:", err);
      mapInitializedRef.current = false;
      
      if (isMountedRef.current) {
        toast.error("Failed to initialize map. Please try refreshing the page.");
      }
    }
    
    return () => {
      isMountedRef.current = false;
      mapInitializedRef.current = false;
      
      // Clean up map instance if needed
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (err) {
          console.error("Error cleaning up map:", err);
        }
      }
    };
  }, [containerElement, selectedLocation, onMapInitialized]);
  
  return null;
};

export default MapInitializer;
