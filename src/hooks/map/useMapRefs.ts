
import { useRef } from 'react';
import { isMapValid } from '@/utils/leaflet-type-utils';
import L from 'leaflet';

export function useMapRefs() {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const mapReadyRef = useRef<boolean>(false);
  const originalAddLayerRef = useRef<Function | null>(null);

  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
  };

  const handleLeafletMapRef = (map: L.Map) => {
    // Store the current implementation
    if (map && !originalAddLayerRef.current) {
      originalAddLayerRef.current = map.addLayer;
    }
    
    // Set the map reference
    leafletMapRef.current = map;
    
    // Only override addLayer if we haven't already
    if (map && originalAddLayerRef.current && map.addLayer === originalAddLayerRef.current) {
      // Replace addLayer with a safer version that checks DOM availability
      map.addLayer = function(layer) {
        try {
          // Check if map is still valid and has a container
          if (isMapValid(map) && map.getContainer()) {
            // Additional check for panes initialization
            const panes = map.getPanes();
            if (!panes || !panes.tilePane) {
              console.warn('Map panes not initialized yet, delaying layer addition');
              // Return map for chaining, but don't add layer yet
              setTimeout(() => {
                try {
                  if (isMapValid(map) && map.getContainer() && map.getPanes().tilePane) {
                    originalAddLayerRef.current!.call(this, layer);
                  }
                } catch (err) {
                  console.error('Error in delayed layer addition:', err);
                }
              }, 300);
              return map;
            }
            // Call the original method with proper context
            return originalAddLayerRef.current!.call(this, layer);
          } else {
            console.warn('Attempted to add layer to invalid map');
            return map; // Return map for chaining without adding layer
          }
        } catch (err) {
          console.error('Error adding layer:', err);
          return map; // Return map for chaining without adding layer
        }
      };
    }
  };

  const isMapReady = () => {
    return leafletMapRef.current && 
           isMapValid(leafletMapRef.current) && 
           leafletMapRef.current.getContainer() !== undefined &&
           leafletMapRef.current.getPanes().tilePane !== undefined;
  };

  const setMapReady = (ready: boolean) => {
    mapReadyRef.current = ready;
  };

  return {
    cesiumViewerRef,
    leafletMapRef,
    mapReadyRef,
    isMapReady,
    setMapReady,
    handleCesiumViewerRef,
    handleLeafletMapRef
  };
}
