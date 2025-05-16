
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
    
    let isMounted = true;
    
    // Small delay to ensure map is fully initialized
    const initTimeout = setTimeout(() => {
      try {
        // Check if component is still mounted and map is valid
        if (!isMounted || !isMapValid(map)) {
          console.log("Component unmounted or map became invalid during tile initialization");
          return;
        }

        // Check if the map already has a tile layer with the same URL
        let existingLayer = false;
        try {
          map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer && 
                (layer as any)._url && 
                (layer as any)._url.includes('openstreetmap')) {
              existingLayer = true;
            }
          });
        } catch (err) {
          console.warn("Error checking existing layers:", err);
        }
        
        // Only add a new layer if one doesn't exist already
        if (!existingLayer) {
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
          
          // Add the tile layer to the map with proper error handling
          try {
            // Ensure map is valid before adding layer
            if (isMapValid(map)) {
              // Using as any to bypass TypeScript issue with layer types
              map.addLayer(tileLayer as any);
              console.log("Tile layer added successfully");
              
              // Set opacity explicitly to ensure visibility
              tileLayer.setOpacity(1.0);
              tileLayerRef.current = tileLayer;
              
              // Listen for tile load events
              const typedTileLayer = tileLayer as any;
              typedTileLayer.on('load', () => {
                if (tilesLoadedFired.current || !isMounted) return;
                
                console.log('Tiles loaded successfully');
                tilesLoadedFired.current = true;
                if (onTilesLoaded && isMounted) {
                  onTilesLoaded();
                }
              });
              
              // Listen for tile error events
              typedTileLayer.on('tileerror', (error: any) => {
                console.error('Tile loading error:', error);
              });
            }
          } catch (err) {
            console.error("Error adding tile layer:", err);
            if (isMounted) {
              toast.error("Failed to load map tiles. Please try refreshing the page.");
            }
          }
        } else {
          console.log("Tile layer already exists, skipping creation");
          // Even with existing layer, consider tiles loaded after delay
          setTimeout(() => {
            if (isMounted && !tilesLoadedFired.current && onTilesLoaded) {
              console.log('Assuming tiles loaded with existing layer');
              tilesLoadedFired.current = true;
              onTilesLoaded();
            }
          }, 1000);
        }
        
        // Manually trigger view update after a delay to ensure tile loading
        const refreshTimeout = setTimeout(() => {
          try {
            if (isMounted && isMapValid(map)) {
              map.invalidateSize(true);
              // Only try to adjust zoom if map is valid and has position
              try {
                const currentZoom = map.getZoom();
                if (typeof currentZoom === 'number') {
                  map.setZoom(currentZoom);
                }
              } catch (zoomErr) {
                console.warn("Non-critical error during zoom refresh:", zoomErr);
              }
            }
          } catch (err) {
            console.warn("Error during map refresh:", err);
          }
        }, 500);
        
        return () => {
          clearTimeout(refreshTimeout);
        };
        
      } catch (err) {
        console.error("Error initializing tile layer:", err);
      }
    }, 200); // Longer delay for better initialization sequence
    
    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      
      if (tileLayerRef.current && map && isMapValid(map)) {
        try {
          map.removeLayer(tileLayerRef.current as any);
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
