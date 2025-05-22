
import { useRef } from 'react';
import { isMapValid } from '@/utils/leaflet-type-utils';
import L from 'leaflet';

export function useMapRefs() {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const mapReadyRef = useRef<boolean>(false);

  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
  };

  const handleLeafletMapRef = (map: L.Map) => {
    leafletMapRef.current = map;
    
    // Store original addLayer function to wrap it with validation
    const originalAddLayer = map.addLayer;
    
    // Replace addLayer with a safer version that checks DOM availability
    map.addLayer = function(layer) {
      try {
        // Check if map is still valid and has a container
        if (isMapValid(map) && map.getContainer()) {
          return originalAddLayer.call(this, layer);
        } else {
          console.warn('Attempted to add layer to invalid map');
          return map; // Return map for chaining without adding layer
        }
      } catch (err) {
        console.error('Error adding marker:', err);
        return map; // Return map for chaining without adding layer
      }
    };
  };

  const isMapReady = () => {
    return leafletMapRef.current && isMapValid(leafletMapRef.current) && 
           leafletMapRef.current.getContainer() !== undefined;
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
