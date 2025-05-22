
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

export function useClearMapOperations(
  currentView: 'cesium' | 'leaflet',
  leafletMapRef: React.RefObject<any>
) {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const requestClearAll = () => {
    setIsClearDialogOpen(true);
  };

  const handleClearAll = () => {
    if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        const layers = leafletMapRef.current._layers;
        if (layers) {
          Object.keys(layers).forEach(layerId => {
            const layer = layers[layerId];
            if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
              leafletMapRef.current.removeLayer(layer);
            }
          });
        }
        
        // Clear any SVG paths
        window.dispatchEvent(new CustomEvent('clearAllSvgPaths'));
        
        // Clear any markers from storage
        localStorage.removeItem('savedMarkers');
        localStorage.removeItem('savedDrawings');
        localStorage.removeItem('svgPaths');
        
        // Notify components
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('markersUpdated'));
        window.dispatchEvent(new Event('drawingsUpdated'));
        
        toast({
          title: "Map Cleared",
          description: "All drawings and markers have been removed from the map.",
        });
      } catch (err) {
        console.error('Error during clear all operation:', err);
      }
      
      setIsClearDialogOpen(false);
    }
  };

  const handleCancelClear = () => {
    setIsClearDialogOpen(false);
  };

  return {
    isClearDialogOpen,
    requestClearAll,
    handleClearAll,
    handleCancelClear
  };
}
