
import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';

interface TileLayerProps {
  map: L.Map;
  onTilesLoaded?: () => void;
}

const TileLayer: React.FC<TileLayerProps> = ({ map, onTilesLoaded }) => {
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  useEffect(() => {
    if (!map) return;
    
    try {
      // Add tile layer with optimizations for initial loading
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        // Standard tile size for better quality
        tileSize: 256,
        zoomOffset: 0,
        className: 'map-tiles', // Add class for CSS targeting
        updateWhenIdle: false, // Update even when map is moving
        updateWhenZooming: false // Update during zoom operations
      });
      
      // Add the tile layer to the map with proper type handling
      try {
        // Use proper type casting for better compatibility
        map.addLayer(tileLayer as unknown as L.Layer);
      } catch (err) {
        console.error("Error adding tile layer:", err);
        toast.error("Failed to load map tiles. Please try refreshing the page.");
      }
      
      // Set opacity explicitly to ensure visibility
      tileLayer.setOpacity(1.0);
      
      tileLayerRef.current = tileLayer;
      
      // Listen for tile load events with safer type handling
      const typedTileLayer = tileLayer as any;
      typedTileLayer.on('load', () => {
        console.log('Tiles loaded successfully');
        if (onTilesLoaded) {
          onTilesLoaded();
        }
      });
      
      // Listen for tile error events
      typedTileLayer.on('tileerror', (error: any) => {
        console.error('Tile loading error:', error);
      });
      
      // Force tile loading by triggering pan
      setTimeout(() => {
        try {
          const center = map.getCenter();
          map.panTo([center.lat + 0.0001, center.lng + 0.0001]);
          setTimeout(() => map.panTo(center), 100);
        } catch (err) {
          console.error("Error during map pan:", err);
        }
      }, 300);
    } catch (err) {
      console.error("Error initializing tile layer:", err);
    }
    
    // Cleanup
    return () => {
      if (tileLayerRef.current && map) {
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
