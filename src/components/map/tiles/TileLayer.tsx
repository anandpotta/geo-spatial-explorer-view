
import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import { isMapValid } from '@/utils/leaflet-type-utils';

interface TileLayerProps {
  map: L.Map;
  onTilesLoaded?: () => void;
}

const TileLayer: React.FC<TileLayerProps> = ({ map, onTilesLoaded }) => {
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tilesLoadedFired = useRef<boolean>(false);
  
  useEffect(() => {
    if (!map || !isMapValid(map)) {
      console.log("Map not ready for tile layer");
      return;
    }
    
    // Small delay to ensure map is fully initialized
    const initTimeout = setTimeout(() => {
      try {
        // Check if map still valid after timeout
        if (!isMapValid(map)) {
          console.log("Map became invalid during tile initialization");
          return;
        }

        // Add tile layer with optimizations
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          tileSize: 256,
          zoomOffset: 0,
          className: 'map-tiles',
          updateWhenIdle: true,
          updateWhenZooming: false
        });
        
        // Add the tile layer to the map with proper type handling
        try {
          // Type assertion needed due to TypeScript's strict checking
          map.addLayer(tileLayer as unknown as L.Layer);
          console.log("Tile layer added successfully");
        } catch (err) {
          console.error("Error adding tile layer:", err);
          toast.error("Failed to load map tiles. Please try refreshing the page.");
        }
        
        // Set opacity explicitly to ensure visibility
        tileLayer.setOpacity(1.0);
        tileLayerRef.current = tileLayer;
        
        // Listen for tile load events
        const typedTileLayer = tileLayer as any;
        typedTileLayer.on('load', () => {
          if (tilesLoadedFired.current) return; // Prevent multiple callbacks
          
          console.log('Tiles loaded successfully');
          tilesLoadedFired.current = true;
          if (onTilesLoaded) {
            onTilesLoaded();
          }
        });
        
        // Listen for tile error events
        typedTileLayer.on('tileerror', (error: any) => {
          console.error('Tile loading error:', error);
        });
        
        // Manually trigger view update after a delay to ensure tile loading
        setTimeout(() => {
          try {
            if (isMapValid(map)) {
              map.invalidateSize(true);
              const currentZoom = map.getZoom();
              map.setZoom(currentZoom);
            }
          } catch (err) {
            console.error("Error during map refresh:", err);
          }
        }, 500);
        
      } catch (err) {
        console.error("Error initializing tile layer:", err);
      }
    }, 100); // Small delay for better sequencing
    
    // Cleanup
    return () => {
      clearTimeout(initTimeout);
      if (tileLayerRef.current && map && isMapValid(map)) {
        try {
          map.removeLayer(tileLayerRef.current as unknown as L.Layer);
          tileLayerRef.current = null;
        } catch (err) {
          console.error("Error removing tile layer:", err);
        }
      }
    };
  }, [map, onTilesLoaded]);
  
  return null;
};

export default TileLayer;
