
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export function useFeatureGroupInitialization(featureGroup: L.FeatureGroup | null) {
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Add safety mechanism to prevent errors when feature group is not initialized
    if (featureGroup && !initializedRef.current) {
      // Apply patch to ensure all needed methods exist in a type-safe way
      if (!featureGroup.eachLayer) {
        const eachLayerFn = function(this: L.FeatureGroup, cb: (layer: L.Layer) => void) {
          // Use type assertion to access internal _layers property
          const layers = (this as any)._layers;
          if (layers) {
            Object.keys(layers).forEach(key => {
              cb(layers[key]);
            });
          }
          return this; // Return this for chaining
        };
        
        // Explicitly cast the function to avoid TypeScript errors
        (featureGroup as any).eachLayer = eachLayerFn;
      }
      
      // Store map reference globally to help with cleanup operations
      if ((featureGroup as any)._map) {
        (window as any).leafletMap = (featureGroup as any)._map;
      }
      
      // Mark as initialized
      initializedRef.current = true;
    }
  }, [featureGroup]);
}
