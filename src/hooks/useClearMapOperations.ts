
import { useCallback, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { clearAllMapData, resetMap } from '@/utils/clear-operations/clear-map-refreshes';

/**
 * Hook providing clear map operations with toast notifications and confirmation dialog
 */
export function useClearMapOperations(
  currentView: 'cesium' | 'leaflet',
  leafletMapRef: React.RefObject<any>
) {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const requestClearAll = useCallback(() => {
    setIsClearDialogOpen(true);
  }, []);

  const handleClearAll = useCallback(() => {
    if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        // First remove any active layers from the map
        const layers = leafletMapRef.current._layers;
        if (layers) {
          Object.keys(layers).forEach(layerId => {
            const layer = layers[layerId];
            if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
              leafletMapRef.current.removeLayer(layer);
            }
          });
        }
        
        // Then use our utility to clear everything else
        resetMap();
        
        toast({
          title: "Map Cleared",
          description: "All drawings and markers have been removed from the map.",
        });
      } catch (err) {
        console.error('Error during clear all operation:', err);
      }
      
      setIsClearDialogOpen(false);
    }
  }, [currentView, leafletMapRef]);

  const handleCancelClear = useCallback(() => {
    setIsClearDialogOpen(false);
  }, []);

  return {
    isClearDialogOpen,
    requestClearAll,
    handleClearAll,
    handleCancelClear
  };
}
