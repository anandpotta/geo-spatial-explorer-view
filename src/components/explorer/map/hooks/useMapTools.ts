
import { toast } from 'sonner';
import { isMapValid } from '@/utils/leaflet-type-utils';

export function useMapTools(
  currentView: 'cesium' | 'leaflet',
  cesiumViewerRef: React.MutableRefObject<any>,
  leafletMapRef: React.MutableRefObject<any>
) {
  const handleZoomIn = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      // Use the zoomIn utility for Cesium
      import('@/utils/threejs-camera').then(({ zoomIn }) => {
        zoomIn(cesiumViewerRef.current);
      });
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        // Validate the map instance before using it
        if (isMapValid(leafletMapRef.current)) {
          leafletMapRef.current.zoomIn();
        } else {
          console.warn('Leaflet map instance is not valid for zoom in operation');
          toast.error('Map control error. Please try again.');
        }
      } catch (err) {
        console.error('Error during zoom in operation:', err);
        toast.error('Failed to zoom in. Please try again.');
      }
    }
  };

  const handleZoomOut = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      // Use the zoomOut utility for Cesium
      import('@/utils/threejs-camera').then(({ zoomOut }) => {
        zoomOut(cesiumViewerRef.current);
      });
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        // Validate the map instance before using it
        if (isMapValid(leafletMapRef.current)) {
          leafletMapRef.current.zoomOut();
        } else {
          console.warn('Leaflet map instance is not valid for zoom out operation');
          toast.error('Map control error. Please try again.');
        }
      } catch (err) {
        console.error('Error during zoom out operation:', err);
        toast.error('Failed to zoom out. Please try again.');
      }
    }
  };

  const handleResetView = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      // Use the resetCamera utility for Cesium
      import('@/utils/threejs-camera').then(({ resetCamera }) => {
        resetCamera(cesiumViewerRef.current);
      });
      toast.info('View reset');
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        // Validate the map instance before using it
        if (isMapValid(leafletMapRef.current)) {
          leafletMapRef.current.setView([51.505, -0.09], 13);
          toast.info('View reset');
        } else {
          console.warn('Leaflet map instance is not valid for reset operation');
          toast.error('Map control error. Please try again.');
        }
      } catch (err) {
        console.error('Error during reset operation:', err);
        toast.error('Failed to reset view. Please try again.');
      }
    }
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
      } catch (err) {
        console.error('Error during clear all operation:', err);
      }
    }
  };

  return {
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleClearAll
  };
}
