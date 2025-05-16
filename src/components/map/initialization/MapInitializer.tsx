
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
    
    // Clean up any existing Leaflet maps on this container
    const existingMap = L.DomUtil.get(containerElement) as any;
    if (existingMap && existingMap._leaflet_id) {
      console.log("Container already has a map, attempting to clean up");
      try {
        if (existingMap.remove) {
          existingMap.remove();
        }
        delete existingMap._leaflet_id;
      } catch (err) {
        console.warn("Error cleaning up existing map:", err);
      }
      
      // Brief delay to ensure cleanup completes
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setInitializationError(null); // Trigger re-attempt
      }, 100);
      
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
      
      // Notify that the map is initialized after a longer delay
      // This gives the map more time to fully initialize panes
      setTimeout(() => {
        if (!isMountedRef.current || !mapRef.current) return;
        
        try {
          // Double check map is valid before notifying
          if (!isMapValid(mapRef.current)) {
            console.warn("Map became invalid during initialization");
            mapInitializedRef.current = false;
            return;
          }
          
          // Ensure map has necessary panes
          const panes = mapRef.current.getPanes();
          if (!panes || !panes.tilePane) {
            console.warn("Map panes not fully initialized yet");
            
            // Retry initialization callback after additional delay
            setTimeout(() => {
              if (!isMountedRef.current || !mapRef.current) return;
              
              try {
                if (isMapValid(mapRef.current) && mapRef.current.getPanes().tilePane) {
                  console.log("Map panes now ready, calling initialization callback");
                  onMapInitialized(mapRef.current);
                }
              } catch (callbackError) {
                console.error("Error in delayed map initialization callback:", callbackError);
              }
            }, 300);
            return;
          }
          
          console.log("Map fully initialized, calling initialization callback");
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
      }, 400);
      
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
