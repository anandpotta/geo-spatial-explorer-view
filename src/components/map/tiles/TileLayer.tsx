
import React, { useRef, useEffect, useState } from 'react';
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
  const [tileLoadAttempts, setTileLoadAttempts] = useState(0);
  
  useEffect(() => {
    if (!map) {
      console.log("Map not provided for tile layer");
      return;
    }
    
    // Verify map is valid before proceeding
    if (!isMapValid(map)) {
      console.log("Map not valid for tile layer");
      
      // Try again after a delay if attempts are limited
      if (tileLoadAttempts < 3) {
        const retryTimeout = setTimeout(() => {
          setTileLoadAttempts(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(retryTimeout);
      }
      return;
    }
    
    let isMounted = true;
    
    // Small delay to ensure map is fully initialized
    const initTimeout = setTimeout(() => {
      try {
        // Check if map is still valid and has required properties
        if (!isMounted || !isMapValid(map)) {
          console.log("Map became invalid during tile initialization");
          return;
        }
        
        // Verify critical map properties
        if (!map.getContainer() || !(map as any)._leaflet_id) {
          console.log("Map missing critical properties, delaying tile layer");
          return;
        }

        // Ensure map panes are initialized
        const panes = map.getPanes();
        if (!panes || !panes.tilePane) {
          console.log("Map panes not ready, delaying tile layer creation");
          if (tileLoadAttempts < 5) {
            setTimeout(() => {
              setTileLoadAttempts(prev => prev + 1);
            }, 500);
          }
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
          // Create the tile layer
          try {
            const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19,
              tileSize: 256,
              zoomOffset: 0,
              className: 'map-tiles',
              updateWhenIdle: true,
              updateWhenZooming: false
            });
            
            // Additional safety check before adding layer
            if (isMapValid(map) && map.getContainer() && map.getPanes().tilePane) {
              // Add layer with explicit error handling
              try {
                tileLayer.addTo(map); // Use addTo instead of directly calling map.addLayer
                console.log("Tile layer added successfully");
                
                // Force opacity to ensure visibility
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
                
                // Listen for tile error events with limited logging
                typedTileLayer.on('tileerror', () => {
                  // Only log first few errors to avoid console spam
                  if (tileLoadAttempts < 3) {
                    console.warn('Tile loading error occurred');
                  }
                });
              } catch (addErr) {
                console.error("Error adding tile layer:", addErr);
              }
            } else {
              console.log("Map became invalid, cannot add tile layer");
              
              // Try again with a delay if map isn't ready
              if (tileLoadAttempts < 4) {
                setTimeout(() => {
                  setTileLoadAttempts(prev => prev + 1);
                }, 800);
              }
            }
          } catch (createErr) {
            console.error("Error creating tile layer:", createErr);
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
        
      } catch (err) {
        console.error("Error initializing tile layer:", err);
        if (isMounted && tileLoadAttempts < 2) {
          toast.error("Error loading map tiles. Retrying...");
        }
      }
    }, Math.max(300, tileLoadAttempts * 200)); // Progressively longer delay for retries
    
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
  }, [map, onTilesLoaded, tileLoadAttempts]);
  
  return null;
};

export default TileLayer;
