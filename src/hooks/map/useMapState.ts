
import { useState, useRef } from 'react';
import L from 'leaflet';

export function useMapState(selectedLocation?: { x: number, y: number }) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapReady, setIsMapReady] = useState(false);
  const mapAttachedRef = useRef(false);
  const initialFlyComplete = useRef(false);
  
  return {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    setMapInstanceKey,
    mapAttachedRef,
    initialFlyComplete,
    selectedLocation
  };
}
