
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
  const mountedRef = useRef<boolean>(true);
  const checkAttemptsRef = useRef<number>(0);
  
  // First, let's add a function to verify map is ready for tile operations
  const isMapReadyForTiles = (map: L.Map) => {
    try {
      if (!isMapValid(map)) return false;
      if (!map.getContainer()) return false;
      
      const panes = map.getPanes();
      if (!panes || !panes.tilePane || !panes.mapPane) {
        console.log("Map panes not fully initialized");
        return false;
      }
      
      return true;
    } catch (err) {
      console.warn("Error checking map readiness:", err);
      return false;
    }
  };
  
  // Function to attempt tile layer creation
  const createTileLayer = () => {
    if (!map || !mountedRef.current) return false;
    
    try {
      // Verify map is ready
      if (!isMapReadyForTiles(map)) {
        console.log("Map not ready for tile layer, will retry");
        return false;
      }
      
      // Check if the map already has a tile layer with the same URL
      let existingLayer = false;
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer && 
            (layer as any)._url && 
            (layer as any)._url.includes('openstreetmap')) {
          existingLayer = true;
        }
      });
      
      if (existingLayer) {
        console.log("Tile layer already exists, skipping creation");
        
        // Even with existing layer, consider tiles loaded
        if (!tilesLoadedFired.current && onTilesLoaded) {
          tilesLoadedFired.current = true;
          onTilesLoaded();
        }
        
        return true;
      }
      
      // Create the tile layer
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0,
        className: 'map-tiles',
        updateWhenIdle: true,
        updateWhenZooming: false
      });
      
      // Try SaferAddLayer pattern instead of direct add
      const saferAddLayer = () => {
        try {
          // Extra safety check to make sure map and DOM are still valid
          if (mountedRef.current && isMapReadyForTiles(map)) {
            tileLayer.addTo(map);
            console.log("Tile layer added successfully");
            tileLayerRef.current = tileLayer;
            
            // Set up event listeners
            tileLayer.on('load', () => {
              if (!tilesLoadedFired.current && mountedRef.current) {
                console.log('Tiles loaded successfully');
                tilesLoadedFired.current = true;
                if (onTilesLoaded) onTilesLoaded();
              }
            });
            
            // Force a refresh after adding layer
            setTimeout(() => {
              if (mountedRef.current && map && isMapValid(map)) {
                map.invalidateSize();
              }
            }, 100);
            
            return true;
          } else {
            console.log("Map no longer valid for adding tile layer");
            return false;
          }
        } catch (err) {
          console.error("Error in saferAddLayer:", err);
          return false;
        }
      };
      
      // Try to add the layer safely
      return saferAddLayer();
    } catch (err) {
      console.error("Error creating tile layer:", err);
      return false;
    }
  };
  
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial attempt with delay to ensure map is ready
    const initialTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      
      const success = createTileLayer();
      if (!success && tileLoadAttempts < 5) {
        console.log(`Tile layer creation failed, scheduling retry #${tileLoadAttempts + 1}`);
        setTileLoadAttempts(prev => prev + 1);
      }
    }, 300);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimer);
      
      if (tileLayerRef.current && map && isMapValid(map)) {
        try {
          map.removeLayer(tileLayerRef.current);
          tileLayerRef.current = null;
        } catch (err) {
          console.error("Error removing tile layer:", err);
        }
      }
    };
  }, []);
  
  // Effect for retry attempts
  useEffect(() => {
    if (tileLoadAttempts === 0 || !mountedRef.current) return;
    
    // Progressive backoff for retries
    const retryDelay = Math.min(500 * Math.pow(1.5, tileLoadAttempts - 1), 3000);
    
    const retryTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      
      console.log(`Attempting tile layer creation retry #${tileLoadAttempts}`);
      const success = createTileLayer();
      
      // If still not successful and under max retries, schedule another attempt
      if (!success && tileLoadAttempts < 5) {
        console.log("Tile layer creation still failed, will try again");
        setTileLoadAttempts(prev => prev + 1);
      } else if (!success) {
        console.log("Max tile layer retries reached");
        
        // Notify tiles loaded anyway after max retries
        if (!tilesLoadedFired.current && onTilesLoaded) {
          console.log("Notifying tiles loaded after max retries");
          tilesLoadedFired.current = true;
          onTilesLoaded();
        }
      }
    }, retryDelay);
    
    return () => clearTimeout(retryTimer);
  }, [tileLoadAttempts, map]);
  
  // Periodic check to ensure tiles are loaded
  useEffect(() => {
    if (tilesLoadedFired.current) return;
    
    const checkTimer = setInterval(() => {
      if (!mountedRef.current) return;
      
      checkAttemptsRef.current++;
      
      // If map is ready but no tiles loaded callback fired yet
      if (map && isMapReadyForTiles(map) && !tilesLoadedFired.current) {
        console.log("Map appears ready but tiles not loaded, forcing initialization");
        const success = createTileLayer();
        
        if (success || checkAttemptsRef.current > 5) {
          clearInterval(checkTimer);
          
          // Ensure callback is fired even if we're not sure tiles are loaded
          if (!tilesLoadedFired.current && onTilesLoaded) {
            console.log("Firing tiles loaded callback from periodic check");
            tilesLoadedFired.current = true;
            onTilesLoaded();
          }
        }
      }
      
      // After 10 checks, give up and assume tiles are loaded
      if (checkAttemptsRef.current > 10) {
        clearInterval(checkTimer);
        
        if (!tilesLoadedFired.current && onTilesLoaded) {
          console.log("Maximum checks reached, assuming tiles are loaded");
          tilesLoadedFired.current = true;
          onTilesLoaded();
        }
      }
    }, 1000); // Check every second
    
    return () => clearInterval(checkTimer);
  }, [map, onTilesLoaded]);
  
  return null;
};

export default TileLayer;
