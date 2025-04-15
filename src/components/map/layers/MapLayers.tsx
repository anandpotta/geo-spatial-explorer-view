
import { useEffect } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';

interface MapLayersProps {
  map: L.Map;
}

export const MapLayers = ({ map }: MapLayersProps) => {
  useEffect(() => {
    // Skip external OSM Buildings layer attempt and use fallback directly
    addFallbackLayer(map);
  }, [map]);

  return null;
};

// Removed the external OSM Buildings layer function since it's causing errors

const addFallbackLayer = (map: L.Map) => {
  console.log("Using fallback map layer");
  
  // Create a buildings pane to ensure proper z-index
  map.createPane('buildings');
  if (map.getPane('buildings')) {
    map.getPane('buildings').style.zIndex = '450';
  }
  
  // Add a standard OpenStreetMap layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    pane: 'buildings',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
  
  // Let the user know we're in simplified mode
  toast.info("Using standard map view", {
    duration: 3000
  });
};
