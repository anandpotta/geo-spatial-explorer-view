
import { useEffect } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';

export const useLayerStyles = (selectedBuildingId: string | null | undefined, drawnLayers: Record<string, L.Layer>) => {
  useEffect(() => {
    if (selectedBuildingId) {
      Object.entries(drawnLayers).forEach(([id, layer]) => {
        if ('setStyle' in layer) {
          const pathLayer = layer as L.Path;
          pathLayer.setStyle({
            color: '#1EAEDB',
            weight: 3,
            opacity: 0.8,
            fillColor: '#D3E4FD',
            fillOpacity: 0.5
          });
        }
      });
      
      if (drawnLayers[selectedBuildingId] && 'setStyle' in drawnLayers[selectedBuildingId]) {
        const selectedLayer = drawnLayers[selectedBuildingId] as L.Path;
        selectedLayer.setStyle({
          color: '#FFA500',
          weight: 4,
          opacity: 1,
          fillColor: '#FFD700',
          fillOpacity: 0.7
        });
        
        if ('bringToFront' in selectedLayer) {
          selectedLayer.bringToFront();
        }
        
        toast.info("Selected building highlighted on map");
      }
    }
  }, [selectedBuildingId, drawnLayers]);
};
