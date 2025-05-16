
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
  const initAttemptsRef = useRef(0);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
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
    // Skip if already initialized, no container, or too many attempts
    if (!containerElement || mapInitializedRef.current || initAttemptsRef.current > 3) return;
    
    // Skip if container is not attached to the DOM
    if (!document.body.contains(containerElement)) {
      console.warn("Container not in DOM, skipping initialization");
      return;
    }
    
    // Check if the container already has a Leaflet map initialized
    if (containerElement._leaflet_id) {
      console.warn("Container already has a Leaflet map. Skipping initialization.");
      setInitializationError("Map already initialized");
      return;
    }
    
    try {
      // Track initialization attempt
      initAttemptsRef.current++;
      console.log(`Initializing Leaflet map (attempt ${initAttemptsRef.current})`);
      
      // Reset any previous error
      setInitializationError(null);
      
      // Create the map instance with improved error handling
      const defaultCenter = selectedLocation ? [selectedLocation.y, selectedLocation.x] : [0, 0];
      const defaultZoom = selectedLocation ? 16 : 2;
      
      // Create the map with required options
      const map = L.map(containerElement, {
        center: defaultCenter as [number, number],
        zoom: defaultZoom,
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
      mapInitializedRef.current = true;
      
      // Add an identifier to the map
      (map as any)._customInitTime = Date.now();
      
      // Initialize feature group for drawing
      try {
        const featureGroup = new L.FeatureGroup();
        map.addLayer(featureGroup);
        (window as any).featureGroup = featureGroup;
      } catch (featureError) {
        console.warn("Non-critical error initializing feature group:", featureError);
      }
      
      // Force initial view to make sure it's set
      try {
        map.setView(defaultCenter as [number, number], defaultZoom, { animate: false });
      } catch (viewError) {
        console.warn("Error setting initial view:", viewError);
      }
      
      // Notify that the map is initialized after a short delay
      // This gives tiles time to start loading
      setTimeout(() => {
        if (!isMountedRef.current || !mapRef.current) return;
        
        try {
          // Double check map is valid before notifying
          if (!isMapValid(mapRef.current)) {
            console.warn("Map became invalid during initialization");
            mapInitializedRef.current = false;
            return;
          }
          
          onMapInitialized(mapRef.current);
          
          // Force a map redraw after initialization
          setTimeout(() => {
            if (!mapRef.current || !isMountedRef.current) return;
            
            try {
              mapRef.current.invalidateSize(true);
              // Trigger events to ensure all map components are properly initialized
              mapRef.current.fire('load');
              mapRef.current.fire('moveend');
            } catch (invalidateErr) {
              console.warn("Error during map invalidation:", invalidateErr);
            }
          }, 300);
        } catch (callbackError) {
          console.error("Error in map initialization callback:", callbackError);
        }
      }, 200);
      
    } catch (err) {
      console.error("Map initialization error:", err);
      setInitializationError("Failed to initialize map");
      mapInitializedRef.current = false;
      
      if (isMountedRef.current && initAttemptsRef.current <= 2) {
        // Try again after a delay
        setTimeout(() => {
          mapInitializedRef.current = false;
          // Force effect to run again
          setInitializationError(null);
        }, 1000);
      } else if (isMountedRef.current) {
        toast.error("Failed to initialize map. Please try refreshing the page.");
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [containerElement, selectedLocation, onMapInitialized, initializationError]);
  
  // Use another useEffect to handle cleanup
  useEffect(() => {
    return () => {
      mapInitializedRef.current = false;
    };
  }, []);
  
  return null;
};

export default MapInitializer;
