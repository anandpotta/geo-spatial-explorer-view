
import { useRef, useState } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';

/**
 * Hook to manage the map instance and its lifecycle
 */
export function useMapInstance() {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapReady, setIsMapReady] = useState(false);
  const mapAttachedRef = useRef(false);
  
  // Initialize Leaflet icons
  const initializeLeaflet = () => {
    setupLeafletIcons();
    mapAttachedRef.current = false;
  };
  
  // Reset the map instance with a new key
  const regenerateMapInstance = () => {
    setMapInstanceKey(Date.now());
    setIsMapReady(false);
  };

  return {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    mapAttachedRef,
    setMapInstanceKey: regenerateMapInstance,
    initializeLeaflet
  };
}
