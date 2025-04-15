
import { useEffect } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';

interface MapLayersProps {
  map: L.Map;
}

export const MapLayers = ({ map }: MapLayersProps) => {
  useEffect(() => {
    addOsmBuildingsLayer(map);
  }, [map]);

  return null;
};

const addOsmBuildingsLayer = (map: L.Map) => {
  const probeUrl = 'https://tile.osmbuildings.org/0.2/dixw8kmb/tile/1/1/1.json';
  
  fetch(probeUrl, { 
    method: 'HEAD',
    mode: 'no-cors'
  })
  .then(() => {
    try {
      L.tileLayer('https://tile.osmbuildings.org/0.2/dixw8kmb/tile/{z}/{x}/{y}.png', {
        attribution: '© OSM Buildings',
        maxZoom: 19
      }).addTo(map);
      
      console.log("OSM Buildings layer added");
    } catch (error) {
      console.warn("Error adding OSM Buildings layer:", error);
      addFallbackLayer(map);
    }
  })
  .catch(error => {
    console.warn("OSM Buildings service unavailable:", error);
    addFallbackLayer(map);
  });
};

const addFallbackLayer = (map: L.Map) => {
  console.log("Using fallback map layer");
  
  map.createPane('buildings');
  if (map.getPane('buildings')) {
    map.getPane('buildings').style.zIndex = '450';
  }
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    pane: 'buildings',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
  
  toast.info("Using standard map. 3D buildings unavailable.", {
    duration: 3000
  });
};
