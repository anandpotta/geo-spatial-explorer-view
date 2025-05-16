
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';

interface TileRefresherProps {
  map: L.Map | null;
  isMapReady: boolean;
}

const TileRefresher: React.FC<TileRefresherProps> = ({ map, isMapReady }) => {
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const timeoutRefsArray = useRef<NodeJS.Timeout[]>([]);
  
  // Add extra tile refresh logic to ensure tiles load properly
  useEffect(() => {
    // Only run this effect when the map is ready
    if (!map || !isMapValid(map)) return;
    
    // Force refresh tiles occasionally
    const refreshTiles = () => {
      try {
        if (map && isMapValid(map)) {
          console.log("Forcing tile refresh");
          
          // First invalidate the map size
          map.invalidateSize(true);
          
          // If there's an existing tile layer, remove and re-add it
          if (tileLayerRef.current) {
            const currentZoom = map.getZoom();
            const currentCenter = map.getCenter();
            
            map.removeLayer(tileLayerRef.current as unknown as L.Layer);
            
            // Create and add a new tile layer
            const newTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19
            });
            
            // Use proper type casting
            map.addLayer(newTileLayer as unknown as L.Layer);
            
            tileLayerRef.current = newTileLayer;
            
            // Reset view to ensure tiles load properly
            const resetViewTimeout = setTimeout(() => {
              if (map && isMapValid(map)) {
                map.setView(currentCenter, currentZoom, { animate: false });
              }
            }, 100);
            timeoutRefsArray.current.push(resetViewTimeout);
          }
        }
      } catch (error) {
        console.error("Error during tile refresh:", error);
      }
    };
    
    // Initial tile refresh after map is ready
    const initialRefreshTimeout = setTimeout(refreshTiles, 500);
    timeoutRefsArray.current.push(initialRefreshTimeout);
    
    // Periodic tile refreshes
    const periodicRefreshInterval = setInterval(refreshTiles, 5000);
    
    return () => {
      clearInterval(periodicRefreshInterval);
      timeoutRefsArray.current.forEach(clearTimeout);
      timeoutRefsArray.current = [];
    };
  }, [map, isMapReady]);
  
  return null;
};

export default TileRefresher;
