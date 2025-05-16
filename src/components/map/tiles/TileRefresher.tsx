
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
  const refreshAttemptsRef = useRef(0);
  
  // Add extra tile refresh logic to ensure tiles load properly
  useEffect(() => {
    // Only run this effect when the map is ready
    if (!map || !isMapReady || !isMapValid(map)) return;
    
    // Force refresh tiles occasionally
    const refreshTiles = () => {
      try {
        if (!map || !isMapValid(map)) {
          console.log("Map not valid during tile refresh");
          return;
        }
        
        // Increment refresh attempts counter
        refreshAttemptsRef.current += 1;
        
        // Only log on occasional refreshes to avoid console spam
        if (refreshAttemptsRef.current % 3 === 0) {
          console.log(`Forcing tile refresh (attempt ${refreshAttemptsRef.current})`);
        }
        
        // First invalidate the map size
        map.invalidateSize(true);
        
        // Find existing tile layers
        let existingTileLayer: L.TileLayer | null = null;
        
        try {
          map.eachLayer((layer) => {
            if ((layer as any)._url && (layer as any)._url.includes('openstreetmap')) {
              existingTileLayer = layer as L.TileLayer;
            }
          });
        } catch (err) {
          console.warn("Error finding tile layers:", err);
        }
        
        // If there's no tile layer already or we've reached the renewal threshold
        if (!existingTileLayer || refreshAttemptsRef.current % 10 === 0) {
          const currentZoom = map.getZoom();
          const currentCenter = map.getCenter();
          
          // Create and add a new tile layer
          const newTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
            className: 'map-tiles-refreshed'
          });
          
          try {
            // Add the new layer first, then remove the old one if it exists
            map.addLayer(newTileLayer as unknown as L.Layer);
            
            if (existingTileLayer) {
              setTimeout(() => {
                try {
                  if (isMapValid(map)) {
                    map.removeLayer(existingTileLayer as unknown as L.Layer);
                  }
                } catch (e) {
                  console.warn("Error removing old tile layer:", e);
                }
              }, 1000); // Delay removal to ensure new tiles have loaded
            }
            
            tileLayerRef.current = newTileLayer;
          } catch (err) {
            console.error("Error during tile layer refresh:", err);
          }
          
          // Reset view to ensure tiles load properly
          const resetViewTimeout = setTimeout(() => {
            if (map && isMapValid(map)) {
              map.setView(currentCenter, currentZoom, { animate: false });
            }
          }, 100);
          timeoutRefsArray.current.push(resetViewTimeout);
        }
        
        // Simply set zoom level to force tile update in other cases
        else if (isMapValid(map)) {
          const currentZoom = map.getZoom();
          map.setZoom(currentZoom);
        }
      } catch (error) {
        console.error("Error during tile refresh:", error);
      }
    };
    
    // Initial tile refresh after map is ready with progressive delay
    const initialRefreshTimeout = setTimeout(refreshTiles, 800);
    timeoutRefsArray.current.push(initialRefreshTimeout);
    
    // Second refresh with longer delay for cases where first refresh didn't work
    const secondRefreshTimeout = setTimeout(refreshTiles, 2000);
    timeoutRefsArray.current.push(secondRefreshTimeout);
    
    // Periodic tile refreshes at longer intervals
    const periodicRefreshInterval = setInterval(refreshTiles, 8000);
    
    return () => {
      clearInterval(periodicRefreshInterval);
      timeoutRefsArray.current.forEach(clearTimeout);
      timeoutRefsArray.current = [];
    };
  }, [map, isMapReady]);
  
  return null;
};

export default TileRefresher;
